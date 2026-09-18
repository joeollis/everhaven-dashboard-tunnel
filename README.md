# Everhaven private dashboard

This repository serves fictional portfolio data on DigitalOcean through an outbound LayerV connector. The public landing page is a separate Netlify deployment in `joeollis/everhavencapital`.

## Production design

`compose.production.yaml` runs Nginx on **127.0.0.1:8080 inside a Docker network namespace**, shared with qurl v2.6.0. There are no published host ports. Both containers are non-root, read-only, drop all capabilities and disallow privilege escalation. The qurl image is pinned to the official release digest.

Nginx sends no-store and no-referrer headers and loads no third-party fonts, scripts or telemetry. The `/healthz` route is private and supports real session-expiry checks. Already-downloaded content is not erased when a session expires.

`dashboard.everhavencapital.com` must have no public DNS record. No custom-domain certificate or DNS delegation is needed for the origin. The legacy Netlify dashboard deployment and previews must remain private.

## Enrollment and deployment

Use the current LayerV protected-service setup to obtain a **version 2 headless share configuration and one-time enrollment token for the same production owner and resource**. Preserve the returned CRID, resource ID, routing ID, knock resource ID and serving epoch exactly. Do not derive identifiers from a hostname or copy old sandbox state.

1. Place generated non-secret configuration in `runtime/share.yaml` (mode 0444). Set its loopback target to `http://127.0.0.1:8080` using the service setup.
2. Create `state-v2/` and `secret-v2/` as UID/GID 65532 with mode 0700. The enrollment token goes into `secret-v2/enrollment-token`, owned by 65532:65532, mode 0400. Never put credentials into shell history, Git or logs.
3. Stop the retired `qurl-connector` container. Retain its complete old state for rollback; do not mix identity files.
4. Start with `docker compose -f compose.production.yaml -f compose.bootstrap.yaml up -d`. Confirm origin health and actual LayerV serving state.
5. Warm-start using `docker compose -f compose.production.yaml up -d`. Confirm the resource is serving without an enrollment-token flag or secret mount, then remove the consumed one-time token.
6. Set the resulting production CRID and a production mint key in the Netlify server environment. Verify a new qURL, single-use behavior, and a fresh origin request after the two-minute session expires.

The legacy `compose.yaml`, `connector.Dockerfile` and `qurl-proxy.yaml` are retained only for rollback/reference. Do not use the old `deploy.sh` installer for this production configuration.

Check the live host for unintended listeners and Docker port mappings, and test direct requests to its public IP. SSH is an administrative listener, not a dashboard listener.
