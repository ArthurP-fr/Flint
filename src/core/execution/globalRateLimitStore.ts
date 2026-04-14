import type { Redis } from "ioredis";

export interface GlobalRateLimitPolicy {
  limit: number;
  windowSeconds: number;
}

export interface GlobalRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
  limit: number;
}

export interface GlobalRateLimitStore {
  consume(userId: string, policy: GlobalRateLimitPolicy): Promise<GlobalRateLimitDecision>;
}

interface WindowCounterEntry {
  count: number;
  resetAt: number;
}

export class MemoryGlobalRateLimitStore implements GlobalRateLimitStore {
  private readonly counters = new Map<string, WindowCounterEntry>();

  public async consume(userId: string, policy: GlobalRateLimitPolicy): Promise<GlobalRateLimitDecision> {
    const sanitized = sanitizePolicy(policy);
    const now = Date.now();
    const key = this.key(userId, sanitized.windowSeconds);
    const existing = this.counters.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + sanitized.windowSeconds * 1000;
      this.counters.set(key, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, sanitized.limit - 1),
        limit: sanitized.limit,
      };
    }

    existing.count += 1;

    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    const allowed = existing.count <= sanitized.limit;

    return {
      allowed,
      retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
      remaining: Math.max(0, sanitized.limit - existing.count),
      limit: sanitized.limit,
    };
  }

  private key(userId: string, windowSeconds: number): string {
    return `${userId}:${windowSeconds}`;
  }
}

export class RedisGlobalRateLimitStore implements GlobalRateLimitStore {
  public constructor(
    private readonly redis: Redis,
    private readonly keyPrefix = "bot:ratelimit:user",
  ) {}

  public async consume(userId: string, policy: GlobalRateLimitPolicy): Promise<GlobalRateLimitDecision> {
    const sanitized = sanitizePolicy(policy);
    const key = this.key(userId);

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, sanitized.windowSeconds);
    }

    const ttl = await this.redis.ttl(key);
    const retryAfterSeconds = ttl > 0 ? ttl : sanitized.windowSeconds;
    const allowed = count <= sanitized.limit;

    return {
      allowed,
      retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
      remaining: Math.max(0, sanitized.limit - count),
      limit: sanitized.limit,
    };
  }

  private key(userId: string): string {
    return `${this.keyPrefix}:${userId}`;
  }
}

const sanitizePolicy = (policy: GlobalRateLimitPolicy): GlobalRateLimitPolicy => {
  const limit = Number.isFinite(policy.limit) && policy.limit > 0 ? Math.floor(policy.limit) : 1;
  const windowSeconds = Number.isFinite(policy.windowSeconds) && policy.windowSeconds > 0
    ? Math.floor(policy.windowSeconds)
    : 1;

  return {
    limit,
    windowSeconds,
  };
};
