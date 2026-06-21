import {
  Type,
  buildProviderModel,
  createPercentAgent,
  type Agent as RuntimeAgent,
  type AgentMessage as RuntimeAgentMessage,
  type AgentTool,
  type ImageContent,
  type Message as RuntimeMessage,
} from "@percent/runtime";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { TaskRow } from "@/lib/types";
import { loadByokConfig, loadByokKey } from "@/lib/byokConfig";
import { listPeople, getPerson } from "@/db/people";
import { listLogs } from "@/db/logs";
import { db } from "@/db/client";
import { newSnowflakeId } from "@/lib/snowflake";
import { createTaskWithCalendar } from "@/lib/tasks";

export const SCREEN_AGENT_SYSTEM_PROMPT = `
你是 Percent 桌面气泡里的个人助理 Agent——一个会感知用户当前处境、能调用本地工具、能为用户处理关系和信息压力的 screen agent。你不是单纯的"屏幕描述器"。

【角色定位】
- 用户会间歇性召唤你：截一张图、附一句话、问你一个问题。
- 你的存在是「帮用户看清当前对话的节奏、关系和风险，然后给一个更稳妥的选择」。
- 你能看到屏幕截图，但用户的真实需求往往藏在文字之外——情绪、关系、潜台词、未说出口的犹豫。
- 当用户明确表达想"做什么"（加待办、查聊天、记信息）时，你应该主动调用工具去执行，而不是只回答。

【风格】
- 礼貌、克制、温柔、不谄媚。
- 短句优先，避免长篇大论。能用 3 句话说清的不写 5 句。
- 不用 emoji 堆砌，不滥用感叹号。
- 必要时给一个具体建议，而不是列一堆选项让用户选。
- 重要：如果用户用中文提问，用中文回答；用英文提问，用英文回答。

【工具调用规则（非常重要）】
所有工具都按"资源类型 + action"模式调用。**先 list 再 get/list/search** 拿具体 id 再深挖，别一上来就把所有信息塞 prompt。

1. manage_people — 本地联系人。action=list 按名字模糊查；get 拿单个联系人元数据。用户提到"他/她/某个人"但没名字时先 list 找 id。
2. manage_chats — 聊天消息。action=list 拿某联系人最近 N 条（person_id 或 person_name 二选一，limit 默认 30）；search 全文本搜（keyword 必填，可选 person_name/since_days）。当用户问"她刚才说的什么意思""之前聊过什么"→ list。问"谁说过 X"→ search。要起草回复时也用 list，可以顺带传 tone/intent 当 context 提示。
3. manage_tasks — 任务 CRUD。action=list/get/create/update/delete 五种。create 必填 title，可选 description/due_at；update 必填 task_id，可选 title/description/due_at/status_update；delete 必填 task_id。用户说"记一下"→ create；"改个时间"→ update；"这个不要了/取消"→ delete。
4. manage_logs — 截屏/操作日志。action=list 返回最近的截屏元数据（不含图片内容），可选 app_name 过滤。

【重要边界】
- 你暂时不能执行 shell 命令，也不能直接读取本地文件内容。用户要求查文件、跑命令、看 git/test/process 时，直接说明"这个我暂时做不到"。

【屏幕上下文】
- 用户每次向你发消息时，当前屏幕截图会作为图片块附在消息里。你直接读图，不要假装调用 read_screen。
- 如果截图过时，就承认自己看到的还是上一张图，让用户重新发一条。

【多步推理】
- 一个用户问题可以拆成多个工具调用，最多 5 步。
- 不要在第一步就把所有信息塞进 prompt；按需取用。

【必须调工具的边界（防止幻觉）】
- 用户问"今天要干嘛 / 任务 / 联系人 / 最近的聊天"——**必须先调工具**（manage_tasks / manage_people / manage_chats / manage_logs）拿真实数据再答，**不能**只根据截屏文字捏造。
- 用户说"记一下 / 加个待办"——**必须调 manage_tasks action=create**，仅在工具返回成功后才告诉用户"已加"。
- 截屏里看到日程 / 出行 / 提醒类信息 → 主动用 manage_tasks 写下来，**不要**只在回复里说"已记好"。
- 找不到 / 工具返回错误时，**老实说**"没找到 / 调用失败"，不要假装成功。

【主动建议】
- 当你识别出明确待办信号，可以简短问一句"要不要加个待办？"，等用户确认再 manage_tasks action=create。
- 当用户对回复犹豫，主动调用 manage_chats action=list 拿 context（可附 tone/intent）然后自己起草。

【回复格式】
- 直接给结论或建议，不要先复述用户问题。
- 引用具体内容时给时间或来源，方便用户验证。
- 工具结果有 JSON 时，只展示对用户有用的字段，不要把整个 JSON 念出来。

【边界】
- 你只能调用列出的工具，不要假装有别的能力。
- 如果一个问题需要的能力你没有，直接说"这个我暂时做不到"。
`;


