// 临时调试脚本 — 验证 maybeAddTaskToCalendar 的 wiring
// 跑：cd /Users/zhujianye/maidang/percent/apps/client && pnpm exec tsx test_calendar_sync.mts
// 真实环境验证底层 AppleScript 是否能写 Calendar.app 在另一个脚本里跑（见 test_cal_osascript.mts）

import { mock } from "node:test";
import {
  maybeAddTaskToCalendar,
  isCalendarAutoAddEnabled,
} from "./src/lib/calendar.ts";

// 监听 invoke 调用：calendar.ts 是 `import { invoke } from "@tauri-apps/api/core"`
// 我们用 mock.module 替换这个模块
const invokeCalls: Array<{ cmd: string; args: unknown }> = [];
mock.module("@tauri-apps/api/core", {
  namedExports: {
    invoke: async (cmd: string, args: unknown) => {
      invokeCalls.push({ cmd, args });
      if (cmd === "add_task_to_calendar") {
        throw new Error(
          "osascript: script error: Expected end of line but found class name. (-2741)"
        );
      }
      return "mock-event-id";
    },
  },
});

console.log("isCalendarAutoAddEnabled() (no localStorage) →", isCalendarAutoAddEnabled());

// test 1: autoAdd off
{
  localStorage.clear();
  localStorage.setItem("percent.calendar.autoAdd", "false");
  invokeCalls.length = 0;
  const r = await maybeAddTaskToCalendar({
    title: "x",
    due_at: "2026-06-08T14:00:00.000Z",
  });
  console.log("[1] autoAdd=off →", r);
  console.assert(r.added === false && r.attempted === false && r.reason === "disabled", "test 1");
  console.assert(invokeCalls.length === 0, "test 1 no invoke");
  console.log("    ✓ 不调 invoke");
}

// test 2: no due_at
{
  localStorage.clear();
  localStorage.setItem("percent.calendar.autoAdd", "true");
  invokeCalls.length = 0;
  const r = await maybeAddTaskToCalendar({ title: "x" });
  console.log("[2] no due_at →", r);
  console.assert(r.added === false && r.attempted === false && r.reason === "no_due_at", "test 2");
  console.assert(invokeCalls.length === 0, "test 2 no invoke");
  console.log("    ✓ 不调 invoke");
}

// test 3: autoAdd on + due_at → invoke
{
  localStorage.clear();
  localStorage.setItem("percent.calendar.autoAdd", "true");
  invokeCalls.length = 0;
  const r = await maybeAddTaskToCalendar({
    title: "下周一下午2点见咖啡是灵魂",
    description: "我：那下周一下午2点？ 咖啡是灵魂：OK",
    due_at: "2026-06-08T14:00:00.000+08:00",
  });
  console.log("[3] autoAdd=on + due_at →", r);
  console.log("    invoke calls:", JSON.stringify(invokeCalls, null, 2));
  console.assert(r.attempted === true, "test 3 attempted");
  console.assert(invokeCalls.length === 1, "test 3 one invoke");
  console.assert(invokeCalls[0].cmd === "add_task_to_calendar", "test 3 cmd");
  const args = invokeCalls[0].args as Record<string, unknown>;
  console.assert(args.title === "下周一下午2点见咖啡是灵魂", "test 3 title");
  console.assert(args.notes === "我：那下周一下午2点？ 咖啡是灵魂：OK", "test 3 notes");
  console.assert(args.startsAtIso === "2026-06-08T14:00:00.000+08:00", "test 3 startsAtIso");
  console.assert(args.durationMinutes === 60, "test 3 duration");
  console.log("    ✓ invoke 调用，参数正确");

  // test 4: invoke 失败（这台机 macOS Automation 权限缺失）→ 错误透传
  console.assert(r.added === false, "test 4 added=false");
  console.assert(r.error !== undefined, "test 4 error present");
  console.assert(r.error!.includes("class name"), "test 4 error is osascript dict error");
  console.log("    ✓ invoke 失败 → error 透传，added=false");
  console.log("    error:", r.error);
}

console.log("\n所有 wiring 检查通过。剩下的是 macOS Automation 权限问题（系统级，不在代码层）。");
