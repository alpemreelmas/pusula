#!/bin/bash
# One-time server setup for pusula.
# Run on server: bash /opt/pusula/.kaptan/setup.sh
# OR remotely:   ssh root@138.199.193.143 "bash -s" < .kaptan/setup.sh
set -euo pipefail

# ── FILL THESE IN ────────────────────────────────────────────────────────────
PAT_TOKEN=""          # GitHub Personal Access Token (repo scope)
REPO_ORG=""           # e.g. "flalingo-org"
REPO_NAME="pusula"
# ─────────────────────────────────────────────────────────────────────────────

if [ -z "$PAT_TOKEN" ] || [ -z "$REPO_ORG" ]; then
  echo "ERROR: Set PAT_TOKEN and REPO_ORG at the top of this script first."
  exit 1
fi

APP_DIR="/opt/pusula"

echo "[1/5] Clone repo..."
mkdir -p "$APP_DIR"
git clone "https://${PAT_TOKEN}@github.com/${REPO_ORG}/${REPO_NAME}.git" "$APP_DIR" || \
  git -C "$APP_DIR" pull origin main

echo "[2/5] npm install..."
npm ci --prefix "$APP_DIR"

echo "[3/5] build..."
npm run build --prefix "$APP_DIR"

echo "[4/5] .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "  → Fill in $APP_DIR/.env with APP_ID, PRIVATE_KEY, WEBHOOK_SECRET"
fi

echo "[5/5] firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
ufw --force enable
ufw reload

echo "Setup complete. Edit $APP_DIR/.env then run: pm2 start $APP_DIR/dist/index.js --name pusula && pm2 save"
