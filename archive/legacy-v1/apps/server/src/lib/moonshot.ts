import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { PercentProxyEvent } from "@percent/runtime";

type InputBlock =
  | { type: "text"; text?: string }
  | { type: "image"; data?: string; mimeType?: string }
  | Record<string, unknown>;

export type MoonshotMessage = {
  role: "user";
  content: string | InputBlock[];
};

type ChatCompletionChoice = {
  message?: { content?: string; reasoning_content?: string };
  finish_reason?: string;
};

type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

type OpenAICompatibleInput = {
  apiKey: string;
  baseUrl: string;
  modelId: string;
  systemPrompt?: string;
  messages: MoonshotMessage[];
  tools?: unknown[];
  maxTokens: number;
  thinking?: { type: "enabled" | "disabled" };
};

type OpenAICompatibleStreamInput = OpenAICompatibleInput & {
  fallback?: OpenAICompatibleInput;
  onPrimaryError?: (error: unknown) => void;
  onFallbackError?: (error: unknown) => void;
};

type OpenAICompatibleStreamState = {
  textStarted: boolean;
  textContentIndex?: number;
  thinkingStarted: boolean;
  thinkingEnded: boolean;
  thinkingContentIndex?: number;
  nextContentIndex: number;
  toolCalls: Map<number, {
    id: string;
    name: string;
    contentIndex: number;
    ended: boolean;
  }>;
  usage: AssistantMessage["usage"];
};

const emptyUsage: AssistantMessage["usage"] = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

export function describeFetchError(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause as
    | (Error & { code?: string; errno?: string; syscall?: string; hostname?: string })
    | undefined;
  const details = [
    error.name,
    error.message,
    cause?.name ? `cause_name=${cause.name}` : "",
    cause?.message ? `cause_message=${cause.message}` : "",
    cause?.code ? `code=${cause.code}` : "",
    cause?.errno ? `errno=${cause.errno}` : "",
    cause?.syscall ? `syscall=${cause.syscall}` : "",
    cause?.hostname ? `hostname=${cause.hostname}` : "",
  ].filter(Boolean);
  return details.join(" ");
}

