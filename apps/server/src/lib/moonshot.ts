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

export async function completeMoonshotKimi(input: {
  apiKey: string;
  baseUrl: string;
  modelId: string;
  systemPrompt?: string;
  messages: MoonshotMessage[];
  maxTokens: number;
}) {
  let response: Response;
  try {
    response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.modelId,
        messages: buildMessages(input.systemPrompt, input.messages),
        temperature: 1,
        max_tokens: input.maxTokens,
      }),
      signal: AbortSignal.timeout(25_000),
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

export function streamMoonshotKimi(input: {
  apiKey: string;
  baseUrl: string;
  modelId: string;
  systemPrompt?: string;
  messages: MoonshotMessage[];
  maxTokens: number;
}) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const write = (obj: PercentProxyEvent) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const usage = emptyUsage;
      let started = false;
      try {
        write({ type: "start" });
        let response: Response;
        try {
          response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${input.apiKey}`,
            },
            body: JSON.stringify({
              model: input.modelId,
              messages: buildMessages(input.systemPrompt, input.messages),
              temperature: 1,
              max_tokens: input.maxTokens,
              stream: true,
            }),
            signal: AbortSignal.timeout(25_000),
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
              choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
              usage?: ChatCompletionResponse["usage"];
            };
            const delta = chunk.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              if (!started) {
                write({ type: "text_start", contentIndex: 0 });
                started = true;
              }
              write({ type: "text_delta", contentIndex: 0, delta });
            }
            if (chunk.usage) Object.assign(usage, toUsage(chunk.usage));
          }
        }
        if (started) write({ type: "text_end", contentIndex: 0 });
        write({ type: "done", reason: "stop", usage });
      } catch (error) {
        write({
          type: "error",
          reason: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          usage,
        });
      } finally {
        controller.close();
      }
    },
  });
}
