// 官网地址 — Tauri 里用 shell.open 在系统浏览器打开
// dev 期间可以覆盖 VITE_LANDING_URL=http://localhost:5180
const env = (import.meta as { env?: { VITE_LANDING_URL?: string } }).env ?? {};
export const LANDING_URL: string = env.VITE_LANDING_URL ?? "https://thepercentai.com";

export interface LogRow {
  id: string;
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: boolean;
  is_wechat: boolean;
  screenshot_path: string | null;
  turn_id: string | null;
  topic: string | null;
  partner_name: string | null;
  person_id: string | null;
}

export interface PersonSummary {
  id: string;
  name: string;
  client_app: string;
  created_at: string;
  updated_at: string;
  turn_count: number;
  last_chat_at: string | null;
}

export interface Message {
  role: "self" | "other";
  content: string;
}

export interface MergedPersonMessage extends Message {
  turn_id?: number | string;
  topic?: string;
  captured_at?: string;
}

export interface TurnDetail {
  id: string;
  log_id: string;
  topic: string;
  captured_at: string;
  messages: Message[] | null;
}

export interface PersonDetail extends PersonSummary {
  messages?: MergedPersonMessage[];
  turns: TurnDetail[];
}

export interface TaskRow {
  id: string;
  person_id: string | null;
  person_name: string | null;
  title: string;
  description: string;
  due_at: string | null;
  status: "pending" | "completed";
  evidence: string;
  created_at: string;
  completed_at: string | null;
}

export interface ShortcutConfig {
  key: string;
  modifiers: string[];
}

export interface PermissionStatus {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  required: boolean;
}

export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export interface UserStats {
  tasks: { total: number; pending: number; completed: number };
  people: number;
  chat_turns: number;
  chat_messages: number;
  logs: number;
  ai: {
    interactions: number;
    reply_suggestions: number;
    task_detections: number;
    agent_messages: number;
  };
  last_active_at: string | null;
}
