# AGENTS.md

## 项目概述

Next.js 16 App Router 聊天机器人，基于 AI SDK + DeepSeek API + Drizzle ORM (Neon Postgres) + next-auth v5。

## 常用命令

```bash
pnpm dev          # next dev --turbo（Turbopack 模式）
pnpm build        # 先跑 DB 迁移再构建：tsx lib/db/migrate && next build
pnpm check        # ultracite check（Biome lint）
pnpm fix          # ultracite fix（Biome 自动修复）
pnpm test         # Playwright E2E 测试（自动设置 PLAYWRIGHT=True）
pnpm db:generate  # drizzle-kit generate 生成迁移文件
pnpm db:migrate   # tsx lib/db/migrate.ts 执行迁移
pnpm db:studio    # drizzle-kit studio 可视化
```

**重要**：`pnpm build` 会先执行数据库迁移，确保 `POSTGRES_URL` 可用。

## 代码检查

使用 **Biome**（via ultracite），**不是** ESLint 或 Prettier。

以下目录已排除 lint，**不要修改其中的代码风格**：
- `components/ai-elements`、`components/elements`、`components/ui`
- `lib/utils.ts`、`hooks/use-mobile.ts`

pre-commit hook 会对所有暂存文件运行 `pnpm fix`。

## 架构

```
app/
├── (auth)/           # 认证路由组：login、register、guest 登录、nextauth API
│   ├── auth.ts       # next-auth 主配置（credentials + guest 两个 provider）
│   └── auth.config.ts
├── (chat)/           # 主聊天路由组：sidebar + DataStreamProvider
│   ├── chat/[id]/    # 单个聊天页面
│   └── api/chat/     # 聊天 API（POST 流式、DELETE、resumable stream）
├── debate/           # 多智能体辩论功能
├── detective/        # 侦探推理游戏
├── roundtable/       # 多智能体圆桌会议
├── api/              # 各功能 API（debate、detective、roundtable）
└── layout.tsx        # 根布局（ThemeProvider、SessionProvider、I18nProvider）

lib/
├── ai/               # AI 核心：providers、models、tools、prompts、embeddings、memory
├── db/               # Drizzle ORM：schema、queries、migrations
├── i18n/             # 自定义客户端 i18n（中文默认，zh/en JSON 词典）
├── debate/           # 辩论 agents 与 store
├── detective/        # 侦探游戏逻辑
└── roundtable/       # 圆桌会议逻辑
```

### Middleware 拆分

`middleware.ts` 是入口，委托给 `proxy.ts` 的 `proxy()` 函数。`proxy.ts` 包含所有路由匹配和认证逻辑，以及 `config`（matcher 定义）。

**不要**把逻辑写在 `middleware.ts` 里，保持委托模式。

## 认证

- **next-auth v5 beta**，两个 credentials provider：常规邮箱密码 + Guest 自动登录
- Guest 用户邮箱格式：`guest-{timestamp}`，正则匹配：`/^guest-\d+$/`
- 未认证请求被 `proxy.ts` 重定向到 `/api/auth/guest?redirectUrl=...`
- Guest 用户每小时限 10 条消息（`lib/ai/entitlements.ts`）

## AI 提供商

- **生产环境**：DeepSeek 直连 API（`https://api.deepseek.com/v1`），需 `DEEPSEEK_API_KEY`
- 默认模型：`deepseek-v4-flash`（对话 + 标题生成共用）
- **测试/Guest 环境**：使用 mock 模型（`lib/ai/models.mock.ts`、`lib/ai/models.guest.ts`），当 `PLAYWRIGHT` / `CI_PLAYWRIGHT` 环境变量存在时自动激活
- Embedding：OpenAI `text-embedding-3-small`（1536 维），需 `OPENAI_API_KEY`；无此 key 时 embedding 功能静默禁用

## 数据库

- **Drizzle ORM + Neon Serverless Postgres**
- Schema 在 `lib/db/schema.ts`，包含 pgvector 嵌入列（Memory 表）
- `drizzle.config.ts` 和 `lib/db/migrate.ts` **显式从 `.env.local` 加载**环境变量，不是自动加载
- 迁移文件输出到 `lib/db/migrations/`

## 测试

- **仅 Playwright E2E**，无单元测试
- 测试文件在 `tests/e2e/`，Page Object 在 `tests/pages/`
- 运行 `pnpm test` 会设置 `PLAYWRIGHT=True`，这会激活 mock AI 模型
- 测试前确保 `.env.local` 已配置（playwright.config.ts 从 `.env.local` 加载）

## 环境变量

| 变量 | 用途 | 必需 |
|------|------|------|
| `AUTH_SECRET` | next-auth JWT 签名 | 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 |
| `POSTGRES_URL` | Neon Postgres 连接串 | 是 |
| `REDIS_URL` | 可恢复流 + 限流 | 生产必需 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 文件上传 | 是 |
| `OPENAI_API_KEY` | Embedding 向量化 | 可选（无则禁用 memory） |
| `IS_DEMO` | 设为 `1` 启用 demo 模式（basePath=/demo） | 否 |

## 注意事项

- **React Compiler 已开启**（`reactCompiler: true`），调试时注意编译器优化可能影响断点和变量观察
- **Turbopack 开发模式**：`pnpm dev` 使用 `--turbo`，某些 Webpack 插件可能不生效
- **可恢复流**：生产环境通过 Redis 实现流断点续传（`resumable-stream`）
- **i18n 是自定义实现**：客户端 localStorage 存储，非 next-intl 等库
- **BotID 防护**：`/api/chat` POST 端点集成了 botid 反爬
