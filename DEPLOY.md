# Deploying Astro Chat to a Raspberry Pi

The app is a static React build served by nginx in a container. It deploys from a
**self-hosted GitHub Actions runner that lives on the Pi** — self-hosted minutes are
free, the build is native arm64, and there is no image registry, no SSH hop and no
extra network to configure.

```
git push main (kundali-webapp)
   └─ GitHub Actions → runner on the Pi (raspi-astro)
        ├─ npm ci && npm test && npm run build
        ├─ docker build --target runtime -t astro-chat:<sha>
        └─ docker compose up -d   (port 8082)
```

| File | Purpose |
|---|---|
| `Dockerfile` | `runtime` target serves `./build`; `full` target compiles inside the image |
| `nginx.conf` | SPA fallback (`/services` etc.), immutable cache for hashed assets, gzip, security headers |
| `docker-compose.yml` | Container `astro-chat`, `8082:80`, `restart: unless-stopped`, healthcheck |
| `.github/workflows/deploy.yml` | The single self-hosted job above |
| `.dockerignore` | Keeps the build context small |

> This repo is the `webapp/` child of [asmaurya/kundali-proj](https://github.com/asmaurya/kundali-proj).
> Pushes must go to **this** repo; the mother repo only stores the submodule pointer.

---

## 1. Pi prerequisites (already done on `raspi`)

```bash
docker --version && docker compose version      # Docker 29 + Compose v5 on the current Pi
sudo usermod -aG docker "$USER"                 # re-login afterwards
mkdir -p ~/astro-chat                           # deploy target (compose file is copied here)
```

If Docker is missing:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER" && newgrp docker
```

Architecture matters: the runner and image are **arm64** (`uname -m` → `aarch64`).
A 32-bit (`armv7l`) OS cannot run them; reinstall Raspberry Pi OS 64-bit.

Ports: the container publishes **8082** because **8080** is used by `gcode-art-nginx`
on this Pi. Change `"8082:80"` in `docker-compose.yml` if needed.

---

## 2. One-time: register the self-hosted runner

GitHub → this repo → **Settings → Actions → Runners → New self-hosted runner** →
Linux / ARM64. Copy the token from the page (valid ~1 h), then on the Pi:

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -fsSL -o runner.tar.gz \
  https://github.com/actions/runner/releases/download/v2.338.2/actions-runner-linux-arm64-2.338.2.tar.gz
tar xzf runner.tar.gz && rm runner.tar.gz

./config.sh \
  --url https://github.com/asmaurya/kundali-webapp \
  --token <TOKEN_FROM_GITHUB> \
  --name raspi-astro \
  --labels raspi \
  --unattended --replace

sudo ./svc.sh install "$USER"
sudo ./svc.sh start
sudo ./svc.sh status
```

The service starts on boot and reconnects automatically. Because the runner carries the
default labels `self-hosted, linux, ARM64`, the workflow's `runs-on: [self-hosted, linux, ARM64]`
matches it.

No repository secrets are required with this setup.

---

## 3. Deploy

```bash
git -C webapp push        # or push from the mother repo after committing in webapp/
```

Actions → **Deploy to Raspberry Pi** → the job appears within seconds.

Checks:

```bash
ssh abhi@<pi> "docker ps --filter name=astro-chat"
ssh abhi@<pi> "docker inspect --format '{{.State.Health.Status}}' astro-chat"
```

Open `http://<pi-ip>:8082`. Deep links like `/services` work (nginx falls back to `index.html`).

If the job sits at **Queued**, the runner is offline: `sudo ./svc.sh status` and
`~/actions-runner/_diag/*.log` on the Pi.

---

## 4. Rolling back

Every deploy keeps the image locally as `astro-chat:<7-char-sha>`:

```bash
cd ~/astro-chat
IMAGE=astro-chat:<old-sha> docker compose up -d
docker images astro-chat         # list what is available
```

---

## 5. Building without CI

```bash
npm run build && docker build -t astro-chat:local .    # runtime target
docker build --target full -t astro-chat:local .       # compile inside Docker (no Node needed)
docker run --rm -p 8080:80 astro-chat:local
```

Copy a build straight to the Pi:

```bash
scp -r build abhi@<pi>:~/astro-chat/build
ssh abhi@<pi> 'cd ~/astro-chat && docker build --target runtime -t astro-chat:manual . && IMAGE=astro-chat:manual docker compose up -d'
```

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Workflow Queued forever | Runner offline — `sudo ./svc.sh status`; re-run `./config.sh` if the token expired |
| `exec format error` | Image/runner arch ≠ OS. `uname -m` must be `aarch64` |
| `docker compose` works only with sudo | `sudo usermod -aG docker "$USER"` then log out/in (the runner service must run as that user) |
| Port 8082 in use | `sudo ss -ltnp \| grep 8082`, then change the mapping in `docker-compose.yml` |
| 404 on refresh / blank page | nginx config is baked into the image — rebuild, don't mount `index.html` |
| Disk filling up | `docker system prune -af --volumes`, `npm cache clean --force` |
| Old deploy still live | `docker compose ps`; the workflow tags images by sha — check `docker images astro-chat` |

### Why not GitHub-hosted runners?

Private repos consume paid Actions minutes on `ubuntu-latest`, and building arm64 there
needs QEMU emulation. Self-hosted is free, native, and the artifact never leaves the Pi.
