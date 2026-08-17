# Everhaven dashboard — LayerV tunnel connector (DigitalOcean)

Makes the demo dashboard **genuinely disappear** when a QURL expires. The
dashboard runs with **no public inbound** and is reachable *only* through
LayerV's connector, so direct hits to the origin fail and access ends when the
60-second session ends.

Netlify keeps hosting the public marketing site (everhavencapital.com); only the
dashboard moves here.

---

## Your steps (~10 min, once)

### 1. Create the droplet
DigitalOcean → **Create → Droplets**:
- **Image:** Ubuntu 24.04 (LTS)
- **Size:** Basic → Regular → **$6/mo** (1 GB / 1 vCPU) is plenty
- **Authentication:** Password is fine (you'll use the browser console)
- Click **Create Droplet**, wait ~30s.

### 2. Open the browser console
On the droplet page: **Access → Launch Droplet Console**. A terminal opens in
your browser — no SSH keys needed.

### 3. Run the one-shot installer
Paste this single line and press Enter:
```sh
curl -fsSL https://raw.githubusercontent.com/joeollis/everhaven-dashboard-tunnel/main/deploy.sh | bash
```
It installs Docker, pulls this repo, and starts the private dashboard. When it
finishes it prints the next few commands — they're also here:

### 4. Mint the connector key
In **LayerV Slack** (or the staging console at `staging.layerv.ai/qurl/dashboard` — the demo runs against sandbox):
```
/qurl-admin protect-connector everhaven-dashboard env:docker-compose port:8080 service:web
```
Copy the **bootstrap key** it gives you. *(Why a key at all? LayerV blocks API
keys from minting other keys — a security rule — so this one admin step needs
your login. It's one-time.)*

### 5. Drop in the key and start the connector
```sh
cd /opt/everhaven-tunnel
printf '%s' 'PASTE_BOOTSTRAP_KEY_HERE' > secret/api_key
docker compose up -d
docker compose logs -f qurl-connector      # wait for a successful connection, then Ctrl-C
rm -f secret/api_key                        # key is one-time; remove it
```

### 6. Tell Claude "connector is live"
Then I finish the rest: point `dashboard.everhavencapital.com` at this connector,
update the homepage's mint call (with `session_duration: 60s`), and re-run the
end-to-end test so we watch the dashboard vanish on reload.

---

## Notes
- **Always-on:** the droplet stays up and the connector reconnects on reboot
  using its saved identity in `agent-state/`. You never touch the key again.
- **Image tag:** `compose.yaml` pins `qurl-connector:v0.7.1` (no more `:latest`).
  When a newer connector ships, change the pin deliberately.
- **No secrets in this repo:** the bootstrap key (`secret/`) and connector
  identity (`agent-state/`) are gitignored and live only on the droplet.
