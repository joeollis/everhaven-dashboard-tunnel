#!/usr/bin/env bash
# Run from an existing checkout on the Docker host; enrollment is explicit.
set -euo pipefail
cd "$(dirname "$0")"
command -v docker >/dev/null
if [ ! -d state-v2 ]; then
  install -d -m 0700 -o 65532 -g 65532 state-v2
fi
docker compose -f compose.native.yaml up -d web
if [ ! -f state-v2/agent_state.json ]; then
  echo 'Native enrollment is required. Run:'
  echo 'docker compose -f compose.native.yaml run --rm --no-deps qurl login'
  echo 'Then run this script again. Enter the setup key only at the hidden prompt.'
  exit 1
fi
docker compose -f compose.native.yaml up -d qurl
docker compose -f compose.native.yaml ps
