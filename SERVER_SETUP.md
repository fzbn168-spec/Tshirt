# 云服务器环境配置指南 (Server Setup Guide)

本文档将指导您从零开始配置一台全新的 Ubuntu 服务器，用于托管 SoleTrade B2B 平台。

## 1. 基础安全设置 (Initial Setup)

登录服务器后，首先进行更新和防火墙配置。

```bash
# 1. 更新系统软件包
sudo apt update && sudo apt upgrade -y

# 2. 安装常用工具
sudo apt install -y curl git vim ufw htop

# 3. 配置防火墙 (UFW)
# 允许 SSH (远程登录), HTTP (80), HTTPS (443)
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 4. 检查状态
sudo ufw status
```

## 2. 安装 Docker 环境

我们使用 Docker 来运行应用，这样可以避免繁琐的环境依赖问题。

```bash
# 1. 一键安装 Docker 官方版本
curl -fsSL https://get.docker.com | sh

# 2. 将当前用户加入 Docker 组 (避免每次都输 sudo)
sudo usermod -aG docker $USER

# 3. 启动 Docker 并设置开机自启
sudo systemctl enable --now docker

# *重要*: 执行完上述命令后，请断开 SSH 连接并重新登录，使权限生效。
```

## 3. 部署应用代码

将您的代码从 GitHub 拉取到服务器。

```bash
# 1. 创建目录并克隆代码
# 请将 <YOUR_REPO_URL> 替换为您的 GitHub 仓库地址
git clone <YOUR_REPO_URL> /opt/soletrade

# 2. 进入目录
cd /opt/soletrade

# 3. 配置环境变量
cp .env.example .env
nano .env
```

**编辑 `.env` 时的注意事项：**
*   `JWT_SECRET`: 务必修改为一个复杂的随机字符串。
*   `NEXT_PUBLIC_API_URL`: 修改为 `https://您的域名/api` (如果您打算使用 Nginx 转发)。如果暂时不用域名，填 `http://服务器IP:3001`。
*   `SMTP_*`: 填入真实的邮件服务配置。

## 4. 启动服务

使用项目自带的脚本一键启动。

```bash
chmod +x deploy.sh
./deploy.sh
```

启动成功后，您应该能通过 `http://服务器IP:3000` 访问网站。

## 5. 配置域名与 HTTPS (Nginx)

为了让用户通过域名访问并显示安全锁标志，我们需要配置 Nginx 反向代理。

### 5.1 安装 Nginx
```bash
sudo apt install -y nginx
```

### 5.2 配置站点
创建配置文件：
```bash
sudo nano /etc/nginx/sites-available/soletrade
```

粘贴以下内容（请将 `your-domain.com` 替换为您的真实域名）：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名

    # 前端代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端 API 代理 (将 /api/* 转发到后端 3001)
    location /api/ {
        # 注意: 这里的 trailing slash (/) 很重要，它会把 /api/ 去掉后再转发
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/soletrade /etc/nginx/sites-enabled/
# 检查配置语法是否正确
sudo nginx -t
# 重启 Nginx
sudo systemctl restart nginx
```

### 5.3 申请 SSL 证书 (HTTPS)
使用 Certbot 免费获取 Let's Encrypt 证书。

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 自动获取证书并配置 Nginx
sudo certbot --nginx -d your-domain.com
```

按照提示输入邮箱并同意协议即可。成功后，您的网站将自动启用 HTTPS。

## 6. 日常运维命令

*   **查看应用日志**:
    ```bash
    cd /opt/soletrade
    docker compose logs -f
    ```
*   **更新代码并重新部署**:
    ```bash
    cd /opt/soletrade
    git pull
    ./deploy.sh
    ```
*   **备份数据库**:
    ```bash
    # 假设使用 SQLite (prod.db)
    cp /opt/soletrade/backend/prisma/prod.db /opt/backups/prod_$(date +%F).db
    ```
