// Tauri command surface for the local SQLite database.
// Each command locks the Diesel connection, runs the query, and releases.
//
// All booleans are serialized as i32 (0/1) — TS side does `Boolean(v === 1)`.
// All dates are ISO 8601 strings. All JSON fields are serde_json::Value.

use super::DbState;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

// ── shared row types ─────────────────────────────────────────────

#[derive(Queryable, Serialize)]
pub struct LogRow {
    pub id: String,
    pub occurred_at: String,
    pub app_name: String,
    pub app_bundle_id: String,
    pub is_send: i32,
    pub is_wechat: i32,
    pub screenshot_path: Option<String>,
    pub created_at: String,
}

#[derive(Serialize)]
pub struct LogRowWithTurn {
    pub id: String,
    pub occurred_at: String,
    pub app_name: String,
    pub app_bundle_id: String,
    pub is_send: i32,
    pub is_wechat: i32,
    pub screenshot_path: Option<String>,
    pub created_at: String,
    pub turn_id: Option<String>,
    pub topic: Option<String>,
    pub partner_name: Option<String>,
    pub person_id: Option<String>,
}

#[derive(Serialize)]
pub struct PersonSummary {
    pub id: String,
    pub name: String,
    pub client_app: String,
    pub created_at: String,
    pub updated_at: String,
    pub turn_count: i32,
    pub last_chat_at: Option<String>,
}

#[derive(Serialize)]
pub struct ChatMessageJson {
    pub role: String,
    pub content: String,
    pub captured_at: String,
    pub topic: String,
    pub sender_name: Option<String>,
}

#[derive(Serialize)]
pub struct ChatTurnJson {
    pub id: String,
    pub log_id: String,
    pub topic: String,
    pub captured_at: String,
    pub messages: Vec<ChatMessageJson>,
}

#[derive(Serialize)]
pub struct PersonDetail {
    pub id: String,
    pub name: String,
    pub client_app: String,
    pub created_at: String,
    pub updated_at: String,
    pub turn_count: i32,
    pub last_chat_at: Option<String>,
    pub turns: Vec<ChatTurnJson>,
    pub messages: Vec<ChatMessageJson>,
}

#[derive(Queryable, Serialize, Clone)]
pub struct TaskRow {
    pub id: String,
    pub person_id: Option<String>,
    pub log_id: Option<String>,
    pub source_turn_id: Option<String>,
    pub title: String,
    pub description: String,
    pub due_at: Option<String>,
    pub status: String,
    pub fingerprint: String,
    pub evidence: String,
    pub raw_ai_response: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
}

