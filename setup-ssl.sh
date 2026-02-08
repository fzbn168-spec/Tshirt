#!/bin/bash

# 检查 Docker 和 Compose
if ! [ -x "$(command -v docker-compose)" ]; then
  if ! [ -x "$(command -v docker)" ]; then
    echo 'Error: docker is not installed.' >&2
    exit 1
  fi
  COMPOSE_CMD="docker compose"
else
  COMPOSE_CMD="docker-compose"
fi

# 加载 .env
if [ -f .env ]; then
  # 简单读取 .env 中的变量
  export $(grep -v '^#' .env | xargs)
fi

domains=$DOMAIN_NAME
rsa_key_size=4096
data_path="./certbot"
email="" 

if [ -z "$domains" ]; then
  echo "DOMAIN_NAME is not set in .env"
  read -p "请输入您的域名 (例如 example.com): " domains
  # 更新 .env
  if grep -q "DOMAIN_NAME=" .env; then
    sed -i "s/DOMAIN_NAME=.*/DOMAIN_NAME=$domains/" .env
  else
    echo "" >> .env
    echo "DOMAIN_NAME=$domains" >> .env
  fi
  export DOMAIN_NAME=$domains
fi

if [ -z "$email" ]; then
  read -p "请输入您的邮箱 (用于 SSL 证书通知): " email
fi

if [ -d "$data_path" ]; then
  read -p "发现已存在的证书数据。是否继续并覆盖？ (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### 下载推荐的 TLS 参数 ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

# 从模板准备 Nginx 配置
echo "### 生成 Nginx 配置文件 ..."
sed "s/\${DOMAIN_NAME}/$domains/g" nginx/conf.d/app.conf.template > nginx/conf.d/app.conf

echo "### 创建临时证书以启动 Nginx ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
$COMPOSE_CMD -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### 启动 Nginx ..."
$COMPOSE_CMD -f docker-compose.prod.yml up --force-recreate -d nginx
echo

echo "### 删除临时证书 ..."
$COMPOSE_CMD -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

echo "### 申请 Let's Encrypt 证书 ..."
# 选择邮箱参数
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="-m $email" ;;
esac

$COMPOSE_CMD -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $email_arg \
    -d $domains \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### 重载 Nginx ..."
$COMPOSE_CMD -f docker-compose.prod.yml exec nginx nginx -s reload

echo "### 部署完成！"
echo "请访问 https://$domains"
