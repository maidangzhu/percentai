// Agent 的客户端 shell 工具：run_bash + read_local_file。
//
// 设计原则：
// - run_bash：每个命令由前端 UI 弹审批卡给用户批；Tauri 端不做白名单/黑名单（信任前端）。输出限 32KB，
//   超时 30s 强制 kill。stdout/stderr 分开拿，截断时设 truncated=true。
// - read_local_file：路径必须 canonicalize 后落在 ~/ 下，否则拒绝。max_bytes 上限 4MB，默认 256KB。
//   文本按 utf8 返回；二进制回 base64。读超过 max_bytes 截断。
//
// 所有调用都打 eprintln!，dev 模式回流 pnpm 终端，方便排错。

use std::io::Read;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;

const DEFAULT_BASH_TIMEOUT_MS: u64 = 30_000;
const MAX_BASH_TIMEOUT_MS: u64 = 120_000;
const BASH_OUTPUT_CAP_BYTES: usize = 32 * 1024;

const DEFAULT_READ_MAX_BYTES: u64 = 256 * 1024;
const MAX_READ_MAX_BYTES: u64 = 4 * 1024 * 1024;
const READ_PREVIEW_BYTES: usize = 256;

#[derive(Clone, Serialize)]
pub struct BashResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub truncated: bool,
    pub timed_out: bool,
}

#[derive(Clone, Serialize)]
pub struct FileReadResult {
    pub content: String,
    pub encoding: String, // "utf8" | "base64"
    pub bytes_read: u64,
    pub truncated: bool,
}

#[tauri::command]
pub fn run_bash(
    cmd: String,
    cwd: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<BashResult, String> {
    let timeout_ms = timeout_ms
        .unwrap_or(DEFAULT_BASH_TIMEOUT_MS)
        .clamp(1_000, MAX_BASH_TIMEOUT_MS);
    let cwd_path = cwd
        .as_deref()
        .map(PathBuf::from)
        .or_else(dirs::home_dir)
        .ok_or_else(|| "no cwd and no home dir".to_string())?;

    eprintln!(
        "[shell_tools] run_bash start cmd={:?} cwd={:?} timeout_ms={}",
        cmd, cwd_path, timeout_ms
    );

    let mut child = Command::new("bash")
        .arg("-c")
        .arg(&cmd)
        .current_dir(&cwd_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null())
        .spawn()
        .map_err(|e| format!("spawn failed: {}", e))?;

    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| "no stdout".to_string())?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or_else(|| "no stderr".to_string())?;

    let (tx_out, rx_out) = mpsc::channel::<Vec<u8>>();
    let (tx_err, rx_err) = mpsc::channel::<Vec<u8>>();

    thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stdout.read_to_end(&mut buf);
        let _ = tx_out.send(buf);
    });
    thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = stderr.read_to_end(&mut buf);
        let _ = tx_err.send(buf);
    });

    let timeout = Duration::from_millis(timeout_ms);
    let start = Instant::now();
    let mut timed_out = false;
    loop {
        match child.try_wait() {
            Ok(Some(_status)) => break,
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    timed_out = true;
                    break;
                }
                thread::sleep(Duration::from_millis(50));
            }
            Err(e) => return Err(format!("wait failed: {}", e)),
        }
    }

    let stdout_bytes = rx_out.recv().unwrap_or_default();
    let stderr_bytes = rx_err.recv().unwrap_or_default();
    let exit_code = child
        .try_wait()
        .ok()
        .and_then(|s| s)
        .and_then(|s| s.code())
        .unwrap_or(if timed_out { -1 } else { 0 });

    let (stdout, stdout_truncated) = truncate_utf8(&stdout_bytes, BASH_OUTPUT_CAP_BYTES);
    let (stderr, stderr_truncated) = truncate_utf8(&stderr_bytes, BASH_OUTPUT_CAP_BYTES);

    eprintln!(
        "[shell_tools] run_bash done exit={} truncated={} timed_out={}",
        exit_code,
        stdout_truncated || stderr_truncated,
        timed_out
    );

    Ok(BashResult {
        stdout,
        stderr,
        exit_code,
        truncated: stdout_truncated || stderr_truncated,
        timed_out,
    })
}

#[tauri::command]
pub fn read_local_file(
    path: String,
    max_bytes: Option<u64>,
) -> Result<FileReadResult, String> {
    let home = dirs::home_dir().ok_or_else(|| "no home dir".to_string())?;
    let requested = PathBuf::from(&path);

    let canonical = requested
        .canonicalize()
        .map_err(|e| format!("path invalid: {}", e))?;

    if !canonical.starts_with(&home) {
        eprintln!("[shell_tools] read_local_file REJECTED path={:?}", path);
        return Err(format!(
            "path '{}' is outside ~/ (only home directory is allowed)",
            path
        ));
    }

    let meta = std::fs::metadata(&canonical).map_err(|e| e.to_string())?;
    if !meta.is_file() {
        return Err(format!("'{}' is not a regular file", path));
    }

    let max = max_bytes
        .unwrap_or(DEFAULT_READ_MAX_BYTES)
        .clamp(1, MAX_READ_MAX_BYTES);

    let mut file = std::fs::File::open(&canonical).map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; (max as usize) + 1];
    let bytes_read = file.read(&mut buf).map_err(|e| e.to_string())?;
    let truncated = (bytes_read as u64) > max;
    let actual_len = if truncated { max as usize } else { bytes_read };
    let slice = &buf[..actual_len];

    let result = match std::str::from_utf8(slice) {
        Ok(text) => FileReadResult {
            content: text.to_string(),
            encoding: "utf8".to_string(),
            bytes_read: actual_len as u64,
            truncated,
        },
        Err(_) => FileReadResult {
            content: base64_encode(slice),
            encoding: "base64".to_string(),
            bytes_read: actual_len as u64,
            truncated,
        },
    };

    eprintln!(
        "[shell_tools] read_local_file path={:?} bytes={} truncated={} encoding={}",
        path, result.bytes_read, result.truncated, result.encoding
    );

    // 小段预览便于排查
    let preview: String = slice
        .iter()
        .take(READ_PREVIEW_BYTES)
        .map(|&b| b as char)
        .collect();
    eprintln!("[shell_tools] read_local_file preview: {:?}", preview);

    Ok(result)
}

fn truncate_utf8(bytes: &[u8], cap: usize) -> (String, bool) {
    if bytes.len() <= cap {
        return (String::from_utf8_lossy(bytes).to_string(), false);
    }
    // 在 cap 之前找最后一个合法 utf8 边界，避免截在多字节字符中间
    let mut end = cap;
    while end > 0 && (bytes[end] & 0b1100_0000) == 0b1000_0000 {
        end -= 1;
    }
    (String::from_utf8_lossy(&bytes[..end]).to_string(), true)
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        out.push(CHARS[(b0 >> 2) & 0x3F] as char);
        out.push(CHARS[((b0 << 4) | (b1 >> 4)) & 0x3F] as char);
        out.push(if chunk.len() > 1 { CHARS[((b1 << 2) | (b2 >> 6)) & 0x3F] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[b2 & 0x3F] as char } else { '=' });
    }
    out
}
