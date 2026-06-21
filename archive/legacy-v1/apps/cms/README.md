# Percent CMS

Next.js 15 admin dashboard for Percent Tracker.

> **CMS 只读 Neon（账号 + 积分 + 流水）。不读本地 SQLite，不看用户聊天 / 任务 / agent 对话内容。**

## 功能
- **Dashboard** — 平台总览：用户数、积分余额、累计消费、Top 5 消费者、近 14 天消费
- **Users** — 用户列表（含积分余额），详情页可分配 / 扣减点数
- **Transactions** — credit 流水全量日志，可按 user / reason 筛选

## 启动

```bash
# 1. 安装依赖（pnpm workspace 会自动 link）
pnpm install

# 2. 准备 .env
cp .env.example .env
# 修改 CMS_ADMIN_PASSWORD

# 3. 生成 prisma client
pnpm prisma:generate

# 4. 跑 dev
pnpm dev
# → http://localhost:3001
```

## 数据库

只连一个库：

| Schema | DB | 用途 |
|---|---|---|
| `prisma/auth.prisma` | PostgreSQL (Neon) | Users / Sessions / UserCredit / CreditTransaction |

## 认证

- 单一管理员账号，密码从 `CMS_ADMIN_PASSWORD` 读
- 登录后写一个 HMAC 签名的 cookie
- 任何页面访问前由 `requireAdmin()` 校验

## 文件组织

```
src/
├── app/
│   ├── login/page.tsx               # 登录
│   ├── (admin)/                     # 受保护路由组
│   │   ├── layout.tsx               # 侧边栏 + 守卫
│   │   ├── nav.tsx
│   │   ├── page.tsx                 # Dashboard
│   │   ├── users/page.tsx           # 用户列表
│   │   ├── users/[id]/page.tsx      # 用户详情 + 分配点表单
│   │   └── transactions/page.tsx    # 流水日志
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── auth.ts                      # 管理员 cookie 认证
│   ├── db.ts                        # Neon Prisma client
│   └── creditActions.ts             # CMS 本地的 credit 业务逻辑
├── generated/
│   └── auth/                        # prisma generate auth.prisma
└── prisma/
    └── auth.prisma
```

## 注意事项

- `creditActions.ts` 与 `apps/server/src/lib/credits.ts` 是双份维护，逻辑要同步
- 管理员密码从环境变量读；本地开发默认 `admin`
- cookie 用 HMAC-SHA256 签名（不是 JWT），`CMS_COOKIE_SECRET` 建议生产环境改成强随机串
- `PERCENT_DATABASE_PATH` 环境变量已不再需要（CMS 不再读本地 SQLite）
