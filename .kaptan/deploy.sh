#!/bin/bash
set -euo pipefail

APP_DIR="/opt/pusula"

echo "[1/5] git pull..."
git -C "$APP_DIR" pull origin main

echo "[2/5] npm install..."
npm ci --include=dev --prefix "$APP_DIR"

echo "[3/5] build..."
npm run build --prefix "$APP_DIR"
npm prune --omit=dev --prefix "$APP_DIR"

echo "[4/5] pm2 restart..."
pm2 restart pusula 2>/dev/null || pm2 start "$APP_DIR/start.sh" --name pusula

echo "[5/5] pm2 save..."
pm2 save

echo "Waiting for app to start..."
sleep 5

echo "Deploy complete."
