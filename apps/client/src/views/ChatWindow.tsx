import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChatPanel } from "@/bubble/ChatPanel";
import { useChatWindow } from "@/bubble/useChatWindow";

export function ChatWindow() {
  const chat = useChatWindow();
  const handleClose = useCallback(() => {
    void invoke("hide_chat_window").catch((e) =>
      console.error("[chat] hide_chat_window failed:", e)
    );
  }, []);
  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground"
      style={{ ["--ink-bg" as string]: "oklch(0.13 0 0)" }}
    >
      <ChatPanel {...chat} onClose={handleClose} mode="standalone" />
    </div>
  );
}
