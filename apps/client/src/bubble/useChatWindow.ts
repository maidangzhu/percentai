import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChatWindowStore } from "@/store/chatWindowStore";
import type { ApprovalDecision, ApprovalRequest } from "@/bubble/agentRuntime";
import type { AgentMessage, AgentSessionSummary } from "@/bubble/ChatPanel";

export interface UseChatWindowResult {
  messages: AgentMessage[];
  loading: boolean;
  title: string;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  sessionList: AgentSessionSummary[];
  sessionListLoading: boolean;
  currentSessionId: string | null;
  onSwitchSession: (id: string) => Promise<void>;
  onStartNewSession: () => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onSend: (text: string) => Promise<void>;
  pendingApproval: { req: ApprovalRequest; resolve: (d: ApprovalDecision) => void } | null;
  onResolveApproval: (decision: ApprovalDecision) => void;
  aiDisabled: boolean;
}

export function useChatWindow(): UseChatWindowResult {
  const chat = useChatWindowStore(
    useShallow((state) => ({
      messages: state.messages,
      loading: state.loading,
      title: state.title,
      historyOpen: state.historyOpen,
      setHistoryOpen: state.setHistoryOpen,
      sessionList: state.sessionList,
      sessionListLoading: state.sessionListLoading,
      currentSessionId: state.currentSessionId,
      onSwitchSession: state.switchSession,
      createNewSession: state.createNewSession,
      onDeleteSession: state.deleteSessionAndRefresh,
      onSend: state.sendAgentMessage,
      pendingApproval: state.pendingApproval,
      onResolveApproval: state.resolveApproval,
      aiDisabled: state.aiDisabled,
      initialize: state.initialize,
      handleStorageChange: state.handleStorageChange,
    })),
  );

  useEffect(() => {
    void chat.initialize();
    window.addEventListener("storage", chat.handleStorageChange);
    return () => window.removeEventListener("storage", chat.handleStorageChange);
  }, [chat.initialize, chat.handleStorageChange]);

  return {
    messages: chat.messages,
    loading: chat.loading,
    title: chat.title,
    historyOpen: chat.historyOpen,
    setHistoryOpen: chat.setHistoryOpen,
    sessionList: chat.sessionList,
    sessionListLoading: chat.sessionListLoading,
    currentSessionId: chat.currentSessionId,
    onSwitchSession: chat.onSwitchSession,
    onStartNewSession: async () => {
      await chat.createNewSession();
    },
    onDeleteSession: chat.onDeleteSession,
    onSend: chat.onSend,
    pendingApproval: chat.pendingApproval,
    onResolveApproval: chat.onResolveApproval,
    aiDisabled: chat.aiDisabled,
  };
}
