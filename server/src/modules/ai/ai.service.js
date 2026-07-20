import BaseService from "../../shared/services/base.service.js";

import AiInteraction from "../../models/AiInteraction.js";
import ApiError from "../../utils/ApiError.js";
import toObjectId from "../../utils/toObjectId.js";

import gemini, { isGeminiConfigured, defaultModel } from "../../config/ai/gemini.js";
import { buildFinancialContext } from "./ai.context.js";
import { SYSTEM, SCHEMA } from "./ai.prompts.js";
import { toolDeclarations, createToolExecutor } from "./ai.tools.js";

class AIInteractionService extends BaseService {
  constructor() {
    super(AiInteraction);
  }

  // ======================================================
  // Core: run a feature through Gemini and log the interaction.
  //
  // Every AI call funnels through here so that usage, latency, token counts,
  // cost and failures are recorded against the workspace uniformly — including
  // failed calls, which are the ones worth seeing.
  // ======================================================

  async run({ workspace, user, feature, prompt, system, schema, image, temperature }) {
    const startedAt = Date.now();

    const log = async (fields) => {
      try {
        await this.create({
          workspace,
          user,
          feature,
          model: defaultModel(),
          prompt: String(prompt).slice(0, 8000),
          ...fields,
        });
      } catch {
        // Logging must never break the user-facing response.
      }
    };

    try {
      const result = await gemini.generate({
        prompt,
        system,
        schema,
        image,
        temperature,
      });

      await log({
        response: result.text.slice(0, 20000),
        status: "success",
        model: result.model,
        tokens: result.usage,
        estimatedCost: result.estimatedCost,
        responseTime: result.responseTime,
      });

      return result;
    } catch (error) {
      await log({
        status: "failed",
        error: String(error.message).slice(0, 500),
        responseTime: Date.now() - startedAt,
      });

      throw error;
    }
  }

  // Shared helper: pull the workspace snapshot and hand it to the model.
  async runWithContext({ workspace, user, feature, instruction, schema, months }) {
    const context = await buildFinancialContext(workspace, { months });

    const prompt = `${instruction}

CONTEXT (the user's real financial data as JSON):
${JSON.stringify(context)}`;

    const result = await this.run({
      workspace,
      user,
      feature,
      prompt,
      system: SYSTEM[feature],
      schema,
    });

    return { ...result, context };
  }

  // ======================================================
  // Feature: free-form chat grounded in the user's data
  // ======================================================

  async chat({ workspace, user, message, history = [], conversationId }) {
    if (!message?.trim()) {
      throw new ApiError(400, "A message is required.");
    }

    // Prefer the stored thread; fall back to whatever the client sent.
    const stored = conversationId
      ? await this.getConversationHistory(conversationId, workspace)
      : [];

    const priorTurns = stored.length
      ? stored.flatMap((row) => [
          { role: "user", parts: [{ text: row.prompt }] },
          { role: "model", parts: [{ text: row.response || "" }] },
        ])
      : history.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

    const context = await buildFinancialContext(workspace);
    const currency = context.currency;

    const contents = [
      ...priorTurns.filter((t) => t.parts[0].text),
      {
        role: "user",
        parts: [
          {
            text: `${message}

CONTEXT (the user's real financial data as JSON — today is ${new Date()
              .toISOString()
              .slice(0, 10)}):
${JSON.stringify(context)}`,
          },
        ],
      },
    ];

    const executor = createToolExecutor({ workspace, user, currency });

    const startedAt = Date.now();

    try {
      const result = await gemini.runConversation({
        contents,
        system: SYSTEM.chat_agent,
        tools: toolDeclarations,
        onToolCall: executor,
        temperature: 0.4,
      });

      await this.create({
        workspace,
        user,
        conversationId: conversationId || "",
        feature: "chat",
        model: result.model,
        prompt: String(message).slice(0, 8000),
        response: result.text.slice(0, 20000),
        status: "success",
        tokens: result.usage,
        estimatedCost: result.estimatedCost,
        responseTime: result.responseTime,
        metadata: { actions: result.actions.length },
      }).catch(() => {});

      return {
        answer: result.text,
        // Only surface actions that actually changed something.
        actions: result.actions
          .filter((a) => a.result?.ok && a.result?.summary)
          .map((a) => ({ summary: a.result.summary, entity: a.result.entity })),
        usage: result.usage,
      };
    } catch (error) {
      await this.create({
        workspace,
        user,
        conversationId: conversationId || "",
        feature: "chat",
        model: defaultModel(),
        prompt: String(message).slice(0, 8000),
        status: "failed",
        error: String(error.message).slice(0, 500),
        responseTime: Date.now() - startedAt,
      }).catch(() => {});

      throw error;
    }
  }