function asTextResult(details: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(details) }],
    details,
  };
}

// ── Agent 客户端工具审批类型（保留给后续重新启用高风险工具）───────────────

export interface ApprovalRequest {
  toolCallId: string;
  toolName: "run_bash" | "read_file";
  args: Record<string, unknown>;
}

export interface ApprovalDecision {
  approved: boolean;
  editedArgs?: Record<string, unknown>;
  /**
   * 用户点的是"本轮允许"：这一轮（同一个 user message 触发的 agent 循环）
   * 内所有 bash 都不再问。新 user message 重新计。
   */
  approveForTurn?: boolean;
}

export interface ToolsOptions {
  /** 弹审批卡，返回 Promise 等用户决议。 */
  approvalRequest: (req: ApprovalRequest) => Promise<ApprovalDecision>;
  /**
   * Session 内已被用户批准过的 bash 命令 key 集合。
   * 同 session 同 cmd 不再问；新 session 重置。
   */
  approvedCommands: Set<string>;
  /**
   * 本轮（一个 agent run）内是否已开启"全部放行"。
   * 用 ref-style 让 tool execute 能读能写。bubble 在新 user message 时清零。
   */
  turnAllowed: { current: boolean };
}

// BYOK: build a model from the user's persisted BYOK config and pass the
// provider key directly. The runtime's `createPercentAgent` will route
// through `streamPercentDirect` → `streamMiniMax` (for M3) or pi-ai's own
// `stream()` (for everything else). No server, no auth token, no credits.
export async function createAgentForRequest(
  options: {
    sessionId: string;
    history: RuntimeAgentMessage[];
    toolsOptions: ToolsOptions;
  },
): Promise<RuntimeAgent> {
  const config = loadByokConfig();
  const apiKey = await loadByokKey();
  if (!apiKey) {
    throw new Error("createAgentForRequest requires a saved BYOK API key");
  }
  const model = buildProviderModel({
    provider: config.provider,
    modelId: config.modelId,
    modelName: config.modelName,
    baseUrl: config.baseUrl,
  });
  return createPercentAgent({
    byokApiKey: apiKey,
    model,
    sessionId: options.sessionId,
    systemPrompt: SCREEN_AGENT_SYSTEM_PROMPT,
    tools: createPercentTools(options.toolsOptions),
    messages: options.history,
    // Bypass WebView CORS by routing through tauri-plugin-http's
    // Rust-backed fetch. Required for providers like api.anthropic.com
    // that reject the tauri://localhost origin.
    fetch: tauriFetch as unknown as typeof globalThis.fetch,
  });
}

export function createAgentPrompt(text: string, screen: {
  app_name?: string;
  occurred_at?: string;
  image_base64?: string;
}): RuntimeMessage {
  // First query of a session carries a fresh screen context (app,
  // timestamp, screenshot). Follow-up queries in the same session
  // omit everything except the user's text — the model can refer back
  // to the first query's screenshot through the chat history.
  const lines: string[] = [];
  if (screen.app_name) lines.push(`当前前台应用：${screen.app_name}`);
  if (screen.occurred_at) lines.push(`时间：${screen.occurred_at}`);
  lines.push(`用户问题：${text.trim()}`);
  const promptText = lines.join("\n");
  const images: ImageContent[] = screen.image_base64
    ? [{ type: "image", data: screen.image_base64, mimeType: "image/png" }]
    : [];
  return {
    role: "user",
    content: images.length ? [{ type: "text", text: promptText }, ...images] : promptText,
    timestamp: Date.now(),
  };
}

