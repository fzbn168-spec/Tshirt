# SoleTrade 标准化部署手册 (SOP)

本文档是项目唯一的部署标准。所有旧的脚本（如 `deploy.sh` 等）已被废弃，请严格按照以下步骤操作。

---

## 🟢 第一步：本地开发与提交 (Local)

在您的本地电脑（VS Code）上完成代码修改后，必须推送到远程仓库。

1. **保存并测试**您的代码修改。
2. **提交变更**到 Git 仓库：

```bash
# 1. 添加所有修改
git add .

# 2. 提交修改（请填写具体的修改内容）
git commit -m "描述您的修改内容"

# 3. 推送到远程仓库
git push
```

---

## 🔵 第二步：服务器更新与部署 (Server)

登录到您的服务器进行部署。

### 1. 登录服务器
```bash
ssh root@47.251.97.162
```

### 2. 进入项目目录
```bash
cd ~/soletrade
```
*(注意：如果提示目录不存在，请尝试 `cd /root/soletrade`)*

### 3. 拉取最新代码
```bash
git pull
```
*   如果提示 `Already up to date.`，说明没有新代码，可以跳过下一步（除非您要重启服务）。
*   如果提示冲突（Conflict），请联系开发人员解决。

### 4. 重建并启动服务 (核心命令)
这是最重要的一步。它会重新构建镜像、 recreate 容器并清理旧的残留。

```bash
docker compose -f docker-compose.prod.yml up -d --build --force-recreate --remove-orphans
```

*   `-f docker-compose.prod.yml`: 指定使用生产环境配置（**绝对不要**使用 `docker-compose.yml`）。
*   `--build`: 确保代码变更被重新打包。
*   `--force-recreate`: 强制重新创建容器，确保配置生效。
*   `--remove-orphans`: 清理未定义的僵尸容器。

---

## 🟡 第三步：验证与排查

### 1. 验证访问
打开浏览器访问：[https://aif1688.com](https://aif1688.com)

### 2. 查看容器状态
如果网站无法访问，请运行：
```bash
docker compose -f docker-compose.prod.yml ps
```
*   **正常状态**: 所有容器（frontend, backend, nginx, certbot）的状态都应为 `Up`。
*   **异常状态**: 如果有 `Exit` 或 `Restarting`，请查看日志。

### 3. 查看日志
查看 Nginx（Web服务器）日志：
```bash
docker compose -f docker-compose.prod.yml logs -f nginx
```

查看后端日志：
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```
*(按 `Ctrl + C` 退出日志查看)*

---

## ⚠️ 重要注意事项

1.  **配置文件**: 生产环境的 Nginx 配置位于 `nginx/conf.d/prod.conf`。它是**唯一真理**。不要修改任何其他 Nginx 配置文件。
2.  **环境变量**: 生产环境的变量在 `.env` 文件中。如果修改了 `.env`，必须执行**第二步中的第4条命令**（重建服务）才能生效。
3.  **禁止操作**: 不要在服务器上直接修改代码。永远坚持 **"本地修改 -> 推送 -> 服务器拉取"** 的流程。