  // ======================================================
  // Feature: insights
  // ======================================================

  async financialInsight({ workspace, user }) {
    const result = await this.runWithContext({
      workspace,
      user,
      feature: "financial_insight",
      instruction:
        "Give 4-6 of the most useful insights about these finances right now.",
      schema: SCHEMA.financial_insight,
    });

    return result.json || { summary: result.text, insights: [] };
  }

  // ======================================================
  // Feature: budget recommendations
  // ======================================================

  async budgetRecommendation({ workspace, user }) {
    const result = await this.runWithContext({
      workspace,
      user,
      feature: "budget_recommendation",
      instruction:
        "Recommend a realistic monthly budget for each expense category the user actually spends on.",
      schema: SCHEMA.budget_recommendation,
    });

    return result.json || { summary: result.text, recommendations: [] };
  }

  // ======================================================
  // Feature: categorise a transaction
  // ======================================================

  async categorizeTransaction({ workspace, user, description, amount, merchant }) {
    if (!description?.trim() && !merchant?.trim()) {
      throw new ApiError(400, "A description or merchant is required.");
    }

    const context = await buildFinancialContext(workspace, { months: 3 });
    const names = context.categories
      .filter((c) => c.type === "expense")
      .map((c) => c.name);

    const prompt = `Classify this transaction into one of the categories below.

Transaction:
- description: ${description || ""}
- merchant: ${merchant || ""}
- amount: ${amount ?? "unknown"} ${context.currency}

Available categories: ${JSON.stringify(names)}`;

    const result = await this.run({
      workspace,
      user,
      feature: "transaction_categorization",
      prompt,
      system: SYSTEM.transaction_categorization,
      schema: SCHEMA.transaction_categorization,
      temperature: 0.1,
    });

    return result.json || { category: null, confidence: 0, reason: result.text };
  }

  // ======================================================
  // Feature: investment analysis
  // ======================================================

  async investmentAnalysis({ workspace, user }) {
    const result = await this.runWithContext({
      workspace,
      user,
      feature: "investment_analysis",
      instruction:
        "Analyse this investment portfolio: concentration, diversification, risk and performance.",
    });

    return { analysis: result.text, portfolio: result.context.portfolio };
  }

  // ======================================================
  // Feature: cash-flow forecasting
  // ======================================================

  async forecast({ workspace, user }) {
    const result = await this.runWithContext({
      workspace,
      user,
      feature: "forecasting",
      instruction:
        "Project income, expenses and net cash flow for the next 3 months.",
      schema: SCHEMA.forecasting,
    });

    return result.json || { months: [], assumption: result.text, confidence: "low" };
  }

  // ======================================================
  // Feature: report generation
  // ======================================================

  async generateReport({ workspace, user }) {
    const result = await this.runWithContext({
      workspace,
      user,
      feature: "report_generation",
      instruction: "Write a financial summary report for this period.",
    });

    return { report: result.text };
  }

  // ======================================================
  // Feature: receipt analysis (vision)
  // ======================================================

  async analyzeReceipt({ workspace, user, image, mimeType }) {
    if (!image) {
      throw new ApiError(400, "A receipt image is required.");
    }

    const context = await buildFinancialContext(workspace, { months: 1 });
    const names = context.categories
      .filter((c) => c.type === "expense")
      .map((c) => c.name);

    // Data URLs arrive as "data:image/png;base64,AAAA..." — the API wants the
    // payload only.
    const base64 = String(image).includes(",")
      ? String(image).split(",").pop()
      : String(image);

    const detected = String(image).match(/^data:([^;]+);/)?.[1];

    const result = await this.run({
      workspace,
      user,
      feature: "receipt_analysis",
      prompt: `Extract the transaction from this receipt. Pick the best matching category from: ${JSON.stringify(names)}`,
      system: SYSTEM.receipt_analysis,
      schema: SCHEMA.receipt_analysis,
      temperature: 0.1,
      image: { data: base64, mimeType: mimeType || detected || "image/jpeg" },
    });

    return result.json || { merchant: null, amount: null, date: null };
  }

