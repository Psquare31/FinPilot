import { ClerkExpressRequireAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import env from "../env/index.js";

export const clerkClient = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
});

export const requireClerkAuth = ClerkExpressRequireAuth();

export default clerkClient;