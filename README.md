# Everhaven private dashboard

A fictional real estate investment report served on DigitalOcean through an outbound LayerV connector. The public landing page is a separate Netlify deployment in `joeollis/everhavencapital`.

## Active deployment (since 2026-11-04)

The dashboard is published with the **qURL CLI 3.6.1** directly on the droplet, under the personal production account `joeollis@clearcap.consulting` (managed at dashboard.layerv.ai).

- **Origin:** the host's Nginx serves `/srv/everhaven/dashboard` (a clone of this repo) on **127.0.0.1:8080 only**, using `nginx.conf` with its root rewritten. No public listener.
- **Publishing:** `qurl publish http://127.0.0.1:8080 --id everhaven-dashboard` → private tunnel resource, CRID `aegpksbcdorb35e7sifvkhtjxbowoucm2zytyii23mfjax7iqb6spuejxbzq`.
- **Supervision:** the CLI's native background service, the systemd user unit `ai.layerv.qurl.share-daemon.service` for root, enabled, with `loginctl enable-linger root` so it starts at boot.
- **Public site:** Netlify mints one-minute, single-use links for that CRID with an API key from the same account (owners may share their own resources).

### Set up from scratch

```sh
apt-get install -y nginx curl
git clone --depth 1 https://github.com/joeollis/everhaven-dashboard-tunnel /srv/everhaven
sed 's#/usr/share/nginx/html#/srv/everhaven/dashboard#' /srv/everhaven/nginx.conf > /etc/nginx/sites-available/default
nginx -t && systemctl restart nginx && curl -s 127.0.0.1:8080/healthz
curl -fsSLo /tmp/qurl.deb "https://github.com/layervai/qurl-integrations/releases/download/v3.6.1/qurl_3.6.1_linux_$(dpkg --print-architecture).deb"
apt-get install -y /tmp/qurl.deb && loginctl enable-linger root
read -rsp 'Account key: ' K; echo; printf %s "$K" | qurl login; unset K   # login BEFORE the first publish
qurl publish http://127.0.0.1:8080 --id everhaven-dashboard
```

Run `qurl login` before the first `qurl publish`. Publishing first silently creates an anonymous device identity, and `login` will then refuse to switch accounts.

### Operations

```sh
qurl status <CRID>                      # want Desired: on / Observed: serving
qurl whoami                             # owner should be the personal account
systemctl --user restart ai.layerv.qurl.share-daemon.service
cd /srv/everhaven && git pull           # update dashboard content (Nginx serves it live)
```

### Retired deployments (kept on disk for rollback only)

The previous Docker deployments live in `/opt/everhaven-tunnel`: `compose.enterprise.yaml` (qurl v2.6.0 on the `joe@layerv.ai` Enterprise account, stopped 2026-11-04), `compose.native.yaml`, `compose.production.yaml` + `compose.bootstrap.yaml`, and the legacy sandbox `compose.yaml`. **Never run `docker compose down` on any of these files.** They share one Compose project name, so `down` on one removes containers the others depend on. Use `stop` / `up -d` with the specific file. Do not delete their state directories.

## Custom-domain blocker

As tested on the Enterprise account (Sep 2026), the production API rejects binding the active custom domain to this native connector: `custom_domain is not supported for qURL Connector resources`. The fresh portal hostname passed DNS verification and is Active, but resource assignment still fails. This reproduces the rejection independently of the older dashboard hostname registered in staging. The domain is unbound. Sessions use temporary `qurl.site` addresses. The dashboard UI misleadingly exposes a selector for this unsupported operation. Keep the origin private; no inbound ports should be opened to work around this limitation.

## Investor demo content

Everhaven Capital is a fictional real estate investment company sharing the Harbor House quarterly report with Maya Chen, an approved investor. Sign-in and approval are simulated by the public demo; LayerV access is real. The static application does not authenticate actual investors. The report includes property cash flow and an explicitly simplified pro rata investor distribution.

Report tables are server-rendered HTML. `report.md`, `report.json` and `report.csv` provide the same fictional data through the protected route; never copy them to the public Netlify deployment. In-page JSON/download buttons fetch through the admitted session. `check_protected_access` and `read_investment_report` are optional WebMCP tools. Deployment links teach how to deploy LayerV for the operator's own resource, not how to duplicate the demo's simulated authentication.
