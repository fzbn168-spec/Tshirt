#!/usr/bin/env bash
set -euo pipefail
url=${1:-http://127.0.0.1:3001/health}

echo "Checking health at $url"
status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
if [ "$status" != "200" ]; then
  echo "Health check failed (HTTP $status)"
  exit 2
fi

echo "Health OK"
exit 0
