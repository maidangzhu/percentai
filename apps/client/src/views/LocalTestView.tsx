import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Camera, RefreshCcw, AlertCircle, AppWindow } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

interface ScreenshotResult {
  path: string;
  size_bytes: number;
  width: number;
  height: number;
  duration_ms: number;
}

interface FrontmostApp {
  name: string;
  bundle_id: string;
  pid: number;
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

export function LocalTestView() {
  // Primary: 截图测试（production 走的就是这条）
  const [screenshot, setScreenshot] = useState<ScreenshotResult | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  // Secondary: 前台 app 检测（bubble 用来校验 focus）
  const [frontmost, setFrontmost] = useState<FrontmostApp | null>(null);
  const [frontmostError, setFrontmostError] = useState<string | null>(null);
  const [frontmostLoading, setFrontmostLoading] = useState(false);

  const runScreenshot = async () => {
    setScreenshotLoading(true);
    setScreenshotError(null);
    try {
      const r = await invoke<ScreenshotResult>("test_capture_screenshot");
      setScreenshot(r);
    } catch (e) {
      setScreenshotError(e instanceof Error ? e.message : String(e));
    } finally {
      setScreenshotLoading(false);
    }
  };

  const runFrontmost = async () => {
    setFrontmostLoading(true);
    setFrontmostError(null);
    try {
      const r = await invoke<FrontmostApp>("capture_frontmost_app");
      setFrontmost(r);
    } catch (e) {
      setFrontmostError(e instanceof Error ? e.message : String(e));
    } finally {
      setFrontmostLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Debug"
        title="Local capture test"
        description="截屏 + 前台 app 检测。production 主路径。"
      />
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6">
          {/* === 截屏测试（主） === */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
              <h2 className="text-display text-[13.5px] font-medium tracking-tight">截屏测试</h2>
              <span className="rounded-full border border-border/60 px-1.5 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                primary
              </span>
            </div>
            <div className="rounded-md border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2">
                <Button onClick={runScreenshot} disabled={screenshotLoading} size="sm" className="h-8">
                  {screenshotLoading ? (
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                  {screenshotLoading ? "Capturing…" : "Capture screenshot"}
                </Button>
                {screenshot && (
                  <span className="text-[12px] text-muted-foreground">
                    {screenshot.duration_ms}ms
                  </span>
                )}
              </div>

              {screenshotError && (
                <div className="mt-3 flex items-start gap-2 text-[12.5px] text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <pre className="whitespace-pre-wrap font-mono text-[11.5px]">{screenshotError}</pre>
                </div>
              )}

              {screenshot && (
                <div className="mt-3 space-y-1.5 text-[12px]">
                  <Row k="path" v={screenshot.path} mono />
                  <Row k="size" v={`${screenshot.width}×${screenshot.height} · ${formatBytes(screenshot.size_bytes)}`} />
                </div>
              )}

              {!screenshot && !screenshotError && (
                <p className="mt-3 text-[11.5px] text-muted-foreground">
                  点上面按钮。截屏走 macOS screencapture。
                </p>
              )}
            </div>
          </section>

          {/* === 前台 app 检测 === */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <AppWindow className="h-3.5 w-3.5" strokeWidth={1.75} />
              <h2 className="text-display text-[13.5px] font-medium tracking-tight">前台 app 检测</h2>
              <span className="rounded-full border border-border/60 px-1.5 py-px text-[10px] uppercase tracking-wider text-muted-foreground">
                debug · 不需要权限
              </span>
            </div>
            <div className="rounded-md border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={runFrontmost}
                  disabled={frontmostLoading}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  {frontmostLoading ? (
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <AppWindow className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                  {frontmostLoading ? "Detecting…" : "Detect frontmost app"}
                </Button>
                {frontmost && (
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {frontmost.name} · {frontmost.bundle_id} · pid {frontmost.pid}
                  </span>
                )}
              </div>

              {frontmostError && (
                <div className="mt-3 flex items-start gap-2 text-[12.5px] text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <pre className="whitespace-pre-wrap font-mono text-[11.5px]">{frontmostError}</pre>
                </div>
              )}

              {!frontmost && !frontmostError && (
                <p className="mt-3 text-[11.5px] text-muted-foreground">
                  用 NSWorkspace.frontmostApplication() 拿前台 app 的 PID + name + bundle_id。
                  bubble 触发时用来校验焦点没漂走。不需要任何 macOS 权限。
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-12 shrink-0 text-mono-caps text-[10px] text-muted-foreground/70">{k}</span>
      <span className={mono ? "break-all font-mono text-[11.5px]" : "text-[11.5px]"}>{v}</span>
    </div>
  );
}
