import redis from "../config/redis/connectRedis.js";

class CacheService {
  // Get cached value
  async get(key) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error("Redis GET Error:", error.message);
      return null;
    }
  }

  // Cache value with optional TTL (seconds)
  async set(key, value, ttl = 300) {
    try {
      await redis.set(key, value, { ex: ttl });
      return true;
    } catch (error) {
      console.error("Redis SET Error:", error.message);
      return false;
    }
  }

  // Delete a cache entry
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error("Redis DEL Error:", error.message);
      return false;
    }
  }

  // Check whether a key exists
  async exists(key) {
    try {
      return Boolean(await redis.exists(key));
    } catch (error) {
      console.error("Redis EXISTS Error:", error.message);
      return false;
    }
  }

  // Delete multiple cache keys
  async delMany(keys = []) {
    try {
      if (!keys.length) return true;

      await redis.del(...keys);
      return true;
    } catch (error) {
      console.error("Redis DEL MANY Error:", error.message);
      return false;
    }
  }

  // Set expiry on an existing key
  async expire(key, ttl) {
    try {
      await redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error("Redis EXPIRE Error:", error.message);
      return false;
    }
  }

  // Increment a numeric value
  async increment(key) {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error("Redis INCR Error:", error.message);
      return null;
    }
  }

  // Decrement a numeric value
  async decrement(key) {
    try {
      return await redis.decr(key);
    } catch (error) {
      console.error("Redis DECR Error:", error.message);
      return null;
    }
  }

  // Get remaining TTL of a key
  async ttl(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error("Redis TTL Error:", error.message);
      return null;
    }
  }

  // Remove expiry from a key
  async persist(key) {
    try {
      await redis.persist(key);
      return true;
    } catch (error) {
      console.error("Redis PERSIST Error:", error.message);
      return false;
    }
  }

  // Flush the entire cache (development only)
  async flush() {
    try {
      await redis.flushdb();
      return true;
    } catch (error) {
      console.error("Redis FLUSH Error:", error.message);
      return false;
    }
  }
}

export default new CacheService();