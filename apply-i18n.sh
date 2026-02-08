#!/bin/bash
echo "正在重新构建前端以应用国际化更改..."
docker compose -f docker-compose.prod.yml up -d --build frontend
echo "前端重建完成！请刷新浏览器查看效果。"
