-- Local SQLite schema for the Percent desktop app.
-- Applied at startup (CREATE TABLE IF NOT EXISTS = idempotent).
-- All DateTime columns are TEXT (ISO 8601 strings) — lexicographic sort = time sort.
-- All Json? columns are TEXT (JSON-serialized string), NULL = NULL.
-- All Boolean columns are INTEGER (0/1).

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_bundle_id TEXT NOT NULL DEFAULT '',
  is_send INTEGER NOT NULL DEFAULT 0,
  is_wechat INTEGER NOT NULL DEFAULT 0,
  screenshot_path TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_occurred_at ON logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_app_bundle_id ON logs (app_bundle_id);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_app TEXT NOT NULL DEFAULT 'WeChat',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(name, client_app)
);

CREATE TABLE IF NOT EXISTS chat_turns (
  id TEXT PRIMARY KEY,
  log_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  captured_at TEXT NOT NULL,
  raw_ai_response TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people(id)
);
CREATE INDEX IF NOT EXISTS idx_chat_turns_person_id ON chat_turns (person_id);
CREATE INDEX IF NOT EXISTS idx_chat_turns_log_id ON chat_turns (log_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  turn_id TEXT NOT NULL,
  role TEXT NOT NULL,
  sender_name TEXT,
  sender_normalized TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  quote_text TEXT,
  quote_sender_name TEXT,
  quote_role TEXT,
  quote_content_type TEXT,
  is_quoted INTEGER NOT NULL DEFAULT 0,
  is_revoked INTEGER NOT NULL DEFAULT 0,
  message_key TEXT NOT NULL DEFAULT '',
  raw_extracted TEXT,
  seq INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (turn_id) REFERENCES chat_turns(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_turn_id ON chat_messages (turn_id, seq);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_key ON chat_messages (message_key);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  person_id TEXT,
  log_id TEXT,
  source_turn_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fingerprint TEXT NOT NULL UNIQUE,
  evidence TEXT NOT NULL DEFAULT '',
  raw_ai_response TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT,
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE SET NULL,
  FOREIGN KEY (source_turn_id) REFERENCES chat_turns(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_at ON tasks (status, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_person_id ON tasks (person_id);
CREATE INDEX IF NOT EXISTS idx_tasks_source_turn_id ON tasks (source_turn_id);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  screen_context TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_updated ON agent_sessions (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  kind TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tool_name TEXT,
  tool_input TEXT,
  tool_result TEXT,
  is_error INTEGER NOT NULL DEFAULT 0,
  seq INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_seq ON agent_messages (session_id, seq);
