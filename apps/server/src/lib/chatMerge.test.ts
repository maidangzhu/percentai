import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChatMessageKey,
  getNewMessagesFromSnapshot,
  mergeOverlappingChatTurns,
} from "./chatMerge.js";

test("getNewMessagesFromSnapshot returns all when nothing exists", () => {
  const result = getNewMessagesFromSnapshot(
    [],
    [
      { role: "self", content: "hi" },
      { role: "other", content: "hello" },
    ]
  );
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((m) => m.content), ["hi", "hello"]);
});

test("getNewMessagesFromSnapshot returns nothing when all are duplicates", () => {
  const result = getNewMessagesFromSnapshot(
    [
      { role: "self", content: "hi" },
      { role: "other", content: "hello" },
    ],
    [
      { role: "self", content: "hi" },
      { role: "other", content: "hello" },
    ]
  );
  assert.equal(result.length, 0);
});

test("getNewMessagesFromSnapshot detects overlap with existing tail", () => {
  const result = getNewMessagesFromSnapshot(
    [
      { role: "self", content: "早上好" },
      { role: "other", content: "早" },
    ],
    [
      { role: "self", content: "早上好" },
      { role: "other", content: "早" },
      { role: "self", content: "今天吃啥" },
      { role: "other", content: "火锅" },
    ]
  );
  assert.deepEqual(
    result.map((m) => m.content),
    ["今天吃啥", "火锅"]
  );
});

test("getNewMessagesFromSnapshot skips empty / whitespace-only messages", () => {
  const result = getNewMessagesFromSnapshot(
    [],
    [
      { role: "self", content: "" },
      { role: "other", content: "   " },
      { role: "other", content: "actual message" },
    ]
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].content, "actual message");
});

test("getNewMessagesFromSnapshot dedupes adjacent duplicates", () => {
  const result = getNewMessagesFromSnapshot(
    [],
    [
      { role: "self", content: "hi" },
      { role: "self", content: "hi" },
      { role: "other", content: "hi" }, // different role, kept
      { role: "other", content: "hi" }, // adjacent to prior same content
    ]
  );
  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((m) => `${m.role}:${m.content}`),
    ["self:hi", "other:hi"]
  );
});

test("getNewMessagesFromSnapshot skips messages present in recent tail (within 20)", () => {
  const existing = Array.from({ length: 19 }, (_, i) => ({
    role: "other" as const,
    content: `m${i}`,
  }));
  const result = getNewMessagesFromSnapshot(existing, [
    ...existing,
    { role: "self", content: "new message" },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].content, "new message");
});

test("mergeOverlappingChatTurns merges turns in chronological order", () => {
  const turns = [
    {
      capturedAt: new Date("2026-06-01T10:00:00Z"),
      messages: [
        { role: "self", content: "hi" },
        { role: "other", content: "hello" },
      ],
    },
    {
      capturedAt: new Date("2026-06-01T10:05:00Z"),
      messages: [
        { role: "self", content: "hi" },
        { role: "other", content: "hello" },
        { role: "self", content: "how are you" },
        { role: "other", content: "fine" },
      ],
    },
  ];
  const result = mergeOverlappingChatTurns(turns);
  // 第一个 turn 写入 mergedKeys，第二个 turn 与其有 2 条重叠，所以贡献 2 条新消息
  assert.equal(result.length, 2);
  assert.deepEqual(
    result[0].messages.map((m) => m.content),
    ["hi", "hello"]
  );
  assert.deepEqual(
    result[1].messages.map((m) => m.content),
    ["how are you", "fine"]
  );
});

test("mergeOverlappingChatTurns handles unordered input", () => {
  const turns = [
    {
      capturedAt: new Date("2026-06-01T10:05:00Z"),
      messages: [{ role: "other", content: "fine" }],
    },
    {
      capturedAt: new Date("2026-06-01T10:00:00Z"),
      messages: [
        { role: "self", content: "hi" },
        { role: "other", content: "hello" },
        { role: "self", content: "how are you" },
      ],
    },
  ];
  const result = mergeOverlappingChatTurns(turns);
  // 早期 turn 全部是新的；晚期 turn 末尾 "fine" 和已有 "how are you" 不重叠，单独一段
  assert.equal(result.length, 2);
  assert.deepEqual(
    result[0].messages.map((m) => m.content),
    ["hi", "hello", "how are you"]
  );
  assert.deepEqual(
    result[1].messages.map((m) => m.content),
    ["fine"]
  );
});

test("mergeOverlappingChatTurns detects reversed orientation (model returns bottom-up)", () => {
  // 真实时间线：m1 → m2 → m3 → m4
  // 第一段截屏看到 m1, m2, m3
  // 第二段截屏的模型"按从下到上"返回 m4, m3（应该是 m3, m4）
  const turns = [
    {
      capturedAt: new Date("2026-06-01T10:00:00Z"),
      messages: [
        { role: "self", content: "m1" },
        { role: "other", content: "m2" },
        { role: "self", content: "m3" },
      ],
    },
    {
      capturedAt: new Date("2026-06-01T10:05:00Z"),
      messages: [
        { role: "other", content: "m4" },
        { role: "self", content: "m3" }, // 重复，与上一段末尾 m3 重叠
      ],
    },
  ];
  const result = mergeOverlappingChatTurns(turns);
  assert.equal(result.length, 2);
  // turn 2 中 m4 是真正新增的；m3 在 recentKeys 里被去重
  assert.deepEqual(
    result[1].messages.map((m) => m.content),
    ["m4"]
  );
});

test("buildChatMessageKey uses explicit messageKey when present", () => {
  assert.equal(
    buildChatMessageKey({
      role: "self",
      content: "ignored",
      messageKey: "explicit-key",
    }),
    "explicit-key"
  );
});

test("buildChatMessageKey treats quote as part of identity", () => {
  const base = {
    role: "self",
    content: "好的",
    senderName: "我",
    contentType: "text",
  };

  const quoteA = buildChatMessageKey({
    ...base,
    quoteSenderName: "咖啡是灵魂",
    quoteRole: "other",
    quoteContentType: "text",
    quoteText: "下周一下午2点？",
  });
  const quoteB = buildChatMessageKey({
    ...base,
    quoteSenderName: "我",
    quoteRole: "self",
    quoteContentType: "text",
    quoteText: "下周一下午2点？",
  });

  assert.notEqual(quoteA, quoteB);
});

test("buildChatMessageKey treats content type as part of identity", () => {
  const textKey = buildChatMessageKey({
    role: "other",
    content: "[图片]",
    senderName: "咖啡是灵魂",
    contentType: "text",
  });
  const imageKey = buildChatMessageKey({
    role: "other",
    content: "[图片]",
    senderName: "咖啡是灵魂",
    contentType: "image",
  });

  assert.notEqual(textKey, imageKey);
});

test("getNewMessagesFromSnapshot dedupes by explicit messageKey across text changes", () => {
  const result = getNewMessagesFromSnapshot(
    [{ role: "other", content: "旧 OCR", messageKey: "stable-message" }],
    [{ role: "other", content: "新 OCR", messageKey: "stable-message" }]
  );

  assert.equal(result.length, 0);
});
