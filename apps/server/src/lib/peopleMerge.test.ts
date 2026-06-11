import assert from "node:assert/strict";
import test from "node:test";
import { normalizePersonName } from "./peopleMerge.js";

test("normalizePersonName strips (N) suffix with spaces", () => {
  assert.equal(normalizePersonName("我要瘦十斤 (5)"), "我要瘦十斤");
});

test("normalizePersonName strips (N) suffix without spaces", () => {
  assert.equal(normalizePersonName("我要瘦十斤(5)"), "我要瘦十斤");
});

test("normalizePersonName strips (N) suffix with extra whitespace", () => {
  assert.equal(normalizePersonName("File Transfer  (3)  "), "FileTransfer");
  assert.equal(normalizePersonName("File Transfer\t(3)"), "FileTransfer");
});

test("normalizePersonName leaves name without suffix unchanged", () => {
  // 现在空白也被去掉了，所以 "File Transfer" → "FileTransfer"
  assert.equal(normalizePersonName("我要瘦十斤"), "我要瘦十斤");
  assert.equal(normalizePersonName("File Transfer"), "FileTransfer");
});

test("normalizePersonName does not strip non-numeric parens", () => {
  // 群聊备注里偶尔会出现非数字括号，不应被识别为成员数后缀
  assert.equal(normalizePersonName("工作群(新)"), "工作群(新)");
  // 空格会被去（"项目组 (Beta)" → "项目组(Beta)"），但非数字括号保留
  assert.equal(normalizePersonName("项目组 (Beta)"), "项目组(Beta)");
});

test("normalizePersonName handles empty / whitespace inputs", () => {
  assert.equal(normalizePersonName(""), "");
  assert.equal(normalizePersonName("   "), "");
});

test("normalizePersonName only strips trailing (N), not embedded", () => {
  // 数字括号不在末尾 → 不剥；但中间空格会去掉
  assert.equal(normalizePersonName("A(5) B"), "A(5)B");
});

test("normalizePersonName treats space / hyphen / em-dash as the same separator", () => {
  // 同一个人不同写法应当归一为同一 key
  assert.equal(normalizePersonName("张三-3.24"), "张三3.24");
  assert.equal(normalizePersonName("张三 -3.24"), "张三3.24");
  assert.equal(normalizePersonName("张三—3.24"), "张三3.24");
  assert.equal(normalizePersonName("张三~3.24"), "张三3.24");
  assert.equal(normalizePersonName("张三3.24"), "张三3.24");
  assert.equal(normalizePersonName("File-Transfer"), "FileTransfer");
  assert.equal(normalizePersonName("File Transfer"), "FileTransfer");
  assert.equal(normalizePersonName("John-Doe"), "JohnDoe");
  assert.equal(normalizePersonName("John Doe"), "JohnDoe");
});

test("normalizePersonName keeps different dates distinguishable", () => {
  // 不同日期应当保留差异，不能误合并
  assert.notEqual(normalizePersonName("张三-3.24"), normalizePersonName("张三-3.25"));
  assert.notEqual(normalizePersonName("A-1"), normalizePersonName("A-2"));
});

test("normalizePersonName keeps dots / Chinese punctuation", () => {
  // 名字中间的点、中文标点不应被去掉
  assert.equal(normalizePersonName("Mr.Smith"), "Mr.Smith");
  assert.equal(normalizePersonName("工作群（新）"), "工作群（新）");
});

test("normalizePersonName combines (N) suffix stripping with separator stripping", () => {
  assert.equal(normalizePersonName("张三 -3.24  (3)"), "张三3.24");
});
