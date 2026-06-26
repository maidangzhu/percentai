use reqwest::blocking::Client;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs;
use std::path::Path;
use std::time::Instant;

const KEYCHAIN_SERVICE: &str = "percent-v2";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderProfile {
    pub id: String,
    pub display_name: String,
    pub provider_preset_id: String,
    pub protocol: String,
    pub base_url: Option<String>,
    pub model_id: String,
    pub model_name: Option<String>,
    pub api_key_ref: Option<String>,
    pub supports_text: bool,
    pub supports_image: bool,
    pub supports_streaming: bool,
    pub supports_tools: bool,
    pub last_text_test_status: Option<String>,
    pub last_image_test_status: Option<String>,
    pub last_streaming_test_status: Option<String>,
    pub last_tools_test_status: Option<String>,
    pub last_tested_at: Option<String>,
    pub is_default: bool,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderProfileInput {
    pub id: Option<String>,
    pub display_name: String,
    pub provider_preset_id: String,
    pub protocol: String,
    pub base_url: Option<String>,
    pub model_id: String,
    pub model_name: Option<String>,
    pub is_default: bool,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveApiKeyResult {
    pub api_key_ref: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderTestResult {
    pub id: String,
    pub provider_profile_id: String,
    pub test_kind: String,
    pub status: String,
    pub normalized_error_code: Option<String>,
    pub normalized_error_message: Option<String>,
    pub latency_ms: Option<i64>,
    pub metadata_json: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunProviderTestInput {
    pub profile_id: String,
    pub test_kind: String,
}

pub fn init_database(data_dir: &Path) -> Result<(), String> {
    fs::create_dir_all(data_dir).map_err(|error| error.to_string())?;
    let conn = open_connection(data_dir)?;
    migrate(&conn)
}

pub fn list_provider_profiles(data_dir: &Path) -> Result<Vec<ProviderProfile>, String> {
    let conn = open_connection(data_dir)?;
    migrate(&conn)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, display_name, provider_preset_id, protocol, base_url, model_id, model_name,
                    api_key_ref, supports_text, supports_image, supports_streaming, supports_tools,
                    last_text_test_status, last_image_test_status, last_streaming_test_status,
                    last_tools_test_status, last_tested_at, is_default, enabled, created_at, updated_at
             FROM provider_profiles
             WHERE enabled = 1
             ORDER BY is_default DESC, updated_at DESC",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], row_to_provider_profile)
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn get_default_provider_profile(data_dir: &Path) -> Result<Option<ProviderProfile>, String> {
    let conn = open_connection(data_dir)?;
    migrate(&conn)?;
    conn.query_row(
        "SELECT id, display_name, provider_preset_id, protocol, base_url, model_id, model_name,
                api_key_ref, supports_text, supports_image, supports_streaming, supports_tools,
                last_text_test_status, last_image_test_status, last_streaming_test_status,
                last_tools_test_status, last_tested_at, is_default, enabled, created_at, updated_at
         FROM provider_profiles
         WHERE enabled = 1 AND is_default = 1
         LIMIT 1",
        [],
        row_to_provider_profile,
    )
    .optional()
    .map_err(|error| error.to_string())
}

pub fn upsert_provider_profile(
    data_dir: &Path,
    input: ProviderProfileInput,
) -> Result<ProviderProfile, String> {
    validate_profile_input(&input)?;
    let conn = open_connection(data_dir)?;
    migrate(&conn)?;

    let now = now_iso();
    let id = input.id.unwrap_or_else(new_id);
    let existing: Option<(String, Option<String>)> = conn
        .query_row(
            "SELECT created_at, api_key_ref FROM provider_profiles WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let (created_at, api_key_ref) = existing.unwrap_or_else(|| (now.clone(), None));

    if input.is_default {
        clear_default_profile(&conn)?;
    }

    conn.execute(
        "INSERT INTO provider_profiles (
            id, display_name, provider_preset_id, protocol, base_url, model_id, model_name, api_key_ref,
            supports_text, supports_image, supports_streaming, supports_tools,
            last_text_test_status, last_image_test_status, last_streaming_test_status, last_tools_test_status,
            last_tested_at, is_default, enabled, created_at, updated_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            COALESCE((SELECT supports_text FROM provider_profiles WHERE id = ?1), 0),
            COALESCE((SELECT supports_image FROM provider_profiles WHERE id = ?1), 0),
            COALESCE((SELECT supports_streaming FROM provider_profiles WHERE id = ?1), 0),
            COALESCE((SELECT supports_tools FROM provider_profiles WHERE id = ?1), 0),
            (SELECT last_text_test_status FROM provider_profiles WHERE id = ?1),
            (SELECT last_image_test_status FROM provider_profiles WHERE id = ?1),
            (SELECT last_streaming_test_status FROM provider_profiles WHERE id = ?1),
            (SELECT last_tools_test_status FROM provider_profiles WHERE id = ?1),
            (SELECT last_tested_at FROM provider_profiles WHERE id = ?1),
            ?9, ?10, ?11, ?12
        )
        ON CONFLICT(id) DO UPDATE SET
            display_name = excluded.display_name,
            provider_preset_id = excluded.provider_preset_id,
            protocol = excluded.protocol,
            base_url = excluded.base_url,
            model_id = excluded.model_id,
            model_name = excluded.model_name,
            is_default = excluded.is_default,
            enabled = excluded.enabled,
            updated_at = excluded.updated_at",
        params![
            id,
            input.display_name.trim(),
            input.provider_preset_id,
            input.protocol,
            normalize_optional_text(input.base_url),
            input.model_id.trim(),
            normalize_optional_text(input.model_name),
            api_key_ref,
            bool_to_int(input.is_default),
            bool_to_int(input.enabled),
            created_at,
            now,
        ],
    )
    .map_err(|error| error.to_string())?;

    if !has_default_profile(&conn)? {
        conn.execute(
            "UPDATE provider_profiles
             SET is_default = 1, updated_at = ?2
             WHERE id = (
               SELECT id FROM provider_profiles WHERE enabled = 1 ORDER BY updated_at DESC LIMIT 1
             ) AND id = ?1",
            params![id, now_iso()],
        )
        .map_err(|error| error.to_string())?;
    }

    get_provider_profile(&conn, &id)
}

pub fn delete_provider_profile(data_dir: &Path, profile_id: String) -> Result<(), String> {
    let conn = open_connection(data_dir)?;
    migrate(&conn)?;
    let api_key_ref = conn
        .query_row(
            "SELECT api_key_ref FROM provider_profiles WHERE id = ?1",
            params![profile_id],
            |row| row.get::<_, Option<String>>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?
        .flatten();

    conn.execute(
        "UPDATE provider_profiles SET enabled = 0, is_default = 0, updated_at = ?2 WHERE id = ?1",
        params![profile_id, now_iso()],
    )
    .map_err(|error| error.to_string())?;

    if let Some(api_key_ref) = api_key_ref {
        let _ = delete_provider_api_key(api_key_ref);
    }

    if !has_default_profile(&conn)? {
        conn.execute(
            "UPDATE provider_profiles
             SET is_default = 1, updated_at = ?1
             WHERE id = (
               SELECT id FROM provider_profiles WHERE enabled = 1 ORDER BY updated_at DESC LIMIT 1
             )",
            params![now_iso()],
        )
        .map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn set_default_provider_profile(data_dir: &Path, profile_id: String) -> Result<(), String> {
    let conn = open_connection(data_dir)?;
    migrate(&conn)?;
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM provider_profiles WHERE id = ?1 AND enabled = 1)",
            params![profile_id],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if !exists {
        return Err("Provider profile not found.".to_string());
    }

    clear_default_profile(&conn)?;
    conn.execute(
        "UPDATE provider_profiles SET is_default = 1, updated_at = ?2 WHERE id = ?1",
        params![profile_id, now_iso()],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn save_provider_api_key(
    data_dir: &Path,
    profile_id: String,
    api_key: String,
) -> Result<SaveApiKeyResult, String> {
    let trimmed = api_key.trim();
    if trimmed.is_empty() {
        return Err("API key cannot be empty.".to_string());
    }

    let conn = open_connection(data_dir)?;
    migrate(&conn)?;
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM provider_profiles WHERE id = ?1 AND enabled = 1)",
            params![profile_id],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;
    if !exists {
        return Err("Save the provider profile before saving an API key.".to_string());
    }

    let api_key_ref = keychain_ref(&profile_id);
    keyring_entry(&api_key_ref)?
        .set_password(trimmed)
        .map_err(|error| format!("Keychain save failed: {error}"))?;

    conn.execute(
        "UPDATE provider_profiles SET api_key_ref = ?2, updated_at = ?3 WHERE id = ?1",
        params![profile_id, api_key_ref, now_iso()],
    )
    .map_err(|error| error.to_string())?;

    Ok(SaveApiKeyResult { api_key_ref })
}

pub fn has_provider_api_key(api_key_ref: String) -> Result<bool, String> {
    match keyring_entry(&api_key_ref)?.get_password() {
        Ok(secret) => Ok(!secret.is_empty()),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(error) => Err(format!("Keychain read failed: {error}")),
    }
}

pub fn delete_provider_api_key(api_key_ref: String) -> Result<(), String> {
    match keyring_entry(&api_key_ref)?.delete_password() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(format!("Keychain delete failed: {error}")),
    }
}

pub fn run_provider_profile_test(
    data_dir: &Path,
    input: RunProviderTestInput,
) -> Result<ProviderTestResult, String> {
    if !matches!(input.test_kind.as_str(), "text" | "image") {
        return Err("Only text and image tests are available in this slice.".to_string());
    }

    let conn = open_connection(data_dir)?;
    migrate(&conn)?;
    let profile = get_provider_profile(&conn, &input.profile_id)?;
    let api_key_ref = profile
        .api_key_ref
        .clone()
        .ok_or_else(|| "Save an API key before running provider tests.".to_string())?;
    let api_key = keyring_entry(&api_key_ref)?
        .get_password()
        .map_err(|error| format!("Keychain read failed: {error}"))?;

    let started = Instant::now();
    let test = call_provider_test(&profile, &api_key, &input.test_kind);
    let latency_ms = i64::try_from(started.elapsed().as_millis()).unwrap_or(i64::MAX);
    let now = now_iso();

    let (status, normalized_error_code, normalized_error_message, response_preview) = match test {
        Ok(preview) => ("succeeded".to_string(), None, None, Some(preview)),
        Err(error) => (
            "failed".to_string(),
            Some(error.code),
            Some(error.message),
            None,
        ),
    };

    let result_id = new_id();
    let metadata_json = json!({
        "providerPresetId": profile.provider_preset_id,
        "protocol": profile.protocol,
        "model": profile.model_id,
        "responsePreview": response_preview,
        "imageAttached": input.test_kind == "image"
    })
    .to_string();

    conn.execute(
        "INSERT INTO provider_profile_test_results (
            id, provider_profile_id, test_kind, status, normalized_error_code,
            normalized_error_message, latency_ms, metadata_json, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            result_id,
            profile.id,
            input.test_kind,
            status,
            normalized_error_code,
            normalized_error_message,
            latency_ms,
            metadata_json,
            now,
        ],
    )
    .map_err(|error| error.to_string())?;

    update_profile_test_state(&conn, &input.profile_id, &input.test_kind, &status)?;
    record_ai_event(
        &conn,
        &profile,
        &input.test_kind,
        &status,
        latency_ms,
        normalized_error_code.as_deref(),
        normalized_error_message.as_deref(),
    )?;

    Ok(ProviderTestResult {
        id: result_id,
        provider_profile_id: input.profile_id,
        test_kind: input.test_kind,
        status,
        normalized_error_code,
        normalized_error_message,
        latency_ms: Some(latency_ms),
        metadata_json: Some(metadata_json),
        created_at: now,
    })
}

fn open_connection(data_dir: &Path) -> Result<Connection, String> {
    fs::create_dir_all(data_dir).map_err(|error| error.to_string())?;
    Connection::open(data_dir.join("percent-v2.sqlite")).map_err(|error| error.to_string())
}

fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS provider_profiles (
          id TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          provider_preset_id TEXT NOT NULL,
          protocol TEXT NOT NULL,
          base_url TEXT,
          model_id TEXT NOT NULL,
          model_name TEXT,
          api_key_ref TEXT,
          supports_text INTEGER NOT NULL DEFAULT 0,
          supports_image INTEGER NOT NULL DEFAULT 0,
          supports_streaming INTEGER NOT NULL DEFAULT 0,
          supports_tools INTEGER NOT NULL DEFAULT 0,
          last_text_test_status TEXT,
          last_image_test_status TEXT,
          last_streaming_test_status TEXT,
          last_tools_test_status TEXT,
          last_tested_at TEXT,
          is_default INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS provider_profiles_one_default
          ON provider_profiles(is_default)
          WHERE is_default = 1 AND enabled = 1;

        CREATE TABLE IF NOT EXISTS provider_profile_test_results (
          id TEXT PRIMARY KEY,
          provider_profile_id TEXT NOT NULL,
          test_kind TEXT NOT NULL,
          status TEXT NOT NULL,
          normalized_error_code TEXT,
          normalized_error_message TEXT,
          latency_ms INTEGER,
          metadata_json TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_events (
          id TEXT PRIMARY KEY,
          provider_profile_id TEXT,
          request_kind TEXT NOT NULL,
          provider_type TEXT,
          model TEXT,
          image_attached INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          latency_ms INTEGER,
          normalized_error_code TEXT,
          normalized_error_message TEXT,
          metadata_json TEXT,
          created_at TEXT NOT NULL
        );
        ",
    )
    .map_err(|error| error.to_string())
}

fn validate_profile_input(input: &ProviderProfileInput) -> Result<(), String> {
    if input.display_name.trim().is_empty() {
        return Err("Provider display name is required.".to_string());
    }
    if input.provider_preset_id.trim().is_empty() {
        return Err("Provider preset is required.".to_string());
    }
    if input.model_id.trim().is_empty() {
        return Err("Model ID is required.".to_string());
    }
    if input.provider_preset_id == "custom_openai"
        && normalize_optional_text(input.base_url.clone()).is_none()
    {
        return Err("Base URL is required for custom OpenAI-compatible providers.".to_string());
    }
    Ok(())
}

fn get_provider_profile(conn: &Connection, profile_id: &str) -> Result<ProviderProfile, String> {
    conn.query_row(
        "SELECT id, display_name, provider_preset_id, protocol, base_url, model_id, model_name,
                api_key_ref, supports_text, supports_image, supports_streaming, supports_tools,
                last_text_test_status, last_image_test_status, last_streaming_test_status,
                last_tools_test_status, last_tested_at, is_default, enabled, created_at, updated_at
         FROM provider_profiles
         WHERE id = ?1 AND enabled = 1",
        params![profile_id],
        row_to_provider_profile,
    )
    .map_err(|error| error.to_string())
}

fn row_to_provider_profile(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProviderProfile> {
    Ok(ProviderProfile {
        id: row.get(0)?,
        display_name: row.get(1)?,
        provider_preset_id: row.get(2)?,
        protocol: row.get(3)?,
        base_url: row.get(4)?,
        model_id: row.get(5)?,
        model_name: row.get(6)?,
        api_key_ref: row.get(7)?,
        supports_text: row.get::<_, i64>(8)? == 1,
        supports_image: row.get::<_, i64>(9)? == 1,
        supports_streaming: row.get::<_, i64>(10)? == 1,
        supports_tools: row.get::<_, i64>(11)? == 1,
        last_text_test_status: row.get(12)?,
        last_image_test_status: row.get(13)?,
        last_streaming_test_status: row.get(14)?,
        last_tools_test_status: row.get(15)?,
        last_tested_at: row.get(16)?,
        is_default: row.get::<_, i64>(17)? == 1,
        enabled: row.get::<_, i64>(18)? == 1,
        created_at: row.get(19)?,
        updated_at: row.get(20)?,
    })
}

fn clear_default_profile(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "UPDATE provider_profiles SET is_default = 0 WHERE enabled = 1 AND is_default = 1",
        [],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn has_default_profile(conn: &Connection) -> Result<bool, String> {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM provider_profiles WHERE enabled = 1 AND is_default = 1)",
        [],
        |row| row.get(0),
    )
    .map_err(|error| error.to_string())
}

fn update_profile_test_state(
    conn: &Connection,
    profile_id: &str,
    test_kind: &str,
    status: &str,
) -> Result<(), String> {
    let now = now_iso();
    match test_kind {
        "text" => conn.execute(
            "UPDATE provider_profiles
             SET supports_text = ?2, last_text_test_status = ?3, last_tested_at = ?4, updated_at = ?4
             WHERE id = ?1",
            params![profile_id, bool_to_int(status == "succeeded"), status, now],
        ),
        "image" => conn.execute(
            "UPDATE provider_profiles
             SET supports_image = ?2, last_image_test_status = ?3, last_tested_at = ?4, updated_at = ?4
             WHERE id = ?1",
            params![profile_id, bool_to_int(status == "succeeded"), status, now],
        ),
        _ => Ok(0),
    }
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn record_ai_event(
    conn: &Connection,
    profile: &ProviderProfile,
    test_kind: &str,
    status: &str,
    latency_ms: i64,
    error_code: Option<&str>,
    error_message: Option<&str>,
) -> Result<(), String> {
    let request_kind = match test_kind {
        "image" => "provider_image_test",
        _ => "provider_text_test",
    };
    let metadata_json = json!({
        "providerPresetId": profile.provider_preset_id,
        "protocol": profile.protocol,
        "baseUrlConfigured": profile.base_url.is_some()
    })
    .to_string();

    conn.execute(
        "INSERT INTO ai_events (
            id, provider_profile_id, request_kind, provider_type, model, image_attached,
            status, latency_ms, normalized_error_code, normalized_error_message, metadata_json, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            new_id(),
            profile.id,
            request_kind,
            profile.provider_preset_id,
            profile.model_id,
            bool_to_int(test_kind == "image"),
            status,
            latency_ms,
            error_code,
            error_message,
            metadata_json,
            now_iso(),
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

#[derive(Debug)]
struct ProviderTestError {
    code: String,
    message: String,
}

fn call_provider_test(
    profile: &ProviderProfile,
    api_key: &str,
    test_kind: &str,
) -> Result<String, ProviderTestError> {
    match profile.protocol.as_str() {
        "openai-compatible" => call_openai_compatible_test(profile, api_key, test_kind),
        "anthropic" => call_anthropic_test(profile, api_key, test_kind),
        "gemini" => call_gemini_test(profile, api_key, test_kind),
        other => Err(ProviderTestError {
            code: "unsupported_protocol".to_string(),
            message: format!("Unsupported provider protocol: {other}"),
        }),
    }
}

fn call_openai_compatible_test(
    profile: &ProviderProfile,
    api_key: &str,
    test_kind: &str,
) -> Result<String, ProviderTestError> {
    let base_url = profile
        .base_url
        .as_deref()
        .ok_or_else(|| ProviderTestError {
            code: "missing_base_url".to_string(),
            message: "Base URL is required.".to_string(),
        })?
        .trim_end_matches('/');
    let content = if test_kind == "image" {
        json!([
            {
                "type": "text",
                "text": "Percent image capability test. Reply with OK."
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": tiny_png_data_url()
                }
            }
        ])
    } else {
        json!("Percent text capability test. Reply with OK.")
    };

    let body = json!({
        "model": profile.model_id,
        "messages": [
            {
                "role": "user",
                "content": content
            }
        ],
        "max_tokens": 16
    });

    let response = http_client()
        .post(format!("{base_url}/chat/completions"))
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .map_err(|error| network_error(error))?;

    parse_json_response(response)
}

fn call_anthropic_test(
    profile: &ProviderProfile,
    api_key: &str,
    test_kind: &str,
) -> Result<String, ProviderTestError> {
    let base_url = profile
        .base_url
        .as_deref()
        .unwrap_or("https://api.anthropic.com/v1")
        .trim_end_matches('/');
    let content = if test_kind == "image" {
        json!([
            {
                "type": "text",
                "text": "Percent image capability test. Reply with OK."
            },
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": tiny_png_base64()
                }
            }
        ])
    } else {
        json!("Percent text capability test. Reply with OK.")
    };
    let body = json!({
        "model": profile.model_id,
        "max_tokens": 16,
        "messages": [
            {
                "role": "user",
                "content": content
            }
        ]
    });

    let response = http_client()
        .post(format!("{base_url}/messages"))
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .map_err(|error| network_error(error))?;

    parse_json_response(response)
}

fn call_gemini_test(
    profile: &ProviderProfile,
    api_key: &str,
    test_kind: &str,
) -> Result<String, ProviderTestError> {
    let base_url = profile
        .base_url
        .as_deref()
        .unwrap_or("https://generativelanguage.googleapis.com/v1beta")
        .trim_end_matches('/');
    let parts = if test_kind == "image" {
        json!([
            {
                "text": "Percent image capability test. Reply with OK."
            },
            {
                "inline_data": {
                    "mime_type": "image/png",
                    "data": tiny_png_base64()
                }
            }
        ])
    } else {
        json!([
            {
                "text": "Percent text capability test. Reply with OK."
            }
        ])
    };
    let body = json!({
        "contents": [
            {
                "role": "user",
                "parts": parts
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 16
        }
    });

    let response = http_client()
        .post(format!(
            "{base_url}/models/{}:generateContent?key={api_key}",
            profile.model_id
        ))
        .json(&body)
        .send()
        .map_err(|error| network_error(error))?;

    parse_json_response(response)
}

fn parse_json_response(response: reqwest::blocking::Response) -> Result<String, ProviderTestError> {
    let status = response.status();
    let text = response.text().map_err(|error| network_error(error))?;
    if !status.is_success() {
        return Err(ProviderTestError {
            code: format!("http_{}", status.as_u16()),
            message: truncate(&text, 420),
        });
    }

    Ok(truncate(&text, 420))
}

fn http_client() -> Client {
    Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_else(|_| Client::new())
}

fn network_error(error: reqwest::Error) -> ProviderTestError {
    ProviderTestError {
        code: "network_error".to_string(),
        message: error.to_string(),
    }
}

fn keyring_entry(api_key_ref: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYCHAIN_SERVICE, api_key_ref)
        .map_err(|error| format!("Keychain entry failed: {error}"))
}

fn keychain_ref(profile_id: &str) -> String {
    format!("keychain://percent/provider-profile/{profile_id}/api-key")
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
}

fn bool_to_int(value: bool) -> i64 {
    if value {
        1
    } else {
        0
    }
}

fn new_id() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();

    format!(
        "{}-{}",
        nanos,
        std::process::id()
    )
}

fn now_iso() -> String {
    let output = std::process::Command::new("date")
        .arg("-u")
        .arg("+%Y-%m-%dT%H:%M:%SZ")
        .output();

    match output {
        Ok(output) if output.status.success() => String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string(),
        _ => "1970-01-01T00:00:00Z".to_string(),
    }
}

fn truncate(value: &str, max_chars: usize) -> String {
    value.chars().take(max_chars).collect()
}

fn tiny_png_base64() -> &'static str {
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
}

fn tiny_png_data_url() -> String {
    format!("data:image/png;base64,{}", tiny_png_base64())
}
