# 项目规则：构建与校验规范

本文件用于统一本仓库的构建命令、Lint/类型检查规范与交付前校验流程，确保多人协作的一致性与可预期性。

## 前端（frontend）

- 目录：`/frontend`
- 构建（含类型检查）：
  - 在 `frontend` 目录执行：
    - `npm run build`
  - 说明：Next.js 构建阶段会自动运行 TypeScript 类型检查，无需单独执行 `tsc`。
- 启动（生产预览）：
  - `npm start`
- Lint：
  - `npm run lint`
  - 要求：提交前尽量做到 0 error；warning 建议逐步清零（不阻断发布）。
- 关键约定与常见规范：
  - 使用 React Hooks（如 `useEffect`、`useRouter`）的文件必须标记为客户端组件：文件首行添加 `"use client";`。
  - Axios 请求拦截器应使用 `InternalAxiosRequestConfig` 类型，并优先通过 `config.headers.set('Authorization', 'Bearer <token>')` 设置头；若 `set` 不可用，降级为对象合并。
  - 在 `useEffect` 中引用的函数/变量应先声明再使用，避免出现“在声明前使用”的闭包/顺序问题。
  - URL 参数与 `sessionStorage` 同步逻辑需注意执行顺序：更新 URL 的函数（如 `updateQuery`）需先定义，再在 `useEffect` 中调用。
  - 401 鉴权失败时应触发前端登出，并重定向至登录页（已在统一 API 客户端中实现）。

## 后端（backend）

- 目录：`/backend`
- 构建：
  - `npm run build`
- 启动：
  - 开发：`npm run start:dev`
  - 生产：`npm run start:prod`
- Lint：
  - `npm run lint`
- 测试：
  - 单测：`npm test`
  - 覆盖率：`npm run test:cov`
  - E2E：`npm run test:e2e`
- 数据库与脚本：
  - 如变更 Prisma Schema，请同步执行 `npx prisma db push` 或项目定义的 seed 脚本（参见 `prisma/seed.*`）。

## 提交前统一校验流程（建议）

1. 前端（`/frontend`）
   - 运行 Lint：`npm run lint`
   - 运行构建（含 TS 类型检查）：`npm run build`
2. 后端（`/backend`）
   - 运行 Lint：`npm run lint`
   - 运行构建：`npm run build`
   - 运行测试（可选但强烈建议）：`npm test` 或 `npm run test:e2e`
3. 安全基线
   - 不提交 `.env*` 与任何密钥/证书到仓库。
   - Nginx/部署文件仅按 SOP 修改，避免私自新增脚本。

## 功能级最小验收要点（通知模块示例）

- 铃铛下拉：未读置顶、确认态 3 秒自动取消/ESC 取消；右键支持 “新标签打开/复制内容/静音类型”；顶部具备 “Unmute all”。
- 通知页：Shift+点击范围选择，批量已读/未读与撤销；右键菜单包含 “Open only this/Toggle select/Select range from here/Mute 类型”；工具栏显示已静音类型并支持一键清空。
- URL 同步：`muted` 类型通过地址栏参数同步；“Reset/Clear” 会清空静音类型，此行为需在帮助浮层与按钮 title 明示。
- 可访问性：键盘导航（↑/↓/Home/End/Enter/ESC）与 ARIA 标注有效；剪贴板复制在权限受限时提供降级提示。

> 以上规则如需扩展或调整，请在本文件持续更新，保持单一事实来源（SSOT）。

## CI 集成（GitHub Actions 示例）

以下工作流可直接用于本仓库，或复制到其他团队仓库（需保证 package.json 脚本一致）。

文件路径：`.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

## 监控 DSN 接入与字段映射

- 环境变量
  - 前端：`NEXT_PUBLIC_ERROR_DSN`（可空，空则仅走内部埋点 `/analytics/track`）
  - 后端：`BACKEND_ERROR_DSN`（可空，空则仅控制台与容器日志）
- 前端上报字段（JSON）
  - `message`：错误信息
  - `filename`：脚本文件名（若有）
  - `lineno`/`colno`：行/列号（若有）
  - `stack`：堆栈（若有）
  - `url`：当前页面 URL
  - `ua`：User-Agent
  - `ts`：时间戳（毫秒）
- 后端上报字段（JSON）
  - `level`：`fatal` 或 `error`
  - `message`：错误信息
  - `stack`：堆栈（若有）
  - `service`：固定为 `backend`
  - `ts`：时间戳（毫秒）
- 说明
  - DSN 需支持接收上述 JSON `POST`；若接入专业平台（如 Sentry），建议后续替换为官方 SDK 以利用采样与聚合能力。

### 其他仓库同步步骤
- 复制本文件至目标仓库根目录下 `.trae/rules/project_rules.md`，保持规则一致。
- 确认 `frontend`/`backend` 目录结构与脚本名称一致；若不同，请在上方 YAML 中调整 `working-directory` 与脚本命令。
- 将上述 `ci.yml` 放入目标仓库的 `.github/workflows/`。
- 确认目标仓库不包含敏感 `.env*` 文件，必要时配置密钥通过仓库 Secrets 注入。

## 灰度试运营 SOP

- 范围：仅白名单企业参与；关闭公开推广入口的曝光。
- 准入：由平台管理员审批企业（状态置为 APPROVED），必要时分配销售代表。
- 发布：按部署 SOP 执行；版本号记录在系统设置，支持回溯。
- 监控：收集 5xx、p95/p99、登录失败率、支付成功率、邮件退信率；前端 JS 错误与性能指标。
- 回滚：出现阻断性缺陷立刻回滚至上一稳定版本；小修可走补丁分支快速合入。
- 报告：每日灰度日报（见模板），含指标、问题、当日处理与次日计划。

### 7 日灰度日报模板

```
日期：YYYY-MM-DD（第 N/7 天）

一、核心指标
- 后端错误率（5xx）：X%
- API 延迟（p95/p99）：XXXms / XXXms
- 前端错误率（未捕获异常）：X%
- 页面性能（LCP/FID/CLS）：X / X / X
- 业务：下单成功率 X%，支付成功率 X%，线下审批 T+X 完成

二、当日事件
- 重要上线/回滚：
- 重大告警/事故：
- 问题与处理：

三、用户与反馈
- 新增白名单企业（数/总数）：
- 关键用户反馈：

四、待解决事项（含负责人与截止日）
- [P0] 描述（Owner，Due）
- [P1] 描述（Owner，Due）

五、次日计划
- 计划 1
- 计划 2
```
