# 🚀 SoleTrade 上线部署指南 (Ubuntu)

本指南将帮助您在全新的 Ubuntu 服务器上部署 SoleTrade 外贸平台。

## 1. 准备工作
*   一台 Ubuntu 20.04/22.04 服务器
*   服务器公网 IP 地址
*   一个域名 (已解析到服务器 IP)

## 2. 登录服务器
使用 SSH 登录您的服务器：
```bash
ssh root@<您的服务器IP>
```

## 3. 初始化环境
我们为您准备了一键安装脚本，自动安装 Docker、Git 并配置防火墙。

复制以下命令并在服务器上执行：
```bash
curl -O https://raw.githubusercontent.com/fzbn168-spec/Tshirt/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

## 4. 拉取代码
```bash
cd /opt
git clone https://github.com/fzbn168-spec/Tshirt.git soletrade
cd soletrade
```

## 5. 配置生产环境
运行配置向导，输入您的 Stripe 密钥：
```bash
./scripts/setup-production-env.sh
```

## 6. 启动服务
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
等待几分钟，直到容器全部启动。

## 7. 配置自动备份
```bash
./scripts/install-cron-job.sh
```

## 8. 验证
打开浏览器访问您的域名。如果看到登录页面，恭喜您，**上线成功！** 🎉
