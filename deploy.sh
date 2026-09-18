#!/usr/bin/env bash
# Run from an existing checkout on the Docker host; enrollment is explicit.
set -euo pipefail
cd "$(dirname "$0")"
command -v docker >/dev/null
if [ ! -d state-enterprise ]; then
  install -d -m 0700 -o 65532 -g 65532 state-enterprise
fi
docker compose -f compose.enterprise.yaml up -d web
if [ ! -f state-enterprise/agent_state.json ]; then
  echo 'Native enrollment is required. Run:'
  echo 'docker compose -f compose.enterprise.yaml run --rm --no-deps qurl-enterprise login'
  echo 'Then run this script again. Enter the setup key only at the hidden prompt.'
  exit 1
fi
docker compose -f compose.enterprise.yaml up -d qurl-enterprise
docker compose -f compose.enterprise.yaml ps
