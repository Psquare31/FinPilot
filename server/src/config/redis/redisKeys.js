export const REDIS_KEYS = {
  DASHBOARD: (workspaceId) =>
    `dashboard:${workspaceId}`,

  ANALYTICS: (workspaceId) =>
    `analytics:${workspaceId}`,

  REPORT: (workspaceId, reportId) =>
    `report:${workspaceId}:${reportId}`,

  USER: (userId) =>
    `user:${userId}`,

  OTP: (email) =>
    `otp:${email}`,

  RATE_LIMIT: (identifier) =>
    `rate-limit:${identifier}`,

  IDEMPOTENCY: (key) =>
    `idempotency:${key}`,
};