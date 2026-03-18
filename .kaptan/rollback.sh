#!/bin/bash
main() {
  set -euo pipefail
  APP_DIR="/opt/pusula"

  echo "[1/3] git revert..."
  PREV=$(git -C "$APP_DIR" rev-parse HEAD~1 2>/dev/null || true)
  if [ -z "$PREV" ]; then
    echo "No previous commit to roll back to."
    exit 1
  fi

  git -C "$APP_DIR" checkout main
  git -C "$APP_DIR" reset --hard "$PREV"

  echo "[2/3] rebuild..."
  npm ci --include=dev --prefix "$APP_DIR"
  npm run build --prefix "$APP_DIR"
  npm prune --omit=dev --prefix "$APP_DIR"

  echo "[3/3] pm2 restart..."
  pm2 restart pusula

  echo "Rolled back to: $PREV"
}
main "$@"
