# Contributing to Percent

感谢对 Percent 感兴趣。

## Setup

需要：macOS + Node ≥ 20 + pnpm + Rust（[Tauri 2 前置](https://v2.tauri.app/start/prerequisites/)）。

```bash
pnpm install
pnpm dev
```

`pnpm dev` 会并行启动 server（3001）、Tauri 客户端、CMS（3000）。  
首次启动会引导你授予 macOS 三类权限：屏幕录制、辅助功能、输入监控。

## Making changes

1. Fork 仓库
2. 创建分支：`git checkout -b feature/your-feature`（或 `fix/your-bug`）
3. 改完跑一下：
   ```bash
   pnpm -r test          # server 端单测
   pnpm -r typecheck     # TS 类型检查
   cd apps/client/src-tauri && cargo fmt && cargo clippy
   ```
4. 推上去，开 PR

## PR 规范

- 标题简洁（≤ 60 字符），用动词开头（"Add …" / "Fix …" / "Refactor …"）
- 描述写清楚：改了什么、为什么、影响范围
- UI 改动附截图或 GIF
- 关联相关 issue（`Fixes #123`）
- 一个 PR 一件事，别打包多个不相关改动

## Issues

- **Bug**：提供复现步骤、期望 vs 实际、系统版本（macOS / 客户端版本）
- **功能建议**：先开 [Discussion](https://github.com/maidangzhu/percentai/discussions) 聊一下，避免做无用功
- **安全问题**：私下联系维护者，不要开 public issue

## Code style

- TypeScript：项目自带的 ESLint / Prettier
- Rust：`cargo fmt` + `cargo clippy`
- 提交信息：参考 git log 现有风格（`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` 等）
- 尽量写测试覆盖新逻辑（server 端有单测基建）

## License

贡献的代码遵循 [MIT](LICENSE)。
