# Roundtable 多 Agent 会议室 - 设计文档

> 存档时间：2026-08-12
> 基于现有 3 人辩论系统 (`lib/debate/`) 演进

## 背景

现有辩论系统是 3 个硬编码 Agent (PM / CTO / VC) 按固定顺序轮流发言。
本设计将其扩展为可配置的多 Agent 会议系统，支持主持人、并行分析、决策者、结构化结论。

## 核心流程

```
User 提出问题
  ↓
Moderator 开场（解析议题 + 介绍参会者）
  ↓
并行分析阶段（Engineer / Designer / PM / Critic 同时发言）
  ↓
讨论阶段（N 轮交叉质询，互相引用/反驳）
  ↓
决策阶段（CEO 综合所有观点 → Go/No-Go）
  ↓
Moderator 汇总（结论 + Action Items + 风险）
  ↓
结构化输出
```

## 与现有 Debate 的关系

采用方案 A：独立新建 `roundtable` 模块，保留现有 `/debate` 不变。
共享 SSE 编码模式和颜色系统。

## 关键设计决策

1. Agent 不再硬编码为 union type，改为 `string` ID + 动态数组
2. 会议模板 (MeetingTemplate) 定义参会者和流程
3. SSE 事件增加 `phase-start` / `phase-end` / `conclusion` 类型
4. 结论使用结构化 JSON (summary + decision + actionItems + risks)
5. 并行分析阶段使用 Promise.all 同时执行多个 Agent

## 文件结构

```
lib/roundtable/
  types.ts        - 核心类型
  agents.ts       - Agent archetype 定义
  templates.ts    - 会议模板预设
  store.ts        - Zustand 状态管理
  DESIGN.md       - 本文档

app/api/roundtable/route.ts  - SSE 流式 API
app/roundtable/
  page.tsx        - 入口页面
  layout.tsx      - 布局

components/roundtable/
  roundtable-shell.tsx       - 主壳
  roundtable-input.tsx       - 输入 + 模板选择
  template-selector.tsx      - 模板卡片
  agent-roster.tsx           - Agent 卡片栏
  phase-indicator.tsx        - 阶段进度条
  roundtable-messages.tsx    - 消息列表
  roundtable-message.tsx     - 单条消息
  conclusion-panel.tsx       - 结构化结论面板
  agent-colors.ts            - 颜色映射
  roundtable-greeting.tsx    - 欢迎页
```
