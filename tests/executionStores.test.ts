import assert from "node:assert/strict";
import test from "node:test";

import { MemoryCooldownStore } from "../src/core/execution/cooldownStore.js";
import { MemoryGlobalRateLimitStore } from "../src/core/execution/globalRateLimitStore.js";

test("MemoryCooldownStore bloque les executions pendant la fenetre", async () => {
  const store = new MemoryCooldownStore();

  const first = await store.consume("ping", "user-1", 10);
  assert.equal(first.allowed, true);
  assert.equal(first.retryAfterSeconds, 0);

  const second = await store.consume("ping", "user-1", 10);
  assert.equal(second.allowed, false);
  assert.ok(second.retryAfterSeconds > 0);
});

test("MemoryGlobalRateLimitStore applique la limite globale utilisateur", async () => {
  const store = new MemoryGlobalRateLimitStore();
  const policy = {
    limit: 2,
    windowSeconds: 30,
  };

  const first = await store.consume("user-rl", policy);
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);

  const second = await store.consume("user-rl", policy);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);

  const third = await store.consume("user-rl", policy);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSeconds > 0);
});
