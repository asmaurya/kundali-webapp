# Deploying Astro Chat to a Raspberry Pi

The app is a static React build. The pipeline is:

```
git push main
   └─ GitHub Actions
        ├─ npm ci / test / build            (x86 runner, fast)
        ├─ docker build --target runtime     (linux/arm64 image, no QEMU npm build)
        ├─ push ghcr.io/<owner>/<repo>:sha-<commit>
        └─ ssh into the Pi
             ├─ scp docker-compose.yml
             └─ docker compose pull && up -d
                  └─ nginx :8082 → static files + SPA fallback
```

Why Docker: the Pi only needs Docker (no Node, no build tools, no nginx config), the
image is identical every time, and rolling back is just deploying an older `sha-` tag.

Files added for this:

| File | Purpose |
|---|---|
| `Dockerfile` | `runtime` target serves `./build` (used by CI); `full` target compiles from source |
| `nginx.conf` | SPA fallback (`/services` etc.), long cache for hashed assets, gzip, basic security headers |
| `docker-compose.yml` | Container `astro-chat`, port `8082:80`, restart policy, healthcheck |
| `.dockerignore` | Keeps the build context small |
| `.github/workflows/deploy.yml` | Build → GHCR → deploy on push to `main` |

---

## 1. One-time: prepare the Pi

SSH in:

```bash
ssh <user>@<pi-host>     # e.g. ssh pi@raspberrypi.local
```

**Check the architecture** (matters for the image):

```bash
uname -m
```

- `aarch64` → 64-bit OS, the workflow's `linux/arm64` image is correct.
- `armv7l` → 32-bit OS. Either reinstall with Raspberry Pi OS 64-bit (recommended),
  or change `platforms: linux/arm64` to `linux/arm/v7` in the workflow.

**Check Docker:**

```bash
docker --version
docker compose version
```

If either is missing:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
newgrp docker          # or log out and back in
docker compose version # verify the plugin is there
```

**Create the app directory:**

```bash
mkdir -p ~/astro-chat
```

Ports: the container publishes **8082**, so open `http://<pi-ip>:8082`.
If `8082` is taken, change `"8082:80"` in `docker-compose.yml`.

---

## 2. One-time: let GitHub reach the Pi

GitHub-hosted runners are on the public internet. If your Pi is only on your home
LAN, they cannot SSH to it. Pick one:

### Option A — Tailscale (already installed on this Pi)

Tailscale is installed on the Pi as hostname **`raspi-astro`**, and
`.github/workflows/deploy.yml` already joins the tailnet before deploying.

1. Approve the login once (the URL is printed by `sudo tailscale up` on the Pi).
2. Check the address:
   ```bash
   ssh abhi@<pi-lan-ip> "tailscale ip -4"     # 100.x.y.z
   ```
3. Create a reusable auth key: Tailscale admin → **Settings → Keys → Generate auth key**
   (reusable; no need for ephemeral). Add it as the repository secret **`TS_AUTHKEY`**.
4. Set **`PI_HOST`** to the `100.x.y.z` Tailscale address instead of the LAN IP.

The workflow step that does this:
```yaml
- uses: tailscale/github-action@v2
  with:
    authkey: ${{ secrets.TS_AUTHKEY }}
    ping: ${{ secrets.PI_HOST }}
```

### Option B — self-hosted runner on the Pi (no inbound ports)

```bash
# Repository → Settings → Actions → Runners → New self-hosted runner
# then on the Pi, in a dedicated folder:
mkdir -p ~/actions-runner && cd ~/actions-runner
# run the downloaded config command, then:
sudo ./svc.sh install && sudo ./svc.sh start
```

Then change `runs-on: ubuntu-latest` for the **deploy** job to `runs-on: self-hosted`.
With this option the `scp`/`ssh` steps can be replaced by a single

```yaml
- run: cd ~/astro-chat && git -C "$GITHUB_WORKSPACE" show HEAD:docker-compose.yml > docker-compose.yml && docker compose pull && docker compose up -d
```

