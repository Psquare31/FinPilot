// `ClerkExpressRequireAuth` is the @clerk/clerk-sdk-node (v4) API and does not
// exist in @clerk/express v2, which is what this project depends on. Importing
// it threw "does not provide an export named 'ClerkExpressRequireAuth'", which
// took down every module that touches auth — the server could not start.
//
// createClerkClient comes from @clerk/express rather than @clerk/backend: the
// latter is not a declared dependency and resolved only because npm hoisted it
// as a transitive dependency of @clerk/express, which is not a guarantee.
import { requireAuth, createClerkClient } from "@clerk/express";

import env from "../env/index.js";

export const clerkClient = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
});

export const requireClerkAuth = requireAuth();

export default clerkClient;
