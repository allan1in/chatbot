# Chatbot

一个基于 Next.js + AI SDK + OpenRouter 的简易聊天机器人项目。

## 功能

- 基础聊天界面（用户消息 / AI 消息）
- 流式返回模型输出
- 主题切换（深色/浅色）
- 基于 App Router 的 API 路由

## 技术栈

- Next.js 16
- React 19
- TypeScript
- AI SDK（`ai` / `@ai-sdk/react`）
- OpenRouter Provider（`@openrouter/ai-sdk-provider`）
- Tailwind CSS 4 + shadcn/ui

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 配置环境变量（在项目根目录创建 `.env`）

```env
OPENROUTER_API_KEY=你的_openrouter_api_key
```

3. 启动开发环境

```bash
pnpm dev
```

4. 打开浏览器访问

```text
http://localhost:3000
```

## 可用命令

```bash
pnpm dev    # 启动开发服务
pnpm build  # 构建生产版本
pnpm start  # 启动生产服务
pnpm lint   # 运行 ESLint
```

## 目录结构（简要）

```text
app/
	(chat)/
		page.tsx              # 聊天页面
		api/chat/route.ts     # 聊天 API（调用 OpenRouter）
components/               # UI 组件
lib/                      # 工具函数
```

## 说明

- 当前模型在 `app/(chat)/api/chat/route.ts` 中配置为：
	`bytedance-seed/seed-1.6-flash`
- 可按需替换为你在 OpenRouter 可用的其他模型。
