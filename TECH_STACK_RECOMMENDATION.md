# B2B 外贸独立站技术栈推荐方案

## 1. 核心技术栈 (Core Stack)

### 前端 (Frontend / Storefront)
**选择：Next.js (App Router) + Tailwind CSS + Shadcn/UI**

*   **理由**：
    *   **SEO 决定生死**：B2B 流量主要靠谷歌搜索。Next.js 的服务端渲染 (SSR) 和静态生成 (SSG) 对 SEO 最友好，Google 收录速度快。
    *   **高性能**：自带图片优化 (`next/image`) 和字体优化，对展示大量鞋服图片至关重要。
    *   **生态统一**：使用 React 生态，组件库丰富，维护成本低。Shadcn/UI 提供高度可定制的无头组件，避免“千篇一律”的 Bootstrap 风格，容易打造高端品牌感。

### 后端 (Backend API)
**选择：NestJS (Node.js)**

*   **理由**：
    *   **企业级架构**：NestJS 采用模块化设计（类似 Angular/Spring），强制规范代码结构，适合 B2B 这种业务逻辑复杂（询价、阶梯价、权限）的系统，长期维护不乱。
    *   **语言统一**：前后端全链路 TypeScript。DTO（数据传输对象）可以复用，后端改了字段，前端编译直接报错，极大减少 Bug。
    *   **高性能**：基于 Node.js 事件驱动，处理高并发 I/O（如大量并发询盘）效率高。

### 数据库 (Database)
**选择：PostgreSQL + Prisma ORM**

*   **理由**：
    *   **JSONB 神器**：鞋服行业的 SKU 属性极度非标准化（如：鞋子有“鞋跟高度”，衣服有“领型”）。Postgres 的 JSONB 字段既能像 MongoDB 一样灵活存属性，又能像 MySQL 一样做强事务关联（订单、资金），是 B2B 电商的最佳平衡点。
    *   **开发体验**：Prisma 提供了极佳的 TypeScript 类型提示，数据库操作就像写原生对象一样简单安全。

### 部署与运维 (Deployment)
**选择：Vercel (前端) + Docker/Railway (后端) + Supabase/AWS RDS (数据库)**

*   **理由**：
    *   **全球加速**：Vercel 自带全球 Edge Network，保证海外客户访问速度（不用自己配置复杂的 CDN）。
    *   **CI/CD**：代码提交到 GitHub 自动触发部署，无需专职运维。

---

## 2. 关键 NPM 依赖包 (Top 5+ Dependencies)

| 包名 | 类型 | 作用 | 推荐理由 |
| :--- | :--- | :--- | :--- |
| **`next-intl`** | i18n | 国际化 | **B2B 核心**。支持路由级多语言（/en, /es），且完美兼容 Next.js 的服务端渲染，SEO 友好。 |
| **`zod`** | Utils | 数据验证 | **全栈复用**。定义一套 Schema（如：注册表单验证），前后端通用。后端校验 API 参数，前端生成错误提示。 |
| **`zustand`** | State | 状态管理 | **轻量级**。比 Redux 简单太多。用于管理“询价车”、“用户登录态”等全局数据，代码量极少。 |
| **`tanstack/react-query`** | Fetch | 数据请求 | **缓存管理**。自动处理 API 数据缓存、去重、后台更新。用户点“后退”无需重新加载列表，体验极佳。 |
| **`lucide-react`** | UI | 图标库 | **现代化**。轻量、风格统一的 SVG 图标库，比 FontAwesome 更现代，加载更快。 |
| **`xlsx`** | Utils | Excel处理 | **业务刚需**。前端直接解析客户上传的 Excel 询价单，或导出报价单，无需传到后台处理。 |

---

## 3. 架构图示 (Simplified Architecture)

```mermaid
graph TD
    User[全球买家] --> CDN[Vercel Edge Network]
    CDN --> Next[Next.js 前端 (SSR)]
    
    subgraph Backend Services
        Next -- API Call --> Nest[NestJS 后端 API]
        Nest --> DB[(PostgreSQL)]
        Nest --> Redis[Redis 缓存/队列]
    end
    
    subgraph 3rd Party
        Nest -- SMTP --> Email[邮件服务 (SendGrid)]
        Nest -- S3 --> Storage[图片存储 (AWS S3/R2)]
    end
```
