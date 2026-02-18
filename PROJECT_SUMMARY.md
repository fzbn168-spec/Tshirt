# SoleTrade B2B 外贸独立站项目开发总结文档

## 1. 项目概况 (Project Overview)
本项目是一个面向 B2B 鞋服行业的跨境电商独立站平台，旨在提供完整的产品展示、询盘报价、订单管理及客户关系管理功能。
截止目前，**P0 阶段（核心功能）** 已基本开发完成，包括用户认证、产品管理（多属性/SKU）、询盘系统、订单处理、邮件通知及基础 SEO 优化。

- **开发状态**: 前后端核心模块已完成，通过编译测试。
- **当前版本**: Backend v0.0.1 / Frontend v0.1.0

## 2. 技术栈详情 (Technology Stack)

### 后端 (Backend)
- **框架**: NestJS 11 (Node.js 框架)
- **语言**: TypeScript
- **数据库 ORM**: Prisma 5
- **当前数据库**: SQLite (`dev.db` 文件数据库) - *注：生产环境建议迁移至 PostgreSQL*
- **核心依赖**:
  - `@nestjs/jwt` & `passport`: JWT 身份认证
  - `nodemailer`: 邮件发送 (Outlook SMTP)
  - `pdfkit`: PDF 单据生成 (PI/CI)
  - `class-validator`: DTO 数据验证
  - `swagger`: API 文档

### 前端 (Frontend)
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript / React 19
- **构建工具**: Turbopack
- **样式**: Tailwind CSS v4
- **状态管理**: Zustand
- **数据请求**: TanStack Query (React Query) v5
- **国际化**: next-intl (支持中/英)

## 3. 开发环境与运行命令 (Environment & Execution)

### 开发环境
- **操作系统**: Windows
- **Node.js**: 必需 (建议 v20+)
- **包管理器**: npm

### 运行命令
所有命令建议在 Git Bash 或 PowerShell 中执行。

#### 后端 (d:\网站\backend)
1. **安装依赖**: `npm install`
2. **数据库迁移**: `npx prisma migrate dev` (同步数据库结构)
3. **启动开发服务器**: `npm run start:dev` (监听 3001 端口)
4. **构建生产版本**: `npm run build`
5. **启动生产版本**: `npm run start:prod` (需先构建)

#### 前端 (d:\网站\frontend)
1. **安装依赖**: `npm install`
2. **启动开发服务器**: `npm run dev` (监听 3000 端口)
3. **构建生产版本**: `npm run build`
4. **启动生产版本**: `npm run start` (需先构建)

## 4. 未开发/待完善模块 (Undeveloped/Pending Modules)

尽管核心功能已完成，以下模块目前处于模拟或基础状态，后续需根据业务需求进一步开发：

1. **支付网关 (Real Payment Gateway)**:
   - **[已完成]** Stripe 前端组件对接 (Elements, PaymentIntent)。
   - **[已完成]** Stripe 后端 Webhook 处理逻辑 (payment_intent.succeeded)。
   - **[已完成]** 订单状态自动更新 (Webhook -> Order Paid)。
   - 需完善: 真实 API Key 配置测试。
2. **物流对接 (Shipping Integration)**:
   - 当前状态: 手动输入物流单号。
   - 需开发: 对接 UPS/FedEx/DHL API 获取实时运费和追踪信息。
3. **高级数据分析 (Advanced Analytics)**:
   - **[已完成]** 基础漏斗分析 (Product View -> Add to Cart -> Checkout -> Purchase)。
   - **[已完成]** 管理后台分析看板 (Dashboard Analytics Page)。
   - 需完善: 用户画像细分、来源渠道追踪、自定义报表导出。
4. **第三方登录 (Social Login)**:
   - **[已完成]** Google/Facebook OAuth 策略与接口对接。
   - **[已完成]** 前端登录按钮与回调处理。
   - 需完善: 真实 App ID/Secret 配置测试 (目前为占位符)。

## 5. Bugs 修复与代码清理 (Bug Fixes & Cleanup)

在本次审查中，发现并修复了以下关键问题（已清理完毕）：

