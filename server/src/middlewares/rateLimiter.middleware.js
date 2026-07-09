import { Ratelimit } from "@upstash/ratelimit";

import redis from "../config/redis/connectRedis.js";

import ApiError from "../utils/ApiError.js";

const createLimiter = (
  requests,
  duration,
  message
) => {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      requests,
      duration
    ),

    analytics: true,

    prefix: "finpilot-rate-limit",
  });

  return async (req, res, next) => {
    try {
      const identifier =
        req.user?._id?.toString() ||
        req.ip ||
        "anonymous";

      const { success } =
        await limiter.limit(identifier);

      if (!success) {
        throw new ApiError(
          429,
          message
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const apiLimiter = createLimiter(
  300,
  "15 m",
  "Too many requests. Please try again later."
);

export const authLimiter = createLimiter(
  10,
  "15 m",
  "Too many authentication attempts."
);

export const aiLimiter = createLimiter(
  50,
  "1 h",
  "AI usage limit exceeded."
);

export const uploadLimiter = createLimiter(
  25,
  "1 h",
  "Upload limit exceeded."
);