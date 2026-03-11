#!/usr/bin/env bash
set -euo pipefail

if ! command -v render >/dev/null 2>&1; then
  echo "Render CLI is not installed. Install it with 'brew install render' or the official install script."
  exit 1
fi

render services --output json --confirm
