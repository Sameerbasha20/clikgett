#!/usr/bin/env bash
# One-time host setup for the ClikGett server (Ubuntu 24.04). Safe to run twice.
#   sudo bash setup-host.sh
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# 2 GB swap (npm ci and Docker builds on a 2 GB machine)
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update -q
apt-get -yq -o Dpkg::Options::=--force-confold upgrade
apt-get install -yq docker.io docker-compose-v2 nginx certbot python3-certbot-nginx unattended-upgrades
systemctl enable --now docker nginx unattended-upgrades
usermod -aG docker ubuntu

# Container logs are size-limited in docker-compose.yml; same default for anything else.
if [ ! -f /etc/docker/daemon.json ]; then
  printf '{\n  "log-driver": "json-file",\n  "log-opts": { "max-size": "10m", "max-file": "5" }\n}\n' > /etc/docker/daemon.json
  systemctl restart docker
fi

mkdir -p /opt/clikgett /var/www/admin /var/www/site
chown -R ubuntu:ubuntu /opt/clikgett
timedatectl set-timezone Asia/Kolkata || true
echo OK
