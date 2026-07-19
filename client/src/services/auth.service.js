import { get, patch } from "./apiClient";

export const getMe = async () => {
  const data = await get("/auth/me");
  return data?.user || data;
};

export const completeOnboarding = (payload) => patch("/auth/onboarding", payload);