  // ======================================================
  // Generic entry point used by POST /ai/generate-response
  // ======================================================

  async generateResponse({ workspace, user, feature = "chat", prompt, message }) {
    const text = message || prompt;

    switch (feature) {
      case "financial_insight":
        return this.financialInsight({ workspace, user });
      case "budget_recommendation":
        return this.budgetRecommendation({ workspace, user });
      case "investment_analysis":
        return this.investmentAnalysis({ workspace, user });
      case "forecasting":
        return this.forecast({ workspace, user });
      case "report_generation":
        return this.generateReport({ workspace, user });
      default:
        return this.chat({ workspace, user, message: text });
    }
  }

  // Whether the AI features are usable at all.
  status() {
    return {
      configured: isGeminiConfigured(),
      model: defaultModel(),
      provider: "gemini",
    };
  }

  // Create AI Interaction
  async createInteraction(payload) {
    return this.create(payload);
  }

  // Get AI Interactions
  async getInteractions(workspace, query = {}) {
    const {
      page = 1,
      limit = 20,
      model,
      feature,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (model) {
      filter.model = model;
    }

    if (feature) {
      filter.feature = feature;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get AI Interaction by ID
  async getInteractionById(id) {
    return this.findById(id);
  }

  // Delete AI Interaction
  async deleteInteraction(id) {
    return this.deleteById(id);
  }

  // Get Conversation History
  //
  // `conversationId` did not exist on the schema and neither did `isDeleted`,
  // so Mongoose stripped both from the filter and this returned every
  // interaction in the database rather than one thread. Now scoped properly,
  // and to the workspace so threads cannot leak across workspaces.
  async getConversationHistory(conversationId, workspace) {
    if (!conversationId) return [];

    return this.find(
      {
        conversationId,
        ...(workspace ? { workspace } : {}),
        feature: "chat",
        status: "success",
      },
      {
        sort: { createdAt: 1 },
        limit: 40,
      }
    );
  }

  // Get AI Usage Summary
  async getUsageSummary(workspace) {
    const summary = await this.aggregate([
      {
        // aggregate() does not cast against the schema the way find() does, so
        // a string id matches nothing. `isDeleted` is not on this schema at
        // all — find() silently drops it, but a pipeline would match zero docs.
        $match: {
          workspace: toObjectId(workspace, "workspace"),
        },
      },
      {
        $group: {
          _id: null,
          totalPrompts: {
            $sum: 1,
          },
          // The schema stores these as `tokens.total` / `estimatedCost`;
          // the old field names summed nothing and always reported zero.
          totalTokens: {
            $sum: "$tokens.total",
          },
          totalCost: {
            $sum: "$estimatedCost",
          },
        },
      },
    ]);

    return (
      summary[0] || {
        totalPrompts: 0,
        totalTokens: 0,
        totalCost: 0,
      }
    );
  }

  // Get Feature Usage
  async getFeatureUsage(workspace) {
    return this.aggregate([
      {
        $match: {
          workspace: toObjectId(workspace, "workspace"),
        },
      },
      {
        $group: {
          _id: "$feature",
          requests: {
            $sum: 1,
          },
          tokens: {
            $sum: "$tokens.total",
          },
        },
      },
      {
        $sort: {
          requests: -1,
        },
      },
    ]);
  }

  // Record User Feedback
  async recordFeedback(id, feedback) {
    return this.updateById(id, {
      feedback,
    });
  }

  // Get Available Models
  //
  // Previously returned invented OpenAI model names while nothing was wired up
  // at all. These are the Gemini models this server can actually be pointed at.
  async getAvailableModels() {
    const active = defaultModel();

    return [
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "gemini" },
      { id: "gemini-flash-latest", name: "Gemini Flash (latest)", provider: "gemini" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", provider: "gemini" },
      { id: "gemini-pro-latest", name: "Gemini Pro (latest)", provider: "gemini" },
    ].map((m) => ({ ...m, active: m.id === active }));
  }
}

export default new AIInteractionService();