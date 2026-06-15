import assert from "node:assert/strict";
import test from "node:test";

const { normalizeCalendarStartIso } = await import("../src/lib/calendar.ts");

test("normalizeCalendarStartIso rejects mixed natural language strings", () => {
  assert.equal(normalizeCalendarStartIso("2026-06-15T活动结束"), null);
  assert.equal(normalizeCalendarStartIso("明天19:00"), null);
});

test("normalizeCalendarStartIso accepts full ISO-ish date-time strings", () => {
  assert.equal(
    normalizeCalendarStartIso("2026-06-15T14:00:00+08:00"),
    "2026-06-15T06:00:00.000Z",
  );
  assert.equal(
    normalizeCalendarStartIso(new Date("2026-06-15T06:00:00.000Z")),
    "2026-06-15T06:00:00.000Z",
  );
});