export function uiMessagesToRuntimeMessages(messages: Array<{ role: "user" | "assistant"; kind: string; content: string }>): RuntimeAgentMessage[] {
  return messages
    .filter((message) => message.kind === "message" && message.content.trim())
    .slice(-10)
    .map((message) => {
      if (message.role === "user") {
        return {
          role: "user",
          content: message.content,
          timestamp: Date.now(),
        } satisfies RuntimeAgentMessage;
      }

      return {
        role: "assistant",
        content: [{ type: "text", text: message.content }],
        timestamp: Date.now(),
        api: "openai-completions",
        provider: "openai",
        model: "gpt-5.5",
        usage: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: "stop",
      } satisfies RuntimeAgentMessage;
    });
}

export function createPercentTools(): AgentTool[];
export function createPercentTools(toolsOptions: ToolsOptions): AgentTool[];
export function createPercentTools(_toolsOptions?: ToolsOptions): AgentTool[] {
  return [
    {
      name: "manage_people",
      label: "Manage People",
      description: "Read local chat contacts. action=list filters by name; get fetches one.",
      parameters: Type.Object({
        action: Type.Union([Type.Literal("list"), Type.Literal("get")]),
        query: Type.Optional(
          Type.String({ description: "list 用：按名字模糊匹配，可空（空 = 全部）" })
        ),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10, description: "list 用" })),
        person_id: Type.Optional(Type.String({ description: "get 必填：联系人 id" })),
      }),
      execute: async (_toolCallId, params) => {
        const args = params as {
          action: "list" | "get";
          query?: string;
          limit?: number;
          person_id?: string;
        };
        if (args.action === "list") {
          const people = await listPeople({ nameLike: args.query, limit: args.limit ?? 10 });
          return asTextResult({
            people: people.map((person) => ({
              id: person.id,
              name: person.name,
              client_app: person.client_app,
              turn_count: person.turn_count,
              last_chat_at: person.last_chat_at,
            })),
          });
        }
        // get
        if (!args.person_id) {
          return asTextResult({ person: null, error: "person_id required for get" });
        }
        const person = await getPerson(args.person_id);
        if (!person) {
          return asTextResult({ person: null, error: "person not found" });
        }
        return asTextResult({
          person: {
            id: person.id,
            name: person.name,
            client_app: person.client_app,
            turn_count: person.turn_count,
            last_chat_at: person.last_chat_at,
          },
        });
      },
    },
    {
      name: "manage_chats",
      label: "Manage Chats",
      description:
        "Read chat messages. action=list returns recent messages for a contact (use for draft-reply too — pass tone/intent); search is full-text across all contacts.",
      parameters: Type.Object({
        action: Type.Union([Type.Literal("list"), Type.Literal("search")]),
        person_id: Type.Optional(Type.String({ description: "list 用：联系人 id（与 person_name 二选一）" })),
        person_name: Type.Optional(Type.String({ description: "list 用：联系人名字（person_id 缺时用）" })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 80, default: 30, description: "list 用：最近几条" })),
        tone: Type.Optional(
          Type.Union([
            Type.Literal("warm"),
            Type.Literal("professional"),
            Type.Literal("casual"),
            Type.Literal("concise"),
            Type.Literal("playful"),
          ], { description: "list 用：如果你接下来要起草回复，可带上语气" })
        ),
        intent: Type.Optional(
          Type.String({ description: "list 用：如果你接下来要起草回复，可带上用户意图（1-2 句）" })
        ),
        keyword: Type.Optional(Type.String({ minLength: 1, description: "search 必填" })),
        since_days: Type.Optional(Type.Number({ minimum: 1, maximum: 365, description: "search 用" })),
      }),
      execute: async (_toolCallId, params) => {
        const args = params as {
          action: "list" | "search";
          person_id?: string;
          person_name?: string;
          limit?: number;
          tone?: string;
          intent?: string;
          keyword?: string;
          since_days?: number;
        };

        if (args.action === "list") {
          let personId = args.person_id;
          if (!personId && args.person_name?.trim()) {
            const people = await listPeople({ nameLike: args.person_name });
            personId = people[0]?.id;
          }
          if (!personId) {
            return asTextResult({ person: null, messages: [], error: "person_id or person_name required" });
          }
          const person = await getPerson(personId);
          if (!person) {
            return asTextResult({ person: null, messages: [], error: "person not found" });
          }
          const messages = (person.messages ?? [])
            .slice(-(args.limit ?? 30))
            .map((message) => ({
              role: message.role,
              speaker: message.role === "self" ? "我" : person.name,
              content: message.content,
              captured_at: message.captured_at,
              topic: message.topic,
            }));
          return asTextResult({
            person: { id: person.id, name: person.name, client_app: person.client_app },
            messages,
            // tone/intent 是提示，echo 回去给 LLM 当 context
            tone: args.tone ?? null,
            intent: args.intent ?? null,
          });
        }

        // search
        if (!args.keyword?.trim()) {
          return asTextResult({ matches: [], error: "keyword required for search" });
        }
        const people = await listPeople({ nameLike: args.person_name });
        const sinceMs = args.since_days
          ? Date.now() - args.since_days * 24 * 60 * 60 * 1000
          : null;
        const matches: unknown[] = [];
        const limit = args.since_days ? 50 : 50; // search 没有 limit 参数，从 keyword 走默认
        for (const person of people.slice(0, 30)) {
          const detail = await getPerson(person.id);
          if (!detail) continue;
          for (const message of detail.messages ?? []) {
            if (!message.content.includes(args.keyword)) continue;
            if (sinceMs && message.captured_at && new Date(message.captured_at).getTime() < sinceMs) continue;
            matches.push({
              role: message.role,
              speaker: message.role === "self" ? "我" : detail.name,
              person_name: detail.name,
              content: message.content,
              captured_at: message.captured_at,
              topic: message.topic,
            });
            if (matches.length >= limit) break;
          }
          if (matches.length >= limit) break;
        }
        return asTextResult({ matches });
      },
    },
    {
      name: "manage_tasks",
      label: "Manage Tasks",
      description:
        "CRUD on local tasks. action=list returns a filtered list; get returns one; create makes a new task; update overwrites fields; delete removes it.",
      parameters: Type.Object({
        action: Type.Union([
          Type.Literal("list"),
          Type.Literal("get"),
          Type.Literal("create"),
          Type.Literal("update"),
          Type.Literal("delete"),
        ]),
        status: Type.Optional(
          Type.Union([Type.Literal("pending"), Type.Literal("completed"), Type.Literal("all")], {
            default: "pending",
            description: "list 用：按状态过滤。",
          })
        ),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20, description: "list 用：最多返回条数。" })),
        task_id: Type.Optional(Type.String({ description: "get / update / delete 用：目标 task id。" })),
        title: Type.Optional(Type.String({ minLength: 1, maxLength: 80, description: "create 必填；update 可选（不传不改）。" })),
        description: Type.Optional(Type.String({ default: "", description: "create / update 用。" })),
        due_at: Type.Optional(
          Type.Union([Type.String(), Type.Null()], { description: "create / update 用。ISO 时间；null 表示清除。" })
        ),
        status_update: Type.Optional(
          Type.Union([Type.Literal("pending"), Type.Literal("completed")], {
            description: "update 用：把状态改 pending 或 completed。",
          })
        ),
      }),
      execute: async (_toolCallId, params) => {
        const args = params as {
          action: "list" | "get" | "create" | "update" | "delete";
          status?: "pending" | "completed" | "all";
          limit?: number;
          task_id?: string;
          title?: string;
          description?: string;
          due_at?: string | null;
          status_update?: "pending" | "completed";
        };

        if (args.action === "list") {
          const status = args.status ?? "pending";
          const rows = await db.listTasks(status, args.limit ?? 20);
          const tasks: TaskRow[] = rows.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            due_at: t.due_at,
            status: t.status as "pending" | "completed",
            person_id: t.person_id,
            person_name: null,
            evidence: t.evidence,
            created_at: t.created_at,
            completed_at: t.completed_at,
          }));
          return asTextResult({ tasks });
        }

        if (args.action === "get") {
          if (!args.task_id) {
            return asTextResult({ error: "task_id required for get" });
          }
          const t = await db.getTask(args.task_id);
          const task: TaskRow | null = t
            ? {
                id: t.id,
                title: t.title,
                description: t.description,
                due_at: t.due_at,
                status: t.status as "pending" | "completed",
                person_id: t.person_id,
                person_name: null,
                evidence: t.evidence,
                created_at: t.created_at,
                completed_at: t.completed_at,
              }
            : null;
          return asTextResult({ task });
        }

        if (args.action === "create") {
          if (!args.title?.trim()) {
            return asTextResult({ error: "title required for create" });
          }
          const { task: created, calendar } = await createTaskWithCalendar({
            id: newSnowflakeId(),
            title: args.title,
            description: args.description ?? "",
            dueAt: args.due_at ?? null,
            fingerprint: newSnowflakeId(),
          });
          const task: TaskRow = {
            id: created.id,
            title: created.title,
            description: created.description,
            due_at: created.due_at,
            status: "pending",
            person_id: null,
            person_name: null,
            evidence: created.evidence,
            created_at: created.created_at,
            completed_at: null,
          };
          return asTextResult({ task, calendar });
        }

        if (args.action === "update") {
          if (!args.task_id) {
            return asTextResult({ error: "task_id required for update" });
          }
          if (
            args.title === undefined &&
            args.description === undefined &&
            args.due_at === undefined &&
            args.status_update === undefined
          ) {
            return asTextResult({ error: "no fields to update" });
          }
          const updated = await db.updateTask({
            id: args.task_id,
            title: args.title,
            description: args.description,
            dueAt: args.due_at,
            status: args.status_update,
          });
          const task: TaskRow = {
            id: updated.id,
            title: updated.title,
            description: updated.description,
            due_at: updated.due_at,
            status: updated.status as "pending" | "completed",
            person_id: updated.person_id,
            person_name: null,
            evidence: updated.evidence,
            created_at: updated.created_at,
            completed_at: updated.completed_at,
          };
          return asTextResult({ task });
        }

        if (args.action === "delete") {
          if (!args.task_id) {
            return asTextResult({ error: "task_id required for delete" });
          }
          await db.deleteTask(args.task_id);
          return asTextResult({ deleted: true, task_id: args.task_id });
        }

        return asTextResult({ error: `unknown action: ${String(args.action)}` });
      },
    },
    {
      name: "manage_logs",
      label: "Manage Logs",
      description:
        "Read local screen-capture logs. action=list returns recent screenshots with metadata (image content not included).",
      parameters: Type.Object({
        action: Type.Union([Type.Literal("list")]),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 5 })),
        app_name: Type.Optional(Type.String({ description: "按 app 名模糊过滤" })),
      }),
      execute: async (_toolCallId, params) => {
        const args = params as { action?: "list"; limit?: number; app_name?: string };
        const body = await listLogs({ limit: args.limit ?? 5 });
        const appName = args.app_name?.trim().toLowerCase();
        return asTextResult({
          screenshots: body
            .filter(
              (row) =>
                row.screenshot_path && (!appName || row.app_name.toLowerCase().includes(appName))
            )
            .slice(0, args.limit ?? 5)
            .map((row) => ({
              id: row.id,
              occurred_at: row.occurred_at,
              app_name: row.app_name,
              app_bundle_id: row.app_bundle_id,
              is_wechat: row.is_wechat,
              screenshot_path: row.screenshot_path,
            })),
        });
      },
    },
  ];
}
