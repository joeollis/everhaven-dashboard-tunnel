# Everhaven private dashboard

Fictional company research served on DigitalOcean through an outbound LayerV connector. The public landing page is a separate Netlify deployment in `joeollis/everhavencapital`.

## Active deployment

Use **compose.enterprise.yaml**. It runs Nginx on **127.0.0.1:8080 inside a Docker network namespace**, shared with qurl v2.6.0. No host ports are published. Both containers are non-root, read-only, drop all capabilities and disallow privilege escalation. The qurl image is pinned to the official release digest.

The official native CLI publishes the loopback service with `--foreground`, running the production daemon engine in the container process. Docker supervises that process and restarts it. Its stable Connector ID is `everhaven-enterprise`; saved native identity and resource state live in the owner-only `state-enterprise/` volume. A clean stop closes sharing; the next start reuses the same CRID. This restart behavior was verified on the live demo.

Nginx sends no-store and no-referrer headers and loads no third-party fonts, scripts or telemetry. Its private `/healthz` route supports session-expiry checks. Downloaded content is not erased when a session expires.

The production connector belongs to the `joe@layerv.ai` Enterprise account. `portal.everhavencapital.com` is the fresh production domain and has public DNS pointing to LayerV’s production gateway, with DNS verification and certificate delegation. That gateway record does not expose the private origin. The legacy Netlify dashboard and previews must remain private.

## First enrollment

Use a production account setup key with native enrollment and connector enrollment permissions. Never put it in shell arguments, history, Git or image layers.

```sh
install -d -m 0700 -o 65532 -g 65532 state-enterprise
docker compose -f compose.enterprise.yaml up -d web
docker compose -f compose.enterprise.yaml run --rm --no-deps qurl-enterprise login
# Paste the account key only at the hidden API-key prompt.
docker compose -f compose.enterprise.yaml up -d qurl-enterprise
docker compose -f compose.enterprise.yaml logs --tail 30 qurl-enterprise
```

Wait for `Published` and `Status: serving`. Record the CRID verbatim. Configure the public site's server environment with that CRID and a separate read/write mint key. Revoke the temporary account setup key once enrollment and warm restart are verified; the saved restricted device identity handles subsequent starts.

## Operations

```sh
docker compose -f compose.enterprise.yaml ps
docker compose -f compose.enterprise.yaml restart qurl-enterprise
docker compose -f compose.enterprise.yaml exec -T qurl-enterprise /usr/local/bin/qurl inspect <CRID> -o json
```

A running container alone does not prove serving. Check `connection_state`, `daemon_state` and `local_target_health`, and test an actual qURL. If replacing the web container, recreate the qurl container too because they share a network namespace. Back up the entire state directory securely; do not copy selected identity files or share a state directory between independent deployments.

The alternate `compose.production.yaml` plus `compose.bootstrap.yaml` implements LayerV's enterprise headless-config path, which requires genuine generated account-specific share identifiers. It is not the active deployment and must not be started against the native deployment's state directory.

The legacy `compose.yaml`, `connector.Dockerfile` and `qurl-proxy.yaml` are retained for rollback/reference only. Their obsolete sandbox connector is stopped. Administrative SSH remains separate from the dashboard; there are no public dashboard listeners.

The prior personal-account deployment in `compose.native.yaml` and its `state-v2/` directory are retained for rollback. Do not run `down --remove-orphans` or delete these identity files during migration.

## Custom-domain blocker

The production API rejects binding the active custom domain to this native connector: `custom_domain is not supported for qURL Connector resources`. The fresh portal hostname passed DNS verification and is Active, but resource assignment still fails. This reproduces the rejection independently of the older dashboard hostname registered in staging. The domain is unbound. Sessions use temporary `qurl.site` addresses. The dashboard UI misleadingly exposes a selector for this unsupported operation. Keep the origin private; no inbound ports should be opened to work around this limitation.

## Analyst demo content

The briefing follows one pre-approved fictional external analyst, Maya Chen, reviewing Northline Manufacturing. Approval is simulated by the public demo, not authenticated by this static application. Research tables are server-rendered HTML; `brief.md`, `research.json` and `research.csv` provide the same fictional dataset through the protected route. They must not be copied into the public Netlify deployment. `check_protected_access` and `read_research_data` are optional WebMCP tools in supporting browsers; the fresh health button and relative data URLs remain the portable interfaces.
