# Everhaven private dashboard

Fictional portfolio data served on DigitalOcean through an outbound LayerV connector. The public landing page is a separate Netlify deployment in `joeollis/everhavencapital`.

## Active deployment

Use **compose.native.yaml**. It runs Nginx on **127.0.0.1:8080 inside a Docker network namespace**, shared with qurl v2.6.0. No host ports are published. Both containers are non-root, read-only, drop all capabilities and disallow privilege escalation. The qurl image is pinned to the official release digest.

The official native CLI publishes the loopback service with `--foreground`, running the production daemon engine in the container process. Docker supervises that process and restarts it. Its stable Connector ID is `everhaven-dashboard-prod`; saved native identity and resource state live in the owner-only `state-v2/` volume. A clean stop closes sharing; the next start reuses the same CRID. This restart behavior was verified on the live demo.

Nginx sends no-store and no-referrer headers and loads no third-party fonts, scripts or telemetry. Its private `/healthz` route supports session-expiry checks. Downloaded content is not erased when a session expires.

`dashboard.everhavencapital.com` has no public DNS records. No custom-domain certificate or DNS delegation is needed for the origin. The legacy Netlify dashboard and previews must remain private.

## First enrollment

Use a production account setup key with native enrollment and connector enrollment permissions. Never put it in shell arguments, history, Git or image layers.

```sh
install -d -m 0700 -o 65532 -g 65532 state-v2
docker compose -f compose.native.yaml up -d web
docker compose -f compose.native.yaml run --rm --no-deps qurl login
# Paste the account key only at the hidden API-key prompt.
docker compose -f compose.native.yaml up -d qurl
docker compose -f compose.native.yaml logs --tail 30 qurl
```

Wait for `Published` and `Status: serving`. Record the CRID verbatim. Configure the public site's server environment with that CRID and a separate read/write mint key. Revoke the temporary account setup key once enrollment and warm restart are verified; the saved restricted device identity handles subsequent starts.

## Operations

```sh
docker compose -f compose.native.yaml ps
docker compose -f compose.native.yaml restart qurl
docker compose -f compose.native.yaml exec -T qurl /usr/local/bin/qurl inspect <CRID> -o json
```

A running container alone does not prove serving. Check `connection_state`, `daemon_state` and `local_target_health`, and test an actual qURL. If replacing the web container, recreate the qurl container too because they share a network namespace. Back up the entire state directory securely; do not copy selected identity files or share a state directory between independent deployments.

The alternate `compose.production.yaml` plus `compose.bootstrap.yaml` implements LayerV's enterprise headless-config path, which requires genuine generated account-specific share identifiers. It is not the active deployment and must not be started against the native deployment's state directory.

The legacy `compose.yaml`, `connector.Dockerfile` and `qurl-proxy.yaml` are retained for rollback/reference only. Their obsolete sandbox connector is stopped. Administrative SSH remains separate from the dashboard; there are no public dashboard listeners.
