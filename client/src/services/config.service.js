import { get } from "./apiClient";

// Public endpoint — tells the client whether the API is in DEMO_AUTH mode
// or expects a real Clerk session.
export const getRuntimeConfig = () => get("/config");
