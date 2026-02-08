# 项目初始化指南 (Project Initialization Guide)

本指南将帮助你从零开始搭建基于 **Next.js + NestJS** 的 B2B 外贸独立站项目。

## 1. 目录结构规划
我们将建立以下目录结构：
```
/d/网站/
  ├── frontend/   # Next.js (React) 前端项目
  └── backend/    # NestJS (Node.js) 后端项目
```

## 2. 初始化命令 (Command Line Steps)

请在终端中依次执行以下命令。

### 第一步：初始化前端 (Frontend)
使用 `create-next-app` 创建 Next.js 项目。

```bash
# 1. 创建 frontend 项目 (自动配置 TypeScript, Tailwind, ESLint, App Router)
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git

# 2. 进入目录
cd frontend

# 3. 安装关键依赖 (Shadcn/UI 核心, React Query, Zustand, Axios, Lucide)
npm install lucide-react clsx tailwind-merge @tanstack/react-query zustand axios next-intl

# 4. 初始化 Shadcn/UI (可选，稍后配置)
# npx shadcn-ui@latest init
```

### 第二步：初始化后端 (Backend)
使用 NestJS CLI 创建后端项目。

```bash
# 回到根目录
cd ..

# 1. 创建 backend 项目 (使用 npm)
npx @nestjs/cli new backend --package-manager npm --skip-git

# 2. 进入目录
cd backend

# 3. 安装关键依赖 (Prisma, Validation, Config)
npm install @prisma/client class-validator class-transformer @nestjs/config
npm install prisma --save-dev

# 4. 初始化 Prisma
npx prisma init
```

## 3. "Hello World" 联调配置

### 前端配置
编辑 `frontend/src/app/page.tsx`，调用后端接口：

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:3001/')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => setMessage('Error connecting to backend'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">B2B Storefront</h1>
      <div className="mt-4 p-4 border rounded bg-gray-100">
        <p>Backend Status: <span className="font-mono text-blue-600">{message}</span></p>
      </div>
    </main>
  );
}
```

### 后端配置
确保 `backend/src/main.ts` 允许跨域 (CORS) 并监听 3001 端口 (避免与 Next.js 的 3000 冲突)：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS 以允许前端访问
  app.enableCors();
  
  // 修改端口为 3001
  await app.listen(3001);
}
bootstrap();
```

## 4. 启动项目

建议打开两个终端窗口分别运行：

**终端 1 (Frontend):**
```bash
cd frontend
npm run dev
# 访问 http://localhost:3000
```

**终端 2 (Backend):**
```bash
cd backend
npm run start:dev
# API 运行在 http://localhost:3001
```
