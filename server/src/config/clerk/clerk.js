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

// In DEMO_AUTH mode there may be no Clerk secret key. Creating the
// client (or mounting requireAuth) with an empty key would throw at
// import time and take the whole server down, so guard on the key.
const hasClerk = Boolean(env.CLERK_SECRET_KEY);

export const clerkClient = hasClerk
    ? createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
    : null;

export const requireClerkAuth = hasClerk
    ? requireAuth()
    : (req, res, next) => next();

export default clerkClient;
