#!/usr/bin/env bash
set -euo pipefail

if ! command -v render >/dev/null 2>&1; then
  echo "Render CLI is not installed. Install it with 'brew install render' or the official install script."
  exit 1
fi

if [ -z "${RENDER_SERVICE_ID:-}" ]; then
  echo "RENDER_SERVICE_ID is required."
  exit 1
fi

render deploys list "$RENDER_SERVICE_ID" --output json --confirm
