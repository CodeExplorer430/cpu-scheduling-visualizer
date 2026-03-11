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

if [ -n "${RENDER_COMMIT_SHA:-}" ]; then
  render deploys create "$RENDER_SERVICE_ID" --commit "$RENDER_COMMIT_SHA" --wait --output json --confirm
else
  render deploys create "$RENDER_SERVICE_ID" --wait --output json --confirm
fi
