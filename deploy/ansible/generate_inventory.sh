#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DEPLOY_HOSTS:-}" ]; then
  echo "DEPLOY_HOSTS is not set. Provide a comma-separated list of hosts via secret DEPLOY_HOSTS." >&2
  exit 1
fi

DEPLOY_USER=${DEPLOY_USER:-deployer}
DEPLOY_PATH=${DEPLOY_PATH:-/srv/soletrade}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.yml}
REGISTRY=${REGISTRY:-ghcr.io}
IMAGE_NAMESPACE=${IMAGE_NAMESPACE:-myorg}
NGINX_HOSTS=${DEPLOY_NGINX_HOSTS:-}

OUTFILE="$(dirname "$0")/inventory.yml"
echo "# Generated inventory (do not commit)" > "$OUTFILE"
echo "[web]" >> "$OUTFILE"

# Validation helpers
is_ipv4() {
  local ip=$1
  if [[ $ip =~ ^((25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])$ ]]; then
    return 0
  fi
  return 1
}

is_hostname() {
  local host=$1
  # basic hostname validation: letters, digits, hyphen, dot; no leading/trailing hyphen or dot
  if [[ ${#host} -gt 253 ]]; then
    return 1
  fi
  if [[ $host =~ ^[A-Za-z0-9]([A-Za-z0-9-\.]{0,251}[A-Za-z0-9])?$ ]]; then
    return 0
  fi
  return 1
}

validate_host() {
  local h=$1
  if is_ipv4 "$h" || is_hostname "$h"; then
    return 0
  fi
  return 1
}

IFS=',' read -ra HOSTS <<< "$DEPLOY_HOSTS"
for h in "${HOSTS[@]}"; do
  host_trimmed=$(echo "$h" | tr -d '[:space:]')
  if [ -z "$host_trimmed" ]; then
    echo "Empty host entry found in DEPLOY_HOSTS" >&2
    exit 1
  fi
  if ! validate_host "$host_trimmed"; then
    echo "Invalid host format: '$host_trimmed'. Provide IPv4 addresses or valid hostnames." >&2
    exit 1
  fi
  echo "$host_trimmed ansible_host=$host_trimmed ansible_user=$DEPLOY_USER ansible_ssh_private_key_file=/tmp/deploy_key deploy_path=$DEPLOY_PATH compose_file=$COMPOSE_FILE registry=$REGISTRY image_namespace=$IMAGE_NAMESPACE" >> "$OUTFILE"
done

if [ -n "$NGINX_HOSTS" ]; then
  echo "" >> "$OUTFILE"
  echo "[nginx]" >> "$OUTFILE"
  IFS=',' read -ra NHOSTS <<< "$NGINX_HOSTS"
  for nh in "${NHOSTS[@]}"; do
    nh_trimmed=$(echo "$nh" | tr -d '[:space:]')
    if [ -z "$nh_trimmed" ]; then
      echo "Empty host entry found in DEPLOY_NGINX_HOSTS" >&2
      exit 1
    fi
    if ! validate_host "$nh_trimmed"; then
      echo "Invalid nginx host format: '$nh_trimmed'" >&2
      exit 1
    fi
    echo "$nh_trimmed ansible_host=$nh_trimmed ansible_user=$DEPLOY_USER ansible_ssh_private_key_file=/tmp/deploy_key deploy_path=$DEPLOY_PATH" >> "$OUTFILE"
  done
fi

echo "Wrote inventory to $OUTFILE"