#[derive(Serialize)]
pub struct AgentSessionSummary {
    pub id: String,
    pub title: String,
    pub message_count: i32,
    pub last_user_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct AgentMessageJson {
    pub id: String,
    pub role: String,
    pub kind: String,
    pub content: String,
    pub tool_name: Option<String>,
    pub tool_input: Option<serde_json::Value>,
    pub tool_result: Option<serde_json::Value>,
    pub is_error: i32,
    pub seq: i32,
    pub created_at: String,
}

#[derive(Serialize)]
pub struct AgentSessionDetail {
    pub id: String,
    pub title: String,
    pub messages: Vec<AgentMessageJson>,
}

#[derive(Serialize)]
pub struct Stats {
    pub tasks_total: i32,
    pub tasks_pending: i32,
    pub tasks_completed: i32,
    pub people: i32,
    pub chat_turns: i32,
    pub chat_messages: i32,
    pub logs: i32,
    pub ai_interactions: i32,
    pub ai_reply_suggestions: i32,
    pub ai_task_detections: i32,
    pub ai_agent_messages: i32,
}

// ── logs ────────────────────────────────────────────────────────

#[tauri::command]
pub fn db_list_logs(
    state: tauri::State<DbState>,
    limit: Option<i32>,
    app_name: Option<String>,
) -> Result<Vec<LogRow>, String> {
    use crate::db::schema::logs::dsl as L;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut q = L::logs
        .order(L::occurred_at.desc())
        .limit(limit.unwrap_or(100) as i64)
        .into_boxed();
    if let Some(app) = app_name {
        q = q.filter(L::app_name.like(format!("%{app}%")));
    }
    q.load::<LogRow>(&mut *conn).map_err(|e| e.to_string())
}

/// Used by the main window's Logs view. Returns each log with the most recent
/// chat_turn's id/topic/person_id (single round-trip-ish: two queries merged
/// in Rust, so the TS side gets a flat list).
#[tauri::command]
pub fn db_list_logs_with_last_turn(
    state: tauri::State<DbState>,
    limit: Option<i32>,
) -> Result<Vec<LogRowWithTurn>, String> {
    use crate::db::schema::chat_turns::dsl as T;
    use crate::db::schema::logs::dsl as L;
    use crate::db::schema::people::dsl as P;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(100) as i64;
    let log_rows: Vec<LogRow> = L::logs
        .order(L::occurred_at.desc())
        .limit(lim)
        .load::<LogRow>(&mut *conn)
        .map_err(|e| e.to_string())?;
    if log_rows.is_empty() {
        return Ok(vec![]);
    }
    let log_ids: Vec<String> = log_rows.iter().map(|r| r.id.clone()).collect();
    // find the most recent chat_turn per log_id
    let turns: Vec<(String, String, String, String)> = T::chat_turns
        .filter(T::log_id.eq_any(&log_ids))
        .order((T::log_id, T::id.desc()))
        .select((T::id, T::log_id, T::topic, T::person_id))
        .load::<(String, String, String, String)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    // dedupe to last (highest id) per log_id
    let mut latest: std::collections::HashMap<String, (String, String, String)> =
        std::collections::HashMap::new();
    for (turn_id, log_id, topic, person_id) in turns {
        latest
            .entry(log_id)
            .and_modify(|e| {
                if turn_id > e.0 {
                    *e = (turn_id.clone(), topic.clone(), person_id.clone());
                }
            })
            .or_insert((turn_id, topic, person_id));
    }
    // resolve person name
    let person_ids: Vec<String> = latest
        .values()
        .map(|(_, _, pid)| pid.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    let person_names: std::collections::HashMap<String, String> = P::people
        .filter(P::id.eq_any(&person_ids))
        .select((P::id, P::name))
        .load::<(String, String)>(&mut *conn)
        .map_err(|e| e.to_string())?
        .into_iter()
        .collect();

    Ok(log_rows
        .into_iter()
        .map(|l| {
            let (turn_id, topic, person_id) = latest
                .get(&l.id)
                .cloned()
                .map(|(t, top, p)| (Some(t), Some(top), Some(p)))
                .unwrap_or((None, None, None));
            let partner_name = person_id
                .as_ref()
                .and_then(|pid| person_names.get(pid).cloned());
            LogRowWithTurn {
                id: l.id,
                occurred_at: l.occurred_at,
                app_name: l.app_name,
                app_bundle_id: l.app_bundle_id,
                is_send: l.is_send,
                is_wechat: l.is_wechat,
                screenshot_path: l.screenshot_path,
                created_at: l.created_at,
                turn_id,
                topic,
                partner_name,
                person_id,
            }
        })
        .collect())
}

#[tauri::command]
pub fn db_create_log(
    state: tauri::State<DbState>,
    id: String,
    occurred_at: String,
    app_name: String,
    app_bundle_id: Option<String>,
    is_send: Option<bool>,
    is_wechat: Option<bool>,
    screenshot_path: Option<String>,
) -> Result<LogRow, String> {
    use crate::db::schema::logs::dsl as L;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    let new_log = (
        L::id.eq(&id),
        L::occurred_at.eq(&occurred_at),
        L::app_name.eq(&app_name),
        L::app_bundle_id.eq(app_bundle_id.unwrap_or_default()),
        L::is_send.eq(if is_send.unwrap_or(false) { 1_i32 } else { 0 }),
        L::is_wechat.eq(if is_wechat.unwrap_or(false) { 1_i32 } else { 0 }),
        L::screenshot_path.eq(screenshot_path),
        L::created_at.eq(&now),
    );
    diesel::insert_into(L::logs)
        .values(&new_log)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    L::logs
        .filter(L::id.eq(&id))
        .first::<LogRow>(&mut *conn)
        .map_err(|e| e.to_string())
}

// ── people ──────────────────────────────────────────────────────

#[tauri::command]
pub fn db_list_people(
    state: tauri::State<DbState>,
    query: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<PersonSummary>, String> {
    use crate::db::schema::chat_turns::dsl as T;
    use crate::db::schema::people::dsl as P;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(50) as i64;
    let mut q = P::people.into_boxed();
    if let Some(name_like) = query {
        q = q.filter(P::name.like(format!("%{name_like}%")));
    }
    let people: Vec<(String, String, String, String, String)> = q
        .order(P::updated_at.desc())
        .limit(lim)
        .select((P::id, P::name, P::client_app, P::created_at, P::updated_at))
        .load::<(String, String, String, String, String)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    if people.is_empty() {
        return Ok(vec![]);
    }
    let ids: Vec<String> = people.iter().map(|(id, ..)| id.clone()).collect();
    // turn_count + last_chat_at per person
    let stats: Vec<(String, i64, Option<String>)> = T::chat_turns
        .filter(T::person_id.eq_any(&ids))
        .group_by(T::person_id)
        .select((
            T::person_id,
            diesel::dsl::count_star(),
            diesel::dsl::max(T::captured_at),
        ))
        .load::<(String, i64, Option<String>)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    let mut count_map: std::collections::HashMap<String, (i64, Option<String>)> =
        stats.into_iter().map(|(k, c, l)| (k, (c, l))).collect();
    Ok(people
        .into_iter()
        .map(|(id, name, client_app, created_at, updated_at)| {
            let (turn_count, last_chat_at) = count_map.remove(&id).unwrap_or((0, None));
            PersonSummary {
                id,
                name,
                client_app,
                created_at,
                updated_at,
                turn_count: turn_count as i32,
                last_chat_at,
            }
        })
        .collect())
}

#[tauri::command]
pub fn db_get_person(
    state: tauri::State<DbState>,
    id: String,
) -> Result<Option<PersonDetail>, String> {
    use crate::db::schema::chat_turns::dsl as T;
    use crate::db::schema::people::dsl as P;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let person: Option<(String, String, String, String, String)> = P::people
        .filter(P::id.eq(&id))
        .select((P::id, P::name, P::client_app, P::created_at, P::updated_at))
        .first::<(String, String, String, String, String)>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())?;
    let Some((id, name, client_app, created_at, updated_at)) = person else {
        return Ok(None);
    };
    let turn_count: i64 = T::chat_turns
        .filter(T::person_id.eq(&id))
        .count()
        .get_result(&mut *conn)
        .map_err(|e| e.to_string())?;
    let last_chat_at: Option<String> = T::chat_turns
        .filter(T::person_id.eq(&id))
        .order(T::captured_at.desc())
        .select(T::captured_at)
        .first::<String>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())?;
    let turn_rows: Vec<(String, String, String, String)> = T::chat_turns
        .filter(T::person_id.eq(&id))
        .order(T::id.desc())
        .limit(10)
        .select((T::id, T::log_id, T::topic, T::captured_at))
        .load::<(String, String, String, String)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    // Flatten turns → ChatTurnJson with messages. For detail we collapse
    // to a single linear message list under the most recent turn (matches
    // the legacy `messages` shape the views expect).
    use crate::db::schema::chat_messages::dsl as M;
    let messages: Vec<ChatMessageJson> =
        if let Some((turn_id, _, topic, captured_at)) = turn_rows.first().cloned() {
            M::chat_messages
                .filter(M::turn_id.eq(&turn_id))
                .order(M::seq.asc())
                .select((M::role, M::content, M::sender_name))
                .load::<(String, String, Option<String>)>(&mut *conn)
                .map_err(|e| e.to_string())?
                .into_iter()
                .map(|(role, content, sender_name)| ChatMessageJson {
                    role,
                    content,
                    captured_at: captured_at.clone(),
                    topic: topic.clone(),
                    sender_name,
                })
                .collect()
        } else {
            vec![]
        };
    let turns: Vec<ChatTurnJson> = turn_rows
        .into_iter()
        .map(|(turn_id, log_id, topic, captured_at)| ChatTurnJson {
            id: turn_id,
            log_id,
            topic,
            captured_at,
            messages: vec![],
        })
        .collect();
    Ok(Some(PersonDetail {
        id,
        name,
        client_app,
        created_at,
        updated_at,
        turn_count: turn_count as i32,
        last_chat_at,
        turns,
        messages,
    }))
}

#[tauri::command]
pub fn db_create_person(
    state: tauri::State<DbState>,
    id: String,
    name: String,
    client_app: Option<String>,
) -> Result<PersonSummary, String> {
    use crate::db::schema::people::dsl as P;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    let client = client_app.unwrap_or_else(|| "WeChat".to_string());
    // upsert: if (name, client_app) exists, return it; else insert.
    let existing: Option<(String, String, String, String, String)> = P::people
        .filter(P::name.eq(&name).and(P::client_app.eq(&client)))
        .select((P::id, P::name, P::client_app, P::created_at, P::updated_at))
        .first::<(String, String, String, String, String)>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())?;
    if let Some((id, name, client_app, created_at, updated_at)) = existing {
        return Ok(PersonSummary {
            id,
            name,
            client_app,
            created_at,
            updated_at,
            turn_count: 0,
            last_chat_at: None,
        });
    }
    let values = (
        P::id.eq(&id),
        P::name.eq(&name),
        P::client_app.eq(&client),
        P::created_at.eq(&now),
        P::updated_at.eq(&now),
    );
    diesel::insert_into(P::people)
        .values(&values)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(PersonSummary {
        id,
        name,
        client_app: client,
        created_at: now.clone(),
        updated_at: now,
        turn_count: 0,
        last_chat_at: None,
    })
}

