import { Router } from "express";

import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
} from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from "../validators/auth.validator.js";

const router = Router();

// ======================================================
// Public
// ======================================================

router.post("/register", authLimiter, validate(registerSchema), register);

router.post("/login", authLimiter, validate(loginSchema), login);

router.post("/refresh", validate(refreshSchema), refresh);

router.post("/logout", validate(logoutSchema), logout);

// ======================================================
// Authenticated
// ======================================================

router.get("/me", requireAuth, me);

router.post("/logout-all", requireAuth, logoutAll);

export default router;
