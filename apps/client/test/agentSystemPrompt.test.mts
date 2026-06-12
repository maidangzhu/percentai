// Tests for the screen agent's system prompt. The prompt lives in
// `bubble/agentRuntime.ts` as `SCREEN_AGENT_SYSTEM_PROMPT`. We assert the
// critical instructions are present so that future edits don't
// silently drop them — the LLM's behavior depends on these strings.

import assert from "node:assert/strict";
import test from "node:test";

const mod = await import("../src/bubble/agentRuntime.ts");
const prompt: string = mod.SCREEN_AGENT_SYSTEM_PROMPT;

test("names the six tools the agent should mount", () => {
  for (const tool of [
    "manage_people",
    "manage_chats",
    "manage_tasks",
    "manage_logs",
    "run_bash",
    "read_file",
  ]) {
    assert.ok(
      prompt.includes(tool),
      `system prompt must mention tool: ${tool}`,
    );
  }
});

test("instructs the agent to call tools before answering about tasks / contacts / chats", () => {
  // The hallucination guard we just added — without it the LLM will
  // happily fabricate "已记好" replies without ever calling
  // manage_tasks.create.
  assert.ok(
    /manage_tasks.*create|调.*工具|必须.*工具/.test(prompt),
    "prompt must require tool calls for tasks/contacts/chat queries",
  );
  // Specifically: don't claim success without a tool confirmation.
  assert.ok(
    /老实|不要假装|没找到|不能.{0,10}只根据.{0,10}截屏/.test(prompt),
    "prompt must warn against fabricating tool-call results",
  );
});

test("instructs list-before-get so the agent doesn't dump everything into the prompt", () => {
  assert.ok(
    /先 list/.test(prompt),
    "prompt must contain the 'list first' rule",
  );
});

test("instructs bash is dangerous and should not be auto-run for state-changing commands", () => {
  // The original prompt was explicit about rm -rf / kill -9 / curl | sh / sudo.
  // If a future edit drops this guard, the agent could wreck the
  // user's Mac.
  assert.ok(/rm -rf|kill -9|curl \|\| sh|sudo/.test(prompt), "prompt must list forbidden bash patterns");
  assert.ok(/bash/.test(prompt), "prompt must call out bash as a dangerous tool");
});