### Option C — port-forward SSH on your router

Only if you accept exposing SSH to the internet; use key-only auth, a non-default
port and fail2ban. Option A is safer.

---

## 3. One-time: create a deploy key

On your laptop:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/pi_deploy -C "github-actions-deploy" -N ""
ssh-copy-id -i ~/.ssh/pi_deploy.pub <user>@<pi-host>    # or append the .pub to ~/.ssh/authorized_keys on the Pi
cat ~/.ssh/pi_deploy                                     # copy this private key
```

Test it:

```bash
ssh -i ~/.ssh/pi_deploy <user>@<pi-host> "docker --version && docker compose version"
```

---

## 4. One-time: repository + secrets

```bash
git init
git add .
git commit -m "Astro Chat web app"
git branch -M main
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

Then in **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `PI_HOST` | Pi IP / Tailscale IP / hostname |
| `PI_USER` | e.g. `pi` |
| `PI_SSH_KEY` | contents of `~/.ssh/pi_deploy` (the private key, whole file) |
| `PI_PORT` | optional, defaults to `22` |

**Image visibility:** the package is private by default. Either

- repo → **Packages** → the `astro-chat` package → **Package settings → Change visibility → Public**
  (fine for a LAN app; the image contains only the compiled frontend), **or**
- on the Pi log in once with a PAT that has `read:packages`:
  ```bash
  echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
  ```

The workflow triggers on pushes to **`main`**; if your default branch is `master`,
adjust `branches:` in `.github/workflows/deploy.yml`.

---

## 5. First deploy

Push (or run the workflow manually from the **Actions** tab → *Build and deploy to
Raspberry Pi* → **Run workflow**):

```bash
git push
```

Watch the two jobs. A successful deploy ends with a line like
`Up 12 seconds (healthy)`.

Verify:

```bash
ssh <user>@<pi-host> "docker ps --filter name=astro-chat"
```

Open `http://<pi-ip>:8082`. Deep links such as `/services` work because nginx falls
back to `index.html`.

---

## 6. Day-to-day

- **Deploy:** push to `main`. The image is tagged `sha-<commit>` and `latest`.
- **Rollback:** on the Pi, run a previous commit's tag:
  ```bash
  cd ~/astro-chat
  IMAGE=ghcr.io/<owner>/<repo>:sha-<old-commit> docker compose up -d
  ```
  (Or re-run the workflow on the old commit.)
- **Logs:** `docker logs -f astro-chat`
- **Restart:** `cd ~/astro-chat && docker compose restart`
- **Stop:** `docker compose down`

---

## 7. Test the image locally first (optional)

```bash
npm run build
docker build -t astro-chat .          # runtime target: serves ./build
docker run --rm -p 8080:80 astro-chat
# open http://localhost:8080
```

Or build everything inside Docker (no Node needed):

```bash
docker build --target full -t astro-chat .
```

The local Docker build was verified: `/` and `/services` return 200, hashed assets get
`Cache-Control: max-age=31536000, immutable`, and the container reports **healthy**.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `exec format error` in container logs | Image arch ≠ Pi OS. `uname -m`: `armv7l` → build `linux/arm/v7`. |
| Actions deploy job: connection timed out | Runner can't reach the Pi — see §2 (Tailscale or self-hosted runner). |
| `pull access denied` / `unauthorized` | GHCR package is private: make it public or `docker login ghcr.io` on the Pi. |
| `docker compose plugin is missing` | `sudo apt-get install -y docker-compose-plugin` |
| Port 8082 already in use | `sudo ss -ltnp \| grep 8082`, then change the mapping in `docker-compose.yml`. |
| Blank page / 404 on refresh | nginx config not applied — rebuild the image (it is baked in, not mounted). |
| Changes not visible | Check the workflow used a new `sha-` tag; hard-refresh (hashed assets are cached 1 year). |
