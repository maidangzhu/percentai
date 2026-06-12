// Local SQLite database layer — backed by Diesel 2.x + bundled libsqlite3.
// The webview side never imports `diesel`; it goes through Tauri commands
// defined in `commands.rs`. This keeps the webview (WKWebView) sandboxed
// and free of native Node module imports.

pub mod commands;
pub mod schema;

use diesel::{Connection, SqliteConnection};
use std::path::PathBuf;
use std::sync::Mutex;
use diesel::connection::SimpleConnection;

const SCHEMA_SQL: &str = include_str!("../schema.sql");

/// State managed by Tauri — Diesel connection guarded by a Mutex.
/// SQLite is single-writer; serializing access is correct.
pub struct DbState(pub Mutex<SqliteConnection>);

fn db_path() -> PathBuf {
    std::env::var("PERCENT_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".percent-tracker")
        })
        .join("percent.db")
}

pub fn open_db() -> SqliteConnection {
    let path = db_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let url = format!("sqlite://{}?mode=rwc", path.display());
    SqliteConnection::establish(&url).expect("failed to open local sqlite database")
}

pub fn run_migrations(conn: &mut SqliteConnection) {
    conn.batch_execute(SCHEMA_SQL)
        .expect("failed to apply local sqlite schema");
}

pub fn init() -> DbState {
    let mut conn = open_db();
    run_migrations(&mut conn);
    DbState(Mutex::new(conn))
}
