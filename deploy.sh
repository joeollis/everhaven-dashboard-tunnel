#!/usr/bin/env bash
# One-shot bootstrap for a fresh Ubuntu droplet.
# Installs Docker, pulls this repo, and starts the PRIVATE dashboard.
# Run as root:   curl -fsSL <raw deploy.sh url> | bash
set -euo pipefail

REPO="https://github.com/joeollis/everhaven-dashboard-tunnel.git"
DIR="/opt/everhaven-tunnel"

echo "==> Installing prerequisites (git, docker)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git >/dev/null
command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | sh

echo "==> Fetching deployment files…"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone -q "$REPO" "$DIR"; fi
cd "$DIR"

echo "==> Preparing connector state dir (owned by the sidecar's UID 65532)…"
mkdir -p agent-state secret
chown -R 65532:65532 agent-state
chmod 700 agent-state

echo "==> Starting the private dashboard (no public ports)…"
docker compose up -d web

cat <<EOF

==================================================================
 ✅ Private dashboard is running — reachable only inside Docker.

 NEXT (one-time, ~2 min):

 1) Mint the connector's bootstrap key. Either:
      • LayerV Slack:
          /qurl-admin protect-connector everhaven-dashboard \\
             env:docker-compose port:8080 service:web
      • or your web console: layerv.ai/qurl/dashboard
    (Use the SAME environment — sandbox — as the rest of the demo.)

 2) Save the key on the droplet:
      printf '%s' 'PASTE_BOOTSTRAP_KEY_HERE' > $DIR/secret/api_key

 3) Start the connector:
      cd $DIR && docker compose up -d

 4) Watch it connect (Ctrl-C when you see a successful connection):
      docker compose logs -f qurl-connector

 5) Key is one-time; remove it once connected:
      rm -f $DIR/secret/api_key

 Then tell Claude "connector is live" and it finishes the wiring.
==================================================================
EOF