1.  **Backend - SKU 更新逻辑缺陷 (高风险)**
    - *问题*: 原逻辑在更新产品时会暴力删除所有 SKU 再重建，导致历史订单关联丢失风险。
    - *修复*: 实现了 **Diffing Strategy (差异对比策略)**。现在系统会智能识别：
        - ID 匹配的 SKU -> 执行 Update
        - 新增的 SKU -> 执行 Create
        - 消失的 SKU -> 执行 Delete (并检查约束)
2.  **Backend - 路由冲突**
    - *问题*: `ProductsController` 中 `addSku` 和 `update` 方法使用了相同的 `@Patch(':id')` 路径，导致请求被错误拦截。
    - *修复*: 将 `addSku` 路径修改为明确的 `@Post(':id/skus')`。
3.  **Frontend - Twitter Cards 元数据缺失**
    - *问题*: SEO 模块中缺少 Twitter 分享卡片配置。
    - *修复*: 完善了 `generateMetadata` 函数，添加了完整的 `twitter` 对象配置。
4.  **Frontend - 语法错误**
    - *问题*: 在添加元数据时引入了 JSON 结构错误。
    - *修复*: 重写了 `page.tsx` 的元数据生成逻辑，并通过了编译测试。

## 6. 前后端逻辑分析 (Logic Analysis)

经审查，本项目前后端职责划分清晰，未发现明显的逻辑重叠或错位：

- **后端 (Backend)**: 负责所有**业务逻辑**、**数据持久化**和**原子性操作**。
    - *例*: 库存扣减使用 Prisma `$transaction` 确保原子性，不会因并发导致超卖。
    - *例*: 价格计算（阶梯价）在后端完成，前端仅作展示，防止篡改。
- **前端 (Frontend)**: 负责**UI 渲染**、**交互体验**和**SEO**。
    - *例*: 动态生成 `sitemap.xml` 和 `JSON-LD` 结构化数据，利用 Next.js 服务端渲染优势。
    - *例*: 表单验证（Zod）在前端做第一道防线，提升用户体验，但后端仍保留 DTO 验证作为安全底线。

## 7. 开发总结与经验 (Development Summary)

### 经验教训
1.  **原子性至关重要**: 在电商系统中，涉及资金和库存的操作必须使用数据库事务（Transaction）。早期的简单 CRUD 在高并发下是不可靠的。
2.  **类型安全**: 前后端统一使用 TypeScript 极大减少了“低级错误”。后端 DTO 与前端接口类型应保持同步（未来可考虑 tRPC 或 OpenAPI 生成工具）。
3.  **SEO 前置**: SEO 不应是开发完成后的“补丁”，而应在架构设计时就考虑（如 SSR、Metadata API、语义化标签）。
4.  **环境变量管理**: 敏感信息（SMTP 密码、API Key）严禁硬编码。使用 `.env` 并配合 `ConfigService` 是最佳实践。

## 8. 提示词归纳汇总 (Prompt Collection)

为了便于后续开发类似项目，以下是经过验证的高效提示词（Prompts）：

### 1. 创建 CRUD 模块
> "Create a NestJS module for [Resource Name] with Prisma. Include Service, Controller, DTOs (Create/Update), and Module file. Ensure DTOs use class-validator. Implement basic CRUD operations."

### 2. 添加关联关系
> "Update the Prisma schema: [Model A] has a one-to-many relation with [Model B]. Generate the migration, and update the [Model A] Service to include [Model B] data in `findUnique` using `include`."

### 3. 实现复杂逻辑 (事务)
> "Implement a method in [Service Name] to [Action, e.g., Place Order]. This requires updating [Table A] and creating records in [Table B]. Use `prisma.$transaction` to ensure all operations succeed or fail together. Handle potential errors like 'Out of Stock'."

### 4. 前端组件开发
> "Create a React component using Tailwind CSS for [Feature, e.g., Product Card]. It should accept [Props] and display [Data]. Use `next/image` for images and `next-intl` for labels. Ensure it is responsive (mobile-first)."

### 5. SEO 优化
> "Update the [Page Name] page in Next.js to use `generateMetadata`. Fetch dynamic data to populate Title, Description, OpenGraph, and Twitter Card tags. Also inject JSON-LD structured data for [Schema Type]."

---
*文档生成时间: 2026-02-13*
