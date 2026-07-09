import crypto from "crypto";

import redis from "../config/redis/connectRedis.js";

import ApiError from "../utils/ApiError.js";

const TTL = 60 * 60; // 1 Hour

const idempotencyMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const key = req.header("Idempotency-Key");

    if (!key) {
      return next();
    }

    const bodyHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(req.body))
      .digest("hex");

    const redisKey = `idempotency:${key}`;

    const cached = await redis.get(redisKey);

    if (cached) {
      if (cached.bodyHash !== bodyHash) {
        throw new ApiError(
          409,
          "Idempotency key already used with a different request body."
        );
      }

      return res.status(cached.status).json(cached.response);
    }

    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      try {
        await redis.set(
          redisKey,
          {
            bodyHash,
            status: res.statusCode,
            response: body,
          },
          {
            ex: TTL,
          }
        );
      } catch (error) {
        console.error(
          "Failed to cache idempotent response:",
          error
        );
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default idempotencyMiddleware;