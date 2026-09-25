#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: $0 <domain> <letsencrypt-email>" >&2
  exit 1
fi
DOMAIN=${1:?Usage: install-host.sh <domain> <letsencrypt-email>}
EMAIL=${2:?Usage: install-host.sh <domain> <letsencrypt-email>}
REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

if ! . /etc/os-release || [[ ${VERSION_ID:-} != "24.04" || ${ID:-} != "ubuntu" ]]; then
  echo "This installer supports Ubuntu 24.04 LTS only." >&2
  exit 1
fi
if [[ ! $DOMAIN =~ ^[A-Za-z0-9.-]+$ || $DOMAIN == *..* ]]; then
  echo "Invalid domain: $DOMAIN" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl nginx certbot python3-certbot-nginx ufw gettext-base
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: %s\nComponents: stable\nArchitectures: %s\nSigned-By: /etc/apt/keyrings/docker.asc\n' \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" "$(dpkg --print-architecture)" \
  > /etc/apt/sources.list.d/docker.sources
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker nginx

install -d -m 0750 /opt/lrt/releases /opt/lrt/shared /var/backups/lrt
sed "s/__LRT_DOMAIN__/$DOMAIN/g" "$REPO_ROOT/deploy/ubuntu/nginx-lrt.conf.template" \
  > /etc/nginx/sites-available/lrt
ln -sfn /etc/nginx/sites-available/lrt /etc/nginx/sites-enabled/lrt
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
certbot --nginx --non-interactive --agree-tos --redirect --email "$EMAIL" -d "$DOMAIN"
echo "Host ready. Upload the release to /opt/lrt/releases and follow docs/uat/deployment-runbook.md."
