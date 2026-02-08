# 线上部署指南 (Deployment Guide)

本指南将帮助您将 B2B 独立站部署到 Linux 服务器（如 Ubuntu/CentOS）。

## 1. 准备工作

### 服务器要求
*   **操作系统**: Ubuntu 20.04/22.04 LTS (推荐) 或 CentOS 7+
*   **配置**: 至少 2核 CPU / 4GB 内存 (构建过程需要一定内存)
*   **端口**: 确保防火墙开放了 `3000` (前端) 和 `3001` (后端) 端口。

### 安装 Docker
在服务器上运行以下命令安装 Docker 和 Docker Compose：

```bash
# 官方一键安装脚本
curl -fsSL https://get.docker.com | sh

# 启动 Docker 并设置开机自启
sudo systemctl enable --now docker
```

## 2. 上传代码

您可以通过 `git` 或 `scp` 将代码上传到服务器。

**方式 A: 使用 Git (推荐)**
1. 将本地代码推送到 GitHub/GitLab。
2. 在服务器上克隆：
   ```bash
   git clone <your-repo-url> /opt/soletrade
   cd /opt/soletrade
   ```

**方式 B: 直接上传**
使用 SCP 将本地 `d:\网站` 目录上传到服务器：
```bash
# 在本地 PowerShell 执行
scp -r d:\网站 user@your-server-ip:/opt/soletrade
```

## 3. 配置环境

1. 进入项目目录：
   ```bash
   cd /opt/soletrade
   ```

2. 创建生产环境配置文件：
   ```bash
   cp .env.example .env
   ```

3. 编辑 `.env` 文件，填入真实信息：
   ```bash
   nano .env
   ```
   *   **JWT_SECRET**: 生成一个复杂的随机字符串（如 `openssl rand -base64 32`）。
   *   **SMTP_***: 配置您的邮件发送服务（如 AWS SES, SendGrid 或企业邮箱）。

## 4. 执行部署

我们提供了一键部署脚本 `deploy.sh`。

1. 赋予脚本执行权限：
   ```bash
   chmod +x deploy.sh
   ```

2. 运行部署：
   ```bash
   ./deploy.sh
   ```

脚本将自动执行以下操作：
*   停止旧服务
*   构建 Docker 镜像（可能需要几分钟）
*   启动新服务
*   执行数据库迁移

## 5. 验证与维护

*   **查看日志**:
    ```bash
    docker compose logs -f
    ```
*   **查看状态**:
    ```bash
    docker compose ps
    ```
*   **访问网站**:
    打开浏览器访问 `http://<服务器IP>:3000`。

## 6. (进阶) 配置 Nginx 反向代理与 HTTPS

为了安全和域名访问，建议在宿主机安装 Nginx 并配置 SSL。

示例 Nginx 配置 (`/etc/nginx/sites-available/soletrade`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        # 如果前端直接请求 http://localhost:3001，此块可选
        # 但建议前端配置 API_URL 为 /api，通过 Nginx 转发到 3001
        proxy_pass http://localhost:3001/;
    }
}
```