#[tauri::command]
pub fn db_delete_person(state: tauri::State<DbState>, id: String) -> Result<(), String> {
    use crate::db::schema::people::dsl as P;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    diesel::delete(P::people.filter(P::id.eq(&id)))
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── tasks ───────────────────────────────────────────────────────

#[tauri::command]
pub fn db_list_tasks(
    state: tauri::State<DbState>,
    status: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<TaskRow>, String> {
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(100) as i64;
    let mut q = Ta::tasks.into_boxed();
    if let Some(s) = &status {
        if s != "all" {
            q = q.filter(Ta::status.eq(s.clone()));
        }
    }
    q = q.order((Ta::status.asc(), Ta::due_at.asc())).limit(lim);
    q.load::<TaskRow>(&mut *conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_get_task(state: tauri::State<DbState>, id: String) -> Result<Option<TaskRow>, String> {
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    Ta::tasks
        .filter(Ta::id.eq(&id))
        .first::<TaskRow>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_get_task_by_fingerprint(
    state: tauri::State<DbState>,
    fingerprint: String,
) -> Result<Option<TaskRow>, String> {
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    Ta::tasks
        .filter(Ta::fingerprint.eq(&fingerprint))
        .first::<TaskRow>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_create_task(
    state: tauri::State<DbState>,
    id: String,
    title: String,
    description: Option<String>,
    due_at: Option<String>,
    person_id: Option<String>,
    log_id: Option<String>,
    source_turn_id: Option<String>,
    evidence: Option<String>,
    fingerprint: String,
) -> Result<TaskRow, String> {
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    let values = (
        Ta::id.eq(&id),
        Ta::title.eq(&title),
        Ta::description.eq(description.unwrap_or_default()),
        Ta::due_at.eq(due_at),
        Ta::person_id.eq(person_id),
        Ta::log_id.eq(log_id),
        Ta::source_turn_id.eq(source_turn_id),
        Ta::status.eq("pending"),
        Ta::fingerprint.eq(&fingerprint),
        Ta::evidence.eq(evidence.unwrap_or_default()),
        Ta::created_at.eq(&now),
        Ta::updated_at.eq(&now),
    );
    diesel::insert_into(Ta::tasks)
        .values(&values)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ta::tasks
        .filter(Ta::id.eq(&id))
        .first::<TaskRow>(&mut *conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_update_task(
    state: tauri::State<DbState>,
    id: String,
    title: Option<String>,
    description: Option<String>,
    due_at: Option<Option<String>>, // double Option: None = don't change, Some(None) = clear
    status: Option<String>,
) -> Result<TaskRow, String> {
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    // Each field gets its own update statement — keeps types simple.
    let target = Ta::tasks.filter(Ta::id.eq(&id));
    diesel::update(target)
        .set(Ta::updated_at.eq(&now))
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    if let Some(t) = title {
        diesel::update(Ta::tasks.filter(Ta::id.eq(&id)))
            .set(Ta::title.eq(t))
            .execute(&mut *conn)
            .map_err(|e| e.to_string())?;
    }
    if let Some(d) = description {
        diesel::update(Ta::tasks.filter(Ta::id.eq(&id)))
            .set(Ta::description.eq(d))
            .execute(&mut *conn)
            .map_err(|e| e.to_string())?;
    }
    if let Some(d) = due_at {
        diesel::update(Ta::tasks.filter(Ta::id.eq(&id)))
            .set(Ta::due_at.eq(d))
            .execute(&mut *conn)
            .map_err(|e| e.to_string())?;
    }
    if let Some(s) = status {
        if s == "completed" {
            diesel::update(Ta::tasks.filter(Ta::id.eq(&id)))
                .set((Ta::status.eq("completed"), Ta::completed_at.eq(&now)))
                .execute(&mut *conn)
                .map_err(|e| e.to_string())?;
        } else {
            diesel::update(Ta::tasks.filter(Ta::id.eq(&id)))
                .set((
                    Ta::status.eq("pending"),
                    Ta::completed_at.eq(Option::<String>::None),
                ))
                .execute(&mut *conn)
                .map_err(|e| e.to_string())?;
        }
    }
    Ta::tasks
        .filter(Ta::id.eq(&id))
        .first::<TaskRow>(&mut *conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_delete_task(state: tauri::State<DbState>, id: String) -> Result<(), String> {
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    diesel::delete(Ta::tasks.filter(Ta::id.eq(&id)))
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn db_get_stats(state: tauri::State<DbState>) -> Result<Stats, String> {
    use crate::db::schema::agent_messages::dsl as AM;
    use crate::db::schema::agent_sessions::dsl as AS;
    use crate::db::schema::ai_events::dsl as E;
    use crate::db::schema::chat_messages::dsl as M;
    use crate::db::schema::chat_turns::dsl as T;
    use crate::db::schema::logs::dsl as L;
    use crate::db::schema::people::dsl as P;
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let total: i64 = Ta::tasks.count().get_result(&mut *conn).unwrap_or(0);
    let pending: i64 = Ta::tasks
        .filter(Ta::status.eq("pending"))
        .count()
        .get_result(&mut *conn)
        .unwrap_or(0);
    let people: i64 = P::people.count().get_result(&mut *conn).unwrap_or(0);
    let turns: i64 = T::chat_turns.count().get_result(&mut *conn).unwrap_or(0);
    let messages: i64 = M::chat_messages.count().get_result(&mut *conn).unwrap_or(0);
    let logs: i64 = L::logs.count().get_result(&mut *conn).unwrap_or(0);
    let event_count = |kind: &str, conn: &mut SqliteConnection| -> i64 {
        E::ai_events
            .filter(E::event_type.eq(kind))
            .count()
            .get_result(conn)
            .unwrap_or(0)
    };
    let reply_events = event_count("reply_suggestion", &mut *conn);
    let task_detection_events = event_count("task_detection", &mut *conn);
    let agent_interaction_events = event_count("agent_interaction", &mut *conn);
    let agent_assistant_messages: i64 = AM::agent_messages
        .filter(AM::role.eq("assistant"))
        .count()
        .get_result(&mut *conn)
        .unwrap_or(0);
    let agent_sessions: i64 = AS::agent_sessions
        .count()
        .get_result(&mut *conn)
        .unwrap_or(0);
    let ai_interactions = logs + reply_events + task_detection_events + agent_interaction_events;
    Ok(Stats {
        tasks_total: total as i32,
        tasks_pending: pending as i32,
        tasks_completed: (total - pending) as i32,
        people: people as i32,
        chat_turns: turns as i32,
        chat_messages: messages as i32,
        logs: logs as i32,
        ai_interactions: ai_interactions as i32,
        ai_reply_suggestions: reply_events as i32,
        ai_task_detections: if task_detection_events > 0 {
            task_detection_events as i32
        } else {
            total as i32
        },
        ai_agent_messages: if agent_assistant_messages > 0 {
            agent_assistant_messages as i32
        } else {
            agent_sessions as i32
        },
    })
}

#[tauri::command]
pub fn db_record_ai_event(
    state: tauri::State<DbState>,
    id: String,
    event_type: String,
    ref_id: Option<String>,
    metadata: Option<serde_json::Value>,
) -> Result<(), String> {
    use crate::db::schema::ai_events::dsl as E;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let metadata_text = metadata.map(|value| value.to_string());
    diesel::insert_or_ignore_into(E::ai_events)
        .values((
            E::id.eq(id),
            E::event_type.eq(event_type),
            E::ref_id.eq(ref_id),
            E::metadata.eq(metadata_text),
        ))
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── agent_sessions ──────────────────────────────────────────────

#[tauri::command]
pub fn db_list_agent_sessions(
    state: tauri::State<DbState>,
) -> Result<Vec<AgentSessionSummary>, String> {
    use crate::db::schema::agent_messages::dsl as M;
    use crate::db::schema::agent_sessions::dsl as S;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let sessions: Vec<(String, String, String, String)> = S::agent_sessions
        .order(S::updated_at.desc())
        .select((S::id, S::title, S::created_at, S::updated_at))
        .load::<(String, String, String, String)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    if sessions.is_empty() {
        return Ok(vec![]);
    }
    let ids: Vec<String> = sessions.iter().map(|(id, ..)| id.clone()).collect();
    let counts: Vec<(String, i64)> = M::agent_messages
        .filter(M::session_id.eq_any(&ids))
        .group_by(M::session_id)
        .select((M::session_id, diesel::dsl::count_star()))
        .load::<(String, i64)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    let last_users: Vec<(String, String, i32)> = M::agent_messages
        .filter(M::session_id.eq_any(&ids).and(M::role.eq("user")))
        .order((M::session_id, M::seq.desc()))
        .select((M::session_id, M::content, M::seq))
        .load::<(String, String, i32)>(&mut *conn)
        .map_err(|e| e.to_string())?;
    // dedupe to first-seen (highest seq) per session — query is already
    // ordered (session_id, seq DESC) so first row per session wins.
    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut last_user_map: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();
    for (sid, content, _seq) in last_users {
        if seen.insert(sid.clone()) {
            last_user_map.insert(sid, content);
        }
    }
    let mut count_map: std::collections::HashMap<String, i64> = counts.into_iter().collect();
    Ok(sessions
        .into_iter()
        .map(|(id, title, created_at, updated_at)| {
            let count = count_map.remove(&id).unwrap_or(0);
            let last = last_user_map.remove(&id);
            AgentSessionSummary {
                id,
                title,
                message_count: count as i32,
                last_user_message: last,
                created_at,
                updated_at,
            }
        })
        .collect())
}

#[tauri::command]
pub fn db_get_agent_session(
    state: tauri::State<DbState>,
    id: String,
) -> Result<Option<AgentSessionDetail>, String> {
    use crate::db::schema::agent_messages::dsl as M;
    use crate::db::schema::agent_sessions::dsl as S;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let session: Option<(String, String)> = S::agent_sessions
        .filter(S::id.eq(&id))
        .select((S::id, S::title))
        .first::<(String, String)>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())?;
    let Some((id, title)) = session else {
        return Ok(None);
    };
    let messages: Vec<AgentMessageJson> = M::agent_messages
        .filter(M::session_id.eq(&id))
        .order(M::seq.asc())
        .select((
            M::id,
            M::role,
            M::kind,
            M::content,
            M::tool_name,
            M::tool_input,
            M::tool_result,
            M::is_error,
            M::seq,
            M::created_at,
        ))
        .load::<(
            String,
            String,
            String,
            String,
            Option<String>,
            Option<String>,
            Option<String>,
            i32,
            i32,
            String,
        )>(&mut *conn)
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(
            |(
                id,
                role,
                kind,
                content,
                tool_name,
                tool_input,
                tool_result,
                is_error,
                seq,
                created_at,
            )| {
                AgentMessageJson {
                    id,
                    role,
                    kind,
                    content,
                    tool_name,
                    tool_input: tool_input.and_then(|s| serde_json::from_str(&s).ok()),
                    tool_result: tool_result.and_then(|s| serde_json::from_str(&s).ok()),
                    is_error,
                    seq,
                    created_at,
                }
            },
        )
        .collect();
    Ok(Some(AgentSessionDetail {
        id,
        title,
        messages,
    }))
}

#[tauri::command]
pub fn db_create_agent_session(
    state: tauri::State<DbState>,
    id: String,
    user_id: String,
    title: Option<String>,
    screen_context: Option<String>,
) -> Result<AgentSessionDetail, String> {
    use crate::db::schema::agent_sessions::dsl as S;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    let title = title.unwrap_or_default();
    let values = (
        S::id.eq(&id),
        S::user_id.eq(&user_id),
        S::title.eq(&title),
        S::screen_context.eq(screen_context.and_then(|s| {
            if serde_json::from_str::<serde_json::Value>(&s).is_ok() {
                Some(s)
            } else {
                None
            }
        })),
        S::created_at.eq(&now),
        S::updated_at.eq(&now),
    );
    diesel::insert_into(S::agent_sessions)
        .values(&values)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(AgentSessionDetail {
        id,
        title,
        messages: vec![],
    })
}

#[tauri::command]
pub fn db_delete_agent_session(state: tauri::State<DbState>, id: String) -> Result<(), String> {
    use crate::db::schema::agent_sessions::dsl as S;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    diesel::delete(S::agent_sessions.filter(S::id.eq(&id)))
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Deserialize)]
pub struct AgentMessageInput {
    pub role: String,
    pub kind: Option<String>,
    pub content: String,
    pub tool_name: Option<String>,
    pub tool_input: Option<serde_json::Value>,
    pub tool_result: Option<serde_json::Value>,
    pub is_error: Option<bool>,
}

#[tauri::command]
pub fn db_append_agent_message(
    state: tauri::State<DbState>,
    session_id: String,
    id: String,
    role: String,
    kind: Option<String>,
    content: String,
    tool_name: Option<String>,
    tool_input: Option<serde_json::Value>,
    tool_result: Option<serde_json::Value>,
    is_error: Option<bool>,
) -> Result<AgentMessageJson, String> {
    use crate::db::schema::agent_messages::dsl as M;
    use crate::db::schema::agent_sessions::dsl as S;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let last_seq: Option<i32> = M::agent_messages
        .filter(M::session_id.eq(&session_id))
        .order(M::seq.desc())
        .select(M::seq)
        .first::<i32>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())?;
    let seq = last_seq.map(|s| s + 1).unwrap_or(0);
    let now = chrono::Local::now().to_rfc3339();
    let tool_input_str = tool_input
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_default());
    let tool_result_str = tool_result
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_default());
    let kind = kind.unwrap_or_else(|| "message".to_string());
    let values = (
        M::id.eq(&id),
        M::session_id.eq(&session_id),
        M::role.eq(&role),
        M::kind.eq(&kind),
        M::content.eq(&content),
        M::tool_name.eq(tool_name.clone()),
        M::tool_input.eq(tool_input_str),
        M::tool_result.eq(tool_result_str),
        M::is_error.eq(if is_error.unwrap_or(false) { 1_i32 } else { 0 }),
        M::seq.eq(seq),
        M::created_at.eq(&now),
    );
    diesel::insert_into(M::agent_messages)
        .values(&values)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    let _ = diesel::update(S::agent_sessions.filter(S::id.eq(&session_id)))
        .set(S::updated_at.eq(&now))
        .execute(&mut *conn);
    Ok(AgentMessageJson {
        id,
        role,
        kind,
        content,
        tool_name,
        tool_input,
        tool_result,
        is_error: if is_error.unwrap_or(false) { 1 } else { 0 },
        seq,
        created_at: now,
    })
}

#[tauri::command]
pub fn db_batch_append_agent_messages(
    state: tauri::State<DbState>,
    session_id: String,
    messages: Vec<AgentMessageInput>,
) -> Result<Vec<AgentMessageJson>, String> {
    use crate::db::schema::agent_messages::dsl as M;
    use crate::db::schema::agent_sessions::dsl as S;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let last_seq: Option<i32> = M::agent_messages
        .filter(M::session_id.eq(&session_id))
        .order(M::seq.desc())
        .select(M::seq)
        .first::<i32>(&mut *conn)
        .optional()
        .map_err(|e| e.to_string())?;
    let mut seq = last_seq.map(|s| s + 1).unwrap_or(0);
    let now = chrono::Local::now().to_rfc3339();
    let mut out: Vec<AgentMessageJson> = Vec::with_capacity(messages.len());
    let mut new_id_counter: i64 = chrono::Local::now().timestamp_millis();
    for m in messages {
        let id = format!("am-{}-{}", now, new_id_counter);
        new_id_counter += 1;
        // Pull every field out of `m` up-front so we can use it twice
        // (once for the SQL insert, once for the response struct) without
        // fighting the borrow checker.
        let role = m.role;
        let kind = m.kind.unwrap_or_else(|| "message".to_string());
        let content = m.content;
        let tool_name = m.tool_name;
        let tool_input = m.tool_input;
        let tool_result = m.tool_result;
        let is_error = m.is_error.unwrap_or(false);
        let tool_input_str = tool_input
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap_or_default());
        let tool_result_str = tool_result
            .as_ref()
            .map(|v| serde_json::to_string(v).unwrap_or_default());
        let values = (
            M::id.eq(&id),
            M::session_id.eq(&session_id),
            M::role.eq(&role),
            M::kind.eq(&kind),
            M::content.eq(&content),
            M::tool_name.eq(tool_name.clone()),
            M::tool_input.eq(tool_input_str),
            M::tool_result.eq(tool_result_str),
            M::is_error.eq(if is_error { 1_i32 } else { 0 }),
            M::seq.eq(seq),
            M::created_at.eq(&now),
        );
        diesel::insert_into(M::agent_messages)
            .values(&values)
            .execute(&mut *conn)
            .map_err(|e| e.to_string())?;
        out.push(AgentMessageJson {
            id,
            role,
            kind,
            content,
            tool_name,
            tool_input,
            tool_result,
            is_error: if is_error { 1 } else { 0 },
            seq,
            created_at: now.clone(),
        });
        seq += 1;
    }
    let _ = diesel::update(S::agent_sessions.filter(S::id.eq(&session_id)))
        .set(S::updated_at.eq(&now))
        .execute(&mut *conn);
    Ok(out)
}

// ── chat turns (used by analyze pipeline) ───────────────────────

#[tauri::command]
pub fn db_create_chat_turn(
    state: tauri::State<DbState>,
    id: String,
    log_id: String,
    person_id: String,
    topic: Option<String>,
    captured_at: String,
) -> Result<(), String> {
    use crate::db::schema::chat_turns::dsl as T;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let values = (
        T::id.eq(&id),
        T::log_id.eq(&log_id),
        T::person_id.eq(&person_id),
        T::topic.eq(topic.unwrap_or_default()),
        T::captured_at.eq(&captured_at),
    );
    diesel::insert_into(T::chat_turns)
        .values(&values)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(serde::Deserialize)]
pub struct ChatMessageInput {
    pub id: String,
    pub turn_id: String,
    pub role: String,
    pub content: String,
    pub sender_name: Option<String>,
    pub seq: i32,
}

#[tauri::command]
pub fn db_batch_insert_chat_messages(
    state: tauri::State<DbState>,
    messages: Vec<ChatMessageInput>,
) -> Result<(), String> {
    use crate::db::schema::chat_messages::dsl as M;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Local::now().to_rfc3339();
    for m in messages {
        let values = (
            M::id.eq(&m.id),
            M::turn_id.eq(&m.turn_id),
            M::role.eq(&m.role),
            M::content.eq(&m.content),
            M::sender_name.eq(m.sender_name),
            M::content_type.eq("text"),
            M::is_quoted.eq(0_i32),
            M::is_revoked.eq(0_i32),
            M::message_key.eq(""),
            M::seq.eq(m.seq),
            M::created_at.eq(&now),
        );
        diesel::insert_into(M::chat_messages)
            .values(&values)
            .execute(&mut *conn)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn db_get_db_path() -> String {
    let path = std::env::var("PERCENT_HOME")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            dirs::home_dir()
                .unwrap_or_else(|| std::path::PathBuf::from("."))
                .join(".percent-tracker")
        })
        .join("percent.db");
    path.to_string_lossy().to_string()
}

// ── cache-clearing Tauri commands ──────────────────────────────
//
// The Settings page used to DELETE /logs / /people / /tasks on the
// Vercel server. Those routes are gone — the client now talks to
// SQLite directly. Each command runs on the shared connection (no
// cross-connection races) and returns the number of rows removed so
// the UI can show "cleared N rows".

#[tauri::command]
pub fn db_purge_all_logs(state: tauri::State<DbState>) -> Result<usize, String> {
    use crate::db::schema::logs::dsl as L;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let n = diesel::delete(L::logs)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(n)
}

#[tauri::command]
pub fn db_purge_all_people(state: tauri::State<DbState>) -> Result<usize, String> {
    use crate::db::schema::chat_messages::dsl as M;
    use crate::db::schema::chat_turns::dsl as T;
    use crate::db::schema::people::dsl as P;
    use crate::db::schema::tasks::dsl as Ta;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    // Cascade: chat_messages → chat_turns → tasks reference people, so
    // wipe them in the right order to satisfy the FK constraints.
    let n = conn
        .transaction::<_, diesel::result::Error, _>(|conn| {
            diesel::delete(M::chat_messages).execute(conn)?;
            diesel::delete(T::chat_turns).execute(conn)?;
            diesel::delete(Ta::tasks).execute(conn)?;
            diesel::delete(P::people).execute(conn)
        })
        .map_err(|e| e.to_string())?;
    Ok(n as usize)
}

#[tauri::command]
pub fn db_purge_all_tasks(state: tauri::State<DbState>) -> Result<usize, String> {
    use crate::db::schema::tasks::dsl as T;
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let n = diesel::delete(T::tasks)
        .execute(&mut *conn)
        .map_err(|e| e.to_string())?;
    Ok(n)
}
