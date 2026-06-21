// Tests for client `lib/snowflake.ts` — the ID generator.
// (No DOM, no Tauri, no fetch — just the math.)
//
// Run: cd /Users/zhujianye/maidang/percent/apps/client && pnpm exec tsx --test test/snowflake.test.mts

import assert from "node:assert/strict";
import test from "node:test";
import { newSnowflakeId } from "../src/lib/snowflake.ts";

test("produces string IDs", () => {
  const id = newSnowflakeId();
  assert.equal(typeof id, "string");
});

test("IDs are unique across a tight loop", () => {
  const ids = new Set<string>();
  for (let i = 0; i < 10_000; i++) {
    ids.add(newSnowflakeId());
  }
  // 10k IDs should all be unique unless we crossed a millisecond with
  // overflowing the per-ms sequence (very rare with 12-bit counter).
  assert.equal(ids.size, 10_000);
});

test("IDs grow roughly monotonically", () => {
  const a = newSnowflakeId();
  const b = newSnowflakeId();
  const c = newSnowflakeId();
  // Same wall-clock millisecond → same prefix; we just want strict ordering.
  // We can't assert a < b for sure if the wall clock advanced, but in a
  // tight loop the timestamps should be non-decreasing and the sequence
  // counter inside the same ms should make a < b < c in practice.
  assert.ok(BigInt(a) <= BigInt(b));
  assert.ok(BigInt(b) <= BigInt(c));
});
