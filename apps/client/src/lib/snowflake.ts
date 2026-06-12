const EPOCH = BigInt(Date.UTC(2026, 0, 1));

// Worker id: in Node we read from env, in the Tauri webview there's no
// `process` global so we fall back to a fixed value. Single-device install
// means worker id only needs to differ across machines, and 1 is fine for
// local SQLite (no two-writer coordination).
function readWorkerId(): number {
  try {
    const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process;
    const raw = proc?.env?.SNOWFLAKE_WORKER_ID;
    if (raw !== undefined) {
      const n = Number(raw);
      if (Number.isFinite(n)) return n & 0x3ff;
    }
  } catch {
    // ignore — fall through to default
  }
  return 1;
}

const WORKER_ID = BigInt(readWorkerId());

let lastTimestamp = 0n;
let sequence = 0n;

function currentMs() {
  return BigInt(Date.now());
}

function waitNextMs(timestamp: bigint) {
  let next = currentMs();
  while (next <= timestamp) {
    next = currentMs();
  }
  return next;
}

export function newSnowflakeId() {
  let timestamp = currentMs();

  if (timestamp < lastTimestamp) {
    timestamp = lastTimestamp;
  }

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & 0xfffn;
    if (sequence === 0n) {
      timestamp = waitNextMs(lastTimestamp);
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  return (((timestamp - EPOCH) << 22n) | (WORKER_ID << 12n) | sequence).toString();
}