function toUsage(usage: ChatCompletionResponse["usage"]): AssistantMessage["usage"] {
  return {
    ...emptyUsage,
    input: usage?.prompt_tokens ?? 0,
    output: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

function toOpenAIContent(content: MoonshotMessage["content"]) {
  if (typeof content === "string") return content;
  return content
    .map((block) => {
      if (block.type === "text") {
        return { type: "text", text: String(block.text ?? "") };
      }
      if (block.type === "image" && block.data) {
        const mimeType = String(block.mimeType ?? "image/png");
        return {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${block.data}` },
        };
      }
      return null;
    })
    .filter(Boolean);
}

function buildMessages(systemPrompt: string | undefined, messages: MoonshotMessage[]) {
  return [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...messages.map((message) => ({
      role: "user",
      content: toOpenAIContent(message.content),
    })),
  ];
}

function completionsUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/chat/completions`;
}

function toOpenAITool(tool: unknown) {
  if (!tool || typeof tool !== "object") return null;
  const value = tool as Record<string, unknown>;
  if (value.type === "function" && value.function && typeof value.function === "object") {
    return value;
  }
  const name = typeof value.name === "string" ? value.name : "";
  if (!name) return null;
  return {
    type: "function",
    function: {
      name,
      description: typeof value.description === "string" ? value.description : "",
      parameters:
        value.parameters && typeof value.parameters === "object"
          ? value.parameters
          : { type: "object", properties: {} },
    },
  };
}

function buildChatBody(input: OpenAICompatibleInput, stream = false) {
  const tools = (input.tools ?? []).map(toOpenAITool).filter(Boolean);
  return {
    model: input.modelId,
    messages: buildMessages(input.systemPrompt, input.messages),
    ...(tools.length ? { tools, tool_choice: "auto" } : {}),
    ...(input.thinking ? { thinking: input.thinking } : {}),
    max_tokens: input.maxTokens,
    ...(stream ? { stream: true } : {}),
  };
}

export function isMoonshotKimi(
  provider: string,
  modelId: string,
  baseUrl = "https://api.moonshot.cn/v1",
  requireNativeProxyGate = true,
) {
  return (
    process.env.NODE_ENV !== "test" &&
    (!requireNativeProxyGate || process.env.VERCEL === "1" || process.env.MOONSHOT_NATIVE_PROXY === "1") &&
    (provider === "kimi" || provider === "moonshotai-cn" || provider === "moonshotai") &&
    modelId.startsWith("kimi-") &&
    baseUrl.includes("api.moonshot.cn")
  );
}

export async function completeOpenAICompatible(input: OpenAICompatibleInput) {
  let response: Response;
  try {
    response = await fetch(completionsUrl(input.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(buildChatBody(input)),
    });
  } catch (error) {
    throw new Error(describeFetchError(error));
  }
  const text = await response.text();
  const body = JSON.parse(text) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(body.error?.message ?? text.slice(0, 500));
  }
  const choice = body.choices?.[0];
  return {
    text: choice?.message?.content ?? "",
    usage: toUsage(body.usage),
  };
}

export async function completeMoonshotKimi(input: Omit<OpenAICompatibleInput, "thinking">) {
  return completeOpenAICompatible({
    ...input,
    thinking: { type: "disabled" },
  });
}

async function writeOpenAICompatibleStream(
  input: OpenAICompatibleInput,
  write: (obj: PercentProxyEvent) => void,
  state: OpenAICompatibleStreamState,
) {
  let response: Response;
  try {
    response = await fetch(completionsUrl(input.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(buildChatBody(input, true)),
    });
  } catch (error) {
    throw new Error(describeFetchError(error));
  }
  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text.slice(0, 500));
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (!data || data === "[DONE]") continue;
      const chunk = JSON.parse(data) as {
        choices?: Array<{
          delta?: {
            content?: string;
            reasoning_content?: string;
            tool_calls?: Array<{
              index?: number;
              id?: string;
              type?: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
          finish_reason?: string;
        }>;
        usage?: ChatCompletionResponse["usage"];
      };
      const choice = chunk.choices?.[0];
      const reasoningDelta = choice?.delta?.reasoning_content ?? "";
      if (reasoningDelta) {
        if (!state.thinkingStarted) {
          state.thinkingContentIndex = state.nextContentIndex++;
          write({ type: "thinking_start", contentIndex: state.thinkingContentIndex });
          state.thinkingStarted = true;
        }
        write({ type: "thinking_delta", contentIndex: state.thinkingContentIndex ?? 0, delta: reasoningDelta });
      }
      for (const toolDelta of choice?.delta?.tool_calls ?? []) {
        const toolIndex = Number(toolDelta.index ?? 0);
        let toolCall = state.toolCalls.get(toolIndex);
        if (!toolCall) {
          toolCall = {
            id: toolDelta.id ?? `tool_${toolIndex}`,
            name: toolDelta.function?.name ?? "",
            contentIndex: state.nextContentIndex++,
            ended: false,
          };
          state.toolCalls.set(toolIndex, toolCall);
          write({
            type: "toolcall_start",
            contentIndex: toolCall.contentIndex,
            id: toolCall.id,
            toolName: toolCall.name || "unknown",
          });
        } else if (!toolCall.name && toolDelta.function?.name) {
          toolCall.name = toolDelta.function.name;
        }
        const argumentsDelta = toolDelta.function?.arguments ?? "";
        if (argumentsDelta) {
          write({
            type: "toolcall_delta",
            contentIndex: toolCall.contentIndex,
            delta: argumentsDelta,
          });
        }
      }
      const delta = choice?.delta?.content ?? "";
      if (delta) {
        if (state.thinkingStarted && !state.thinkingEnded) {
          write({ type: "thinking_end", contentIndex: state.thinkingContentIndex ?? 0 });
          state.thinkingEnded = true;
        }
        if (!state.textStarted) {
          state.textContentIndex = state.nextContentIndex++;
          write({ type: "text_start", contentIndex: state.textContentIndex });
          state.textStarted = true;
        }
        write({ type: "text_delta", contentIndex: state.textContentIndex ?? 0, delta });
      }
      if (chunk.usage) Object.assign(state.usage, toUsage(chunk.usage));
    }
  }
}

export function streamOpenAICompatible(input: OpenAICompatibleStreamInput) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const write = (obj: PercentProxyEvent) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const state: OpenAICompatibleStreamState = {
        usage: { ...emptyUsage },
        textStarted: false,
        thinkingStarted: false,
        thinkingEnded: false,
        nextContentIndex: 0,
        toolCalls: new Map(),
      };
      try {
        write({ type: "start" });
        try {
          await writeOpenAICompatibleStream(input, write, state);
        } catch (primaryError) {
          if (!input.fallback) throw primaryError;
          if (state.textStarted || state.thinkingStarted) throw primaryError;
          input.onPrimaryError?.(primaryError);
          try {
            await writeOpenAICompatibleStream(input.fallback, write, state);
          } catch (fallbackError) {
            input.onFallbackError?.(fallbackError);
            throw fallbackError;
          }
        }
        if (state.thinkingStarted && !state.thinkingEnded) {
          write({ type: "thinking_end", contentIndex: state.thinkingContentIndex ?? 0 });
        }
        if (state.textStarted) write({ type: "text_end", contentIndex: state.textContentIndex ?? 0 });
        let usedTools = false;
        for (const toolCall of state.toolCalls.values()) {
          usedTools = true;
          if (!toolCall.ended) {
            write({ type: "toolcall_end", contentIndex: toolCall.contentIndex });
            toolCall.ended = true;
          }
        }
        write({ type: "done", reason: usedTools ? "toolUse" : "stop", usage: state.usage });
      } catch (error) {
        write({
          type: "error",
          reason: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          usage: state.usage,
        });
      } finally {
        controller.close();
      }
    },
  });
}

export function streamMoonshotKimi(input: OpenAICompatibleStreamInput) {
  return streamOpenAICompatible(input);
}
