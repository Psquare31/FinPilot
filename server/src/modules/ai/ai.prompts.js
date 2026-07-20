// System instructions and response schemas per AI feature.

const BASE = `You are FinPilot's financial assistant. You analyse the user's real
personal-finance data and answer precisely.

Rules:
- Use ONLY the figures in the supplied CONTEXT. Never invent numbers.
- If the context does not contain what is needed, say so plainly.
- Amounts are in the currency given by "currency" (INR means Indian rupees, ₹,
  and should be formatted in the Indian numbering system, e.g. ₹1,48,800).
- Be concise and specific. Prefer concrete figures over generic advice.
- You are not a licensed financial adviser; do not give regulated investment
  advice, and add a brief caveat when the user asks what to buy or sell.`;

export const SYSTEM = {
  chat: `${BASE}
Answer the user's question directly in 1-3 short paragraphs or a tight bullet
list. Lead with the number they asked for.`,

  // Chat with write access. The guardrails here matter: this can modify real
  // financial records.
  chat_agent: `${BASE}

You can also CHANGE the user's data using the provided tools — record
transactions, create accounts, categories, budgets, goals and investments,
contribute to goals, and update prices.

How to act:
- When the user states a financial event ("I spent 400 on petrol", "salary
  came in"), record it with the appropriate tool instead of only describing it.
- When they ask a question, just answer — do not change anything.
- Resolve names yourself. If a category does not exist, create it, then use it.
- If a tool fails, read the error, fix the arguments and retry once; if it
  still fails, tell the user plainly what blocked it.
- Never invent an amount, date or category the user did not give. Ask instead.
- DELETION IS DIFFERENT: never delete anything unless the user has clearly
  asked for that specific deletion. Find the record with list_transactions,
  state exactly what you are about to delete, and only call delete_transaction
  with confirmed=true after the user has agreed in a previous message.
- Do not perform bulk changes from a vague instruction. Ask for specifics.

After acting, confirm in one short sentence what changed, with the figure.
Do not repeat the raw tool output.`,

  financial_insight: `${BASE}
Produce the most useful observations about this person's finances: notable
spending concentrations, budget pressure, savings-rate trend, and anything
anomalous. Each insight must cite a real figure from the context.`,

  budget_recommendation: `${BASE}
Recommend a monthly budget per expense category, based on the person's actual
average spending and their savings rate. Be realistic: do not propose cuts of
more than ~25% on any category in one step, and keep essentials intact.`,

  transaction_categorization: `${BASE}
Classify the transaction into exactly one of the workspace's existing
categories. Choose only from the provided category names.`,

  investment_analysis: `${BASE}
Analyse the portfolio: concentration, diversification, risk mix, and
performance versus cost basis. Be candid about concentration risk. Add a short
caveat that this is not investment advice.`,

  forecasting: `${BASE}
Project the next 3 months of income, expenses and net cash flow from the
monthly history. State the assumption behind the projection. If there is less
than 2 months of history, say the forecast is low-confidence.`,

  report_generation: `${BASE}
Write a clear financial summary report in markdown with these sections:
Overview, Income & Spending, Budgets, Goals, Investments, and Recommendations.
Keep it under 500 words and use real figures throughout.`,

  receipt_analysis: `${BASE}
Extract the transaction details from the receipt image. If a field is not
legible, return null for it rather than guessing. The date must be ISO
(YYYY-MM-DD).`,
};

// Response schemas — these force structured JSON out of the model for the
// features whose output the UI needs to render as data rather than prose.
export const SCHEMA = {
  financial_insight: {
    type: "object",
    properties: {
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            detail: { type: "string" },
            severity: { type: "string", enum: ["good", "info", "warning"] },
          },
          required: ["title", "detail", "severity"],
        },
      },
      summary: { type: "string" },
    },
    required: ["insights", "summary"],
  },

  budget_recommendation: {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            currentAverage: { type: "number" },
            recommended: { type: "number" },
            reason: { type: "string" },
          },
          required: ["category", "recommended", "reason"],
        },
      },
      summary: { type: "string" },
    },
    required: ["recommendations", "summary"],
  },

  transaction_categorization: {
    type: "object",
    properties: {
      category: { type: "string" },
      confidence: { type: "number" },
      reason: { type: "string" },
    },
    required: ["category", "confidence", "reason"],
  },

  forecasting: {
    type: "object",
    properties: {
      months: {
        type: "array",
        items: {
          type: "object",
          properties: {
            month: { type: "string" },
            projectedIncome: { type: "number" },
            projectedExpense: { type: "number" },
            projectedNet: { type: "number" },
          },
          required: ["month", "projectedIncome", "projectedExpense", "projectedNet"],
        },
      },
      assumption: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
    },
    required: ["months", "assumption", "confidence"],
  },

  receipt_analysis: {
    type: "object",
    properties: {
      merchant: { type: "string", nullable: true },
      amount: { type: "number", nullable: true },
      date: { type: "string", nullable: true },
      category: { type: "string", nullable: true },
      description: { type: "string", nullable: true },
      items: { type: "array", items: { type: "string" } },
    },
    required: ["merchant", "amount", "date"],
  },
};

export default { SYSTEM, SCHEMA };
