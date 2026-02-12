# 系统权限管理与提权指南 (Admin Promotion Guide)

本文档详细说明了系统的权限体系（RBAC）以及如何处理超级管理员权限问题。

---

## 1. 权限体系说明

系统包含三种用户角色，对应不同的访问权限：

| 角色代码 | 角色名称 | 权限范围 | 适用人群 |
| :--- | :--- | :--- | :--- |
| **`MEMBER`** | 普通员工 | 仅访问买家中心 (`/dashboard`)，不可管理公司设置。 | 买家公司采购员 |
| **`ADMIN`** | 公司管理员 | 管理买家公司设置、子账号，**不可访问平台后台**。 | 买家老板/经理 |
| **`PLATFORM_ADMIN`** | **平台超级管理员** | 访问平台后台 (`/admin`)，拥有上帝视角，管理所有商品、订单和用户。 | **您 (站长)** |

> ⚠️ **安全机制**：前端已启用严格路由守卫，非 `PLATFORM_ADMIN` 访问 `/admin` 会被强制重定向回 `/dashboard`。

---

## 2. 紧急提权操作 (Emergency Promotion)

如果您发现自己无法进入 `/admin` 后台（例如新部署后，或者不小心重置了数据库），请使用以下**万能命令**恢复权限。

### 操作步骤

1.  **登录服务器**：
    ```bash
    ssh root@47.251.97.162
    cd ~/soletrade
    ```

2.  **执行提权命令**：
    直接修改数据库，将指定邮箱提升为超级管理员。
    *(请将 `414635430@qq.com` 替换为您实际的管理员邮箱)*

    ```bash
    docker compose -f docker-compose.prod.yml exec backend npx prisma db execute --stdin <<EOF
    UPDATE "User" SET role = 'PLATFORM_ADMIN' WHERE email = '414635430@qq.com';
    EOF
    ```

3.  **验证结果**：
    如果终端输出 `Count: 1`，说明操作成功。您现在可以刷新网页，进入后台了。

---

## 3. 常见问题 (FAQ)

**Q1: 每次重新部署代码，我的权限会丢失吗？**
*   **A: 不会。** 权限存储在数据库中（`prod.db`），而数据库文件是持久化存储的。只要不删除数据库文件，您的身份永远有效。

**Q2: 为什么有时候新加的脚本找不到？**
*   **A:** Docker 可能会缓存旧的构建层。如果遇到这种情况，请使用强制重建命令：
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build --force-recreate
    ```

**Q3: 我可以有多个超级管理员吗？**
*   **A: 可以。** 对不同的邮箱重复执行上述提权命令即可。
