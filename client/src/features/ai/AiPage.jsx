import { useEffect, useRef, useState } from "react";

import { Card, Button, Icon, Badge, Spinner, ProgressBar } from "../../components/ui";
import { useWorkspace } from "../../store/WorkspaceContext";
import { useToast } from "../../store/ToastContext";
import {
  getAiStatus,
  askAi,
  getConversation,
  getInsights,
  getBudgetRecommendations,
  getInvestmentAnalysis,
  getForecast,
  getReport,
  analyzeReceipt,
} from "../../services/ai.service";
import { formatMoney, clamp } from "../../utils/format";
import Markdown from "./markdown";

const SUGGESTIONS = [
  "I spent ₹1,200 on groceries today",
  "Where is most of my money going?",
  "Set a ₹8,000 monthly budget for Food & Dining",
  "How is my savings rate trending?",
];

// The chat thread id is kept per workspace so a reload resumes where you were.
const conversationKey = (workspaceId) => `finpilot.conversation.${workspaceId}`;

const newConversationId = () =>
  `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// Receipts are sent inline as base64 and the API body cap is 1 MB, so shrink
// the image in the browser before uploading.
const downscaleImage = (file, maxSize = 1024, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a readable image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

/* ---------------- Result renderers ---------------- */

function Insights({ data, currency }) {
  const tone = { good: "green", warning: "red", info: "brand" };
  return (
    <>
      {data.summary && <Markdown>{data.summary}</Markdown>}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.insights || []).map((i, idx) => (
          <div key={idx} className="ai-insight">
            <div className="between" style={{ marginBottom: 4 }}>
              <span className="cell-strong">{i.title}</span>
              <Badge tone={tone[i.severity] || "gray"}>{i.severity}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>{i.detail}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function BudgetRecs({ data, currency }) {
  return (
    <>
      {data.summary && <Markdown>{data.summary}</Markdown>}
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Now</th>
              <th style={{ textAlign: "right" }}>Suggested</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {(data.recommendations || []).map((r, i) => (
              <tr key={i}>
                <td className="cell-strong">{r.category}</td>
                <td className="num" style={{ textAlign: "right" }}>
                  {r.currentAverage != null ? formatMoney(r.currentAverage, currency) : "—"}
                </td>
                <td className="num" style={{ textAlign: "right", color: "var(--brand)" }}>
                  {formatMoney(r.recommended, currency)}
                </td>
                <td className="muted" style={{ fontSize: 12.5 }}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Forecast({ data, currency }) {
  const max = Math.max(
    1,
    ...(data.months || []).flatMap((m) => [m.projectedIncome, m.projectedExpense])
  );
  return (
    <>
      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <Badge tone={data.confidence === "high" ? "green" : data.confidence === "medium" ? "amber" : "gray"}>
          {data.confidence} confidence
        </Badge>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(data.months || []).map((m, i) => (
          <div key={i}>
            <div className="between" style={{ marginBottom: 6 }}>
              <span className="cell-strong">{m.month}</span>
              <span
                className="num"
                style={{ color: m.projectedNet >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {m.projectedNet >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(m.projectedNet), currency)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <ProgressBar value={clamp((m.projectedIncome / max) * 100, 0, 100)} color="var(--green)" />
                <div className="dim" style={{ fontSize: 11, marginTop: 3 }}>
                  In {formatMoney(m.projectedIncome, currency)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <ProgressBar value={clamp((m.projectedExpense / max) * 100, 0, 100)} color="var(--red)" />
                <div className="dim" style={{ fontSize: 11, marginTop: 3 }}>
                  Out {formatMoney(m.projectedExpense, currency)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {data.assumption && (
        <p className="dim" style={{ fontSize: 12, marginTop: 14 }}>
          {data.assumption}
        </p>
      )}
    </>
  );
}

function Receipt({ data, currency }) {
  const rows = [
    ["Merchant", data.merchant || "—"],
    ["Amount", data.amount != null ? formatMoney(data.amount, currency) : "—"],
    ["Date", data.date || "—"],
    ["Category", data.category || "—"],
    ["Description", data.description || "—"],
  ];
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(([k, v]) => (
          <div className="between" key={k}>
            <span className="dim" style={{ fontSize: 12.5 }}>{k}</span>
            <span className="cell-strong">{v}</span>
          </div>
        ))}
      </div>
      {!!data.items?.length && (
        <div style={{ marginTop: 12 }}>
          <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>Line items</div>
          <Markdown>{data.items.map((i) => `- ${i}`).join("\n")}</Markdown>
        </div>
      )}
    </>
  );
}

/* ---------------- Page ---------------- */

export default function AiPage() {
  const { workspaceId, currency, refreshAccounts, refreshCategories } = useWorkspace();
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    getAiStatus().then(setStatus).catch(() => setStatus({ configured: false }));
  }, []);

  // Resume the stored thread for this workspace, or start a new one.
  useEffect(() => {
    if (!workspaceId) return;

    const key = conversationKey(workspaceId);
    const existing = localStorage.getItem(key);

    if (!existing) {
      const id = newConversationId();
      localStorage.setItem(key, id);
      setConversationId(id);
      setMessages([]);
      return;
    }

    setConversationId(existing);

    getConversation(workspaceId, existing)
      .then((rows) => setMessages(rows.filter((m) => m.content)))
      .catch(() => setMessages([]));
  }, [workspaceId]);

  const startNewChat = () => {
    const id = newConversationId();
    localStorage.setItem(conversationKey(workspaceId), id);
    setConversationId(id);
    setMessages([]);
  };

  useEffect(() => {
    // `block: "nearest"` scrolls the thread container only — the default
    // would also scroll the page to bring the card into view.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const push = (msg) => setMessages((m) => [...m, msg]);

  const runAction = async (label, fn, render) => {
    if (busy) return;
    push({ role: "user", content: label });
    setBusy(true);
    try {
      const data = await fn(workspaceId);
      push({ role: "assistant", render, data });
    } catch (e) {
      push({ role: "assistant", content: `⚠️ ${e.message}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setInput("");
    const history = messages
      .filter((m) => m.content && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    push({ role: "user", content: question });
    setBusy(true);
    try {
      const { answer, actions } = await askAi(
        workspaceId,
        question,
        history,
        conversationId
      );
      push({ role: "assistant", content: answer, actions });

      // The assistant can change real data — pull the workspace back in sync.
      if (actions?.length) {
        await Promise.all([refreshAccounts(), refreshCategories()]);
        toast.success(
          actions.length === 1 ? actions[0].summary : `${actions.length} changes applied`
        );
      }
    } catch (e) {
      push({ role: "assistant", content: `⚠️ ${e.message}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const onReceipt = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    push({ role: "user", content: `Scan receipt: ${file.name}` });
    setBusy(true);
    try {
      const dataUrl = await downscaleImage(file);
      const data = await analyzeReceipt(workspaceId, dataUrl, "image/jpeg");
      push({ role: "assistant", render: Receipt, data });
    } catch (err) {
      push({ role: "assistant", content: `⚠️ ${err.message}`, error: true });
    } finally {
      setBusy(false);
    }
  };

  if (status && !status.configured) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h2>AI Assistant</h2>
            <p>Ask questions about your finances in plain English.</p>
          </div>
        </div>
        <Card>
          <div className="empty">
            <div className="em-ic">✨</div>
            <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>
              AI is not configured
            </div>
            <div style={{ maxWidth: 420, margin: "0 auto" }}>
              Add a <code className="md-code">GEMINI_API_KEY</code> to{" "}
              <code className="md-code">server/.env</code> and restart the API.
              Get a key from Google AI Studio.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>AI Assistant</h2>
          <p>
            Grounded in your real accounts, transactions, budgets, goals and
            portfolio.
          </p>
        </div>
        <div className="row">
          {status?.model && <Badge tone="brand">{status.model}</Badge>}
          <Button size="sm" onClick={startNewChat} disabled={busy}>
            New chat
          </Button>
        </div>
      </div>

      <div className="ai-actions">
        <button className="tag" disabled={busy} onClick={() => runAction("Give me insights", getInsights, Insights)}>
          ✨ Insights
        </button>
        <button className="tag" disabled={busy} onClick={() => runAction("Recommend budgets", getBudgetRecommendations, BudgetRecs)}>
          🎯 Budget advice
        </button>
        <button className="tag" disabled={busy} onClick={() => runAction("Forecast my cash flow", getForecast, Forecast)}>
          📈 Forecast
        </button>
        <button
          className="tag"
          disabled={busy}
          onClick={() =>
            runAction("Analyse my portfolio", getInvestmentAnalysis, ({ data }) => (
              <Markdown>{data.analysis}</Markdown>
            ))
          }
        >
          💹 Portfolio
        </button>
        <button
          className="tag"
          disabled={busy}
          onClick={() =>
            runAction("Generate a financial report", getReport, ({ data }) => (
              <Markdown>{data.report}</Markdown>
            ))
          }
        >
          📄 Report
        </button>
        <button className="tag" disabled={busy} onClick={() => fileRef.current?.click()}>
          🧾 Scan receipt
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onReceipt}
        />
      </div>

      <Card className="ai-chat">
        <div className="ai-thread">
          {!messages.length && (
            <div className="empty" style={{ paddingTop: 30 }}>
              <div className="em-ic">✨</div>
              <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>
                Ask anything about your money
              </div>
              <div style={{ marginBottom: 18 }}>
                Every answer is computed from your actual data.
              </div>
              <div className="ai-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="tag" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>
              {m.role === "assistant" && <div className="ai-avatar">✨</div>}
              <div className={`ai-bubble ${m.error ? "err" : ""}`}>
                {m.render ? (
                  <m.render data={m.data} currency={currency} />
                ) : (
                  <Markdown>{m.content}</Markdown>
                )}
                {!!m.actions?.length && (
                  <div className="ai-changes">
                    {m.actions.map((a, k) => (
                      <div className="ai-change" key={k}>
                        <Icon name="check" size={13} />
                        <span>{a.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="ai-msg assistant">
              <div className="ai-avatar">✨</div>
              <div className="ai-bubble">
                <div className="row" style={{ color: "var(--text-muted)" }}>
                  <Spinner /> Thinking…
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="ai-composer">
          <input
            className="input"
            placeholder="Ask about your spending, budgets, goals…"
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button variant="primary" onClick={() => send()} disabled={busy || !input.trim()}>
            <Icon name="arrowUp" size={15} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
