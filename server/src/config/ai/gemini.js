import env from "../env/index.js";
import ApiError from "../../utils/ApiError.js";

// Google Generative Language REST API. Called directly with fetch rather than
// through an SDK: the surface we need is small and stable, and this keeps the
// server free of another dependency that can drift out of sync.
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

// Approximate USD per 1M tokens, used only for the cost figure logged against
// each interaction — it is an estimate, not billing data. Update from Google's
// current pricing page; unknown models fall back to FALLBACK_RATE.
const FALLBACK_RATE = { input: 0.3, output: 2.5 };

const PRICING = {
  "gemini-3.5-flash": { input: 0.3, output: 2.5 },
  "gemini-3.1-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

export const isGeminiConfigured = () => Boolean(env.GEMINI_API_KEY);

export const defaultModel = () => env.GEMINI_MODEL;

const estimateCost = (model, promptTokens, outputTokens) => {
  const rate = PRICING[model] || FALLBACK_RATE;
  return (
    (promptTokens / 1_000_000) * rate.input +
    (outputTokens / 1_000_000) * rate.output
  );
};

const requireKey = () => {
  if (!isGeminiConfigured()) {
    throw new ApiError(
      503,
      "AI is not configured. Add GEMINI_API_KEY to the server environment.",
      [],
      "AI_NOT_CONFIGURED"
    );
  }
};

// One raw round-trip. Shared by generate() and runConversation().
const request = async (body, model) => {
  let res;

  try {
    res = await fetch(`${API_ROOT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    throw new ApiError(
      504,
      `Could not reach the Gemini API: ${error.message}`,
      [],
      "AI_UNREACHABLE"
    );
  }

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status === 429 ? 429 : 502,
      payload?.error?.message || `Gemini request failed (${res.status}).`,
      [],
      "AI_REQUEST_FAILED"
    );
  }

  const candidate = payload.candidates?.[0];

  if (!candidate) {
    const blocked = payload.promptFeedback?.blockReason;
    throw new ApiError(
      422,
      blocked
        ? `Gemini declined to answer (${blocked}).`
        : "Gemini returned no response.",
      [],
      "AI_NO_CANDIDATE"
    );
  }

  return { payload, candidate };
};

const textOf = (candidate) =>
  (candidate.content?.parts || [])
    .map((p) => p.text)
    .filter(Boolean)
    .join("")
    .trim();

const usageOf = (payload) => {
  const u = payload.usageMetadata || {};
  const prompt = u.promptTokenCount || 0;
  const completion = u.candidatesTokenCount || 0;
  return { prompt, completion, total: u.totalTokenCount || prompt + completion };
};

/**
 * Single-shot generation. Optionally forces JSON via a response schema, and
 * optionally accepts an image for vision.
 */
export const generate = async ({
  prompt,
  system,
  model = env.GEMINI_MODEL,
  temperature = 0.4,
  maxOutputTokens = 4096,
  schema,
  image,
} = {}) => {
  requireKey();

  const parts = [{ text: prompt }];

  if (image?.data) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType || "image/jpeg",
        data: image.data,
      },
    });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(schema
        ? { responseMimeType: "application/json", responseSchema: schema }
        : {}),
    },
  };

  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const startedAt = Date.now();
  const { payload, candidate } = await request(body, model);
  const text = textOf(candidate);

  if (!text) {
    throw new ApiError(
      422,
      candidate.finishReason === "MAX_TOKENS"
        ? "The response was cut off before any text was produced. Try a shorter request."
        : `Gemini returned an empty response (${candidate.finishReason || "unknown"}).`,
      [],
      "AI_EMPTY_RESPONSE"
    );
  }

  const usage = usageOf(payload);

  let json = null;
  if (schema) {
    try {
      json = JSON.parse(text);
    } catch {
      // Leave json null — callers fall back to the raw text.
    }
  }

  return {
    text,
    json,
    model,
    responseTime: Date.now() - startedAt,
    usage,
    estimatedCost: estimateCost(model, usage.prompt, usage.completion),
  };
};

/**
 * Multi-turn conversation with tool calling.
 *
 * The model may answer directly, or ask to run one or more tools; each call is
 * executed via `onToolCall` and fed back until it produces a final answer.
 *
 * Two details the API is strict about:
 *  - The model's turn must be echoed back *verbatim*. Thinking models attach a
 *    `thoughtSignature` to functionCall parts and reject the follow-up if it is
 *    missing, so the part cannot be reconstructed by hand.
 *  - Each functionResponse must carry the same `id` as its functionCall.
 */
export const runConversation = async ({
  contents,
  system,
  tools,
  onToolCall,
  model = env.GEMINI_MODEL,
  temperature = 0.3,
  maxOutputTokens = 4096,
  maxRounds = 6,
} = {}) => {
  requireKey();

  const working = [...contents];
  const actions = [];
  const usage = { prompt: 0, completion: 0, total: 0 };

  let cost = 0;
  const startedAt = Date.now();

  for (let round = 0; round < maxRounds; round++) {
    const body = {
      contents: working,
      generationConfig: { temperature, maxOutputTokens },
      ...(tools ? { tools } : {}),
    };

    if (system) body.systemInstruction = { parts: [{ text: system }] };

    const { payload, candidate } = await request(body, model);

    const roundUsage = usageOf(payload);
    usage.prompt += roundUsage.prompt;
    usage.completion += roundUsage.completion;
    usage.total += roundUsage.total;
    cost += estimateCost(model, roundUsage.prompt, roundUsage.completion);

    const content = candidate.content || {};
    const calls = (content.parts || []).filter((p) => p.functionCall);

    // No tool calls — this is the final answer.
    if (!calls.length) {
      return {
        text: textOf(candidate),
        actions,
        contents: [...working, content],
        model,
        usage,
        estimatedCost: cost,
        responseTime: Date.now() - startedAt,
      };
    }

    // Echo the model turn unchanged, then answer every call it made.
    working.push(content);

    const responseParts = [];

    for (const part of calls) {
      const { name, args, id } = part.functionCall;

      let result;
      try {
        result = await onToolCall(name, args || {});
      } catch (error) {
        result = { ok: false, error: error.message };
      }

      actions.push({ name, args: args || {}, result });

      responseParts.push({
        functionResponse: { id, name, response: result },
      });
    }

    working.push({ role: "user", parts: responseParts });
  }

  // Ran out of rounds — return what we have rather than failing outright.
  return {
    text:
      "I made the changes I could, but stopped before finishing to avoid looping. Ask me to continue if something is missing.",
    actions,
    contents: working,
    model,
    usage,
    estimatedCost: cost,
    responseTime: Date.now() - startedAt,
  };
};

export default { generate, runConversation, isGeminiConfigured, defaultModel };
