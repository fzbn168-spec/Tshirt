# 生产发布检查表与回滚 SOP

本文档提供可复制的发布前检查、迁移与回滚步骤，适用于本仓库的 `backend`（Prisma / Postgres）部署。

**发布前检查**
- **备份数据库**: 在生产执行迁移前务必备份数据库（示例）：
  ```bash
  pg_dump -h <host> -p <port> -U <user> -Fc -f backup-pre-migrate-$(date +%F).dump <dbname>
  ```
- **Secrets 完整性**: 确认 GitHub Secrets / 环境中已配置：`DATABASE_URL`, `JWT_SECRET`, `STRIPE_*`, `SMTP_*`。
- **变更审查**: 确认 `prisma/migrations` 已在分支中并通过代码审查；避免直接在生产生成迁移。
- **CI 状态**: 确保主分支 CI（lint/test/build）通过。

**在 Staging 验证（强烈推荐）**
- 在 staging 环境运行 `prisma migrate deploy`，并执行 `prisma db seed`（如需要），验证业务关键路径（下单、登录、上传等）。

**生成迁移（开发/测试）**
1. 在本地或 feature 分支执行：
   ```bash
   cd backend
   export DATABASE_URL='postgresql://admin:securepassword@localhost:5432/soletrade?schema=public'
   npm ci
   npx prisma migrate dev --name <describe_change>
   ```
2. 提交并创建 PR，包含 `prisma/migrations` 目录。

**在生产应用迁移（CI / 手动）**
- 建议通过 CI 执行（仓库已添加工作流 `.github/workflows/prisma-deploy.yml`）。CI 步骤为：`npm ci` → `npx prisma generate` → `npx prisma migrate deploy` → `npx prisma db seed`（由 `secrets.DATABASE_URL` 驱动）。
- 若手动运行：
  ```bash
  cd /path/to/repo/backend
  export DATABASE_URL='postgresql://<user>:<pass>@<host>:5432/<db>?schema=public'
  npm ci --production
  npx prisma generate
  npx prisma migrate deploy
  # 根据需要运行 seed（慎用）
  npx prisma db seed
  ```

**发布后验证清单（快速）**
- 检查服务健康：容器/服务是否正常启动，API 返回 200。  
- 验证关键交易：登录、查询产品、创建询价/订单、文件上传。  
- 检查日志是否有异常错误（500、数据库错误、迁移错误）。

**回滚 SOP（优先使用备份恢复）**
1. 如果迁移导致严重问题，优先用发布前备份进行恢复：
   ```bash
   pg_restore -h <host> -p <port> -U <user> -d <dbname> -c backup-pre-migrate-YYYY-MM-DD.dump
   ```
2. 若无法使用备份且需要回退 schema 变更：
   - 非破坏性变更：可以通过新增迁移恢复旧结构（手动写反向 SQL）。
   - 破坏性变更（删除列/表）：通常需要备份恢复；谨慎执行手写回滚。
3. 回滚后，回顾原因并在分支上修复 schema/seed，再在 staging 验证后重新发布。

**Seed 注意事项**
- 本仓库的 seed 已调整以兼容 Postgres（`Decimal` 字段以字符串形式传入）。
- 在生产仅运行必要且幂等的 seed，避免创建测试数据。CI 的 `prisma db seed` 可视为按需执行。

**运营与监控建议（长期）**
- 定期自动备份（每日/每周），并定期演练恢复流程。  
- 集中日志与监控（Prometheus/Grafana, ELK/Loki, Sentry）。  
- 使用 secret 管理系统（Vault / cloud secrets / GitHub Secrets）。

若需，我可以把这份文档合并到根 README 或 `backend/README.md`，并为回滚创建快速脚本。  
