// Diesel table schema for the local SQLite database.
// All DateTime columns are stored as TEXT (ISO 8601 strings) — see schema.sql.
// All Boolean columns are INTEGER (0/1).

diesel::table! {
    logs (id) {
        id -> Text,
        occurred_at -> Text,
        app_name -> Text,
        app_bundle_id -> Text,
        is_send -> Integer,
        is_wechat -> Integer,
        screenshot_path -> Nullable<Text>,
        created_at -> Text,
    }
}

diesel::table! {
    people (id) {
        id -> Text,
        name -> Text,
        client_app -> Text,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    chat_turns (id) {
        id -> Text,
        log_id -> Text,
        person_id -> Text,
        topic -> Text,
        captured_at -> Text,
        raw_ai_response -> Nullable<Text>,
        created_at -> Text,
    }
}

diesel::table! {
    chat_messages (id) {
        id -> Text,
        turn_id -> Text,
        role -> Text,
        sender_name -> Nullable<Text>,
        sender_normalized -> Nullable<Text>,
        content -> Text,
        content_type -> Text,
        quote_text -> Nullable<Text>,
        quote_sender_name -> Nullable<Text>,
        quote_role -> Nullable<Text>,
        quote_content_type -> Nullable<Text>,
        is_quoted -> Integer,
        is_revoked -> Integer,
        message_key -> Text,
        raw_extracted -> Nullable<Text>,
        seq -> Integer,
        created_at -> Text,
    }
}

diesel::table! {
    tasks (id) {
        id -> Text,
        person_id -> Nullable<Text>,
        log_id -> Nullable<Text>,
        source_turn_id -> Nullable<Text>,
        title -> Text,
        description -> Text,
        due_at -> Nullable<Text>,
        status -> Text,
        fingerprint -> Text,
        evidence -> Text,
        raw_ai_response -> Nullable<Text>,
        created_at -> Text,
        updated_at -> Text,
        completed_at -> Nullable<Text>,
    }
}

diesel::table! {
    agent_sessions (id) {
        id -> Text,
        user_id -> Text,
        title -> Text,
        screen_context -> Nullable<Text>,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    agent_messages (id) {
        id -> Text,
        session_id -> Text,
        role -> Text,
        kind -> Text,
        content -> Text,
        tool_name -> Nullable<Text>,
        tool_input -> Nullable<Text>,
        tool_result -> Nullable<Text>,
        is_error -> Integer,
        seq -> Integer,
        created_at -> Text,
    }
}

diesel::joinable!(chat_turns -> logs (log_id));
diesel::joinable!(chat_turns -> people (person_id));
diesel::joinable!(chat_messages -> chat_turns (turn_id));
diesel::joinable!(tasks -> people (person_id));
diesel::joinable!(tasks -> logs (log_id));
diesel::joinable!(tasks -> chat_turns (source_turn_id));
diesel::joinable!(agent_messages -> agent_sessions (session_id));

diesel::allow_tables_to_appear_in_same_query!(
    logs,
    people,
    chat_turns,
    chat_messages,
    tasks,
    agent_sessions,
    agent_messages,
);
