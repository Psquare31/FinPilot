import { get, post } from "./apiClient";

export const getAiStatus = () => get("/ai/status");

export const askAi = (workspace, message, history = [], conversationId) =>
  post("/ai/chat", { workspace, message, history, conversationId });

export const getConversation = (workspace, conversationId) =>
  get(`/ai/conversation/${conversationId}`, { workspace });

export const getInsights = (workspace) => get("/ai/insights", { workspace });

export const getBudgetRecommendations = (workspace) =>
  get("/ai/budget-recommendations", { workspace });

export const getInvestmentAnalysis = (workspace) =>
  get("/ai/investment-analysis", { workspace });

export const getForecast = (workspace) => get("/ai/forecast", { workspace });

export const getReport = (workspace) => get("/ai/report", { workspace });

export const categorizeTransaction = (workspace, { description, amount, merchant }) =>
  post("/ai/categorize", { workspace, description, amount, merchant });

export const analyzeReceipt = (workspace, image, mimeType) =>
  post("/ai/receipt", { workspace, image, mimeType });

export const getAiUsage = (workspace) => get("/ai/usage", { workspace });
