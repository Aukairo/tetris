# Deploying Reverse Saboteur Tetris on Hostinger

This guide walks through deploying all three services of the stack on Hostinger's **VPS** plan (required for Node.js + Python + WebSocket support). A shared hosting plan will **not** work.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Hostinger VPS                     │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Next.js Web │  │ NestJS Server│  │ Python AI │ │
│  │  (Port 3000) │  │  (Port 3001) │  │ (Port 8000│ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
│  ┌──────▼─────────────────▼────────────────▼──────┐ │
│  │              Nginx Reverse Proxy               │ │
│  │  yourdomain.com  →  Next.js (:3000)            │ │
│  │  api.yourdomain.com  →  NestJS (:3001)         │ │
│  │  ai.yourdomain.com  →  FastAPI (:8000)         │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Recommended VPS Plan**: Hostinger KVM 2 or above (2 vCPUs, 8 GB RAM). The AI engine (`laya-mlx`) requires Apple Silicon for native inference — on a Linux VPS it will automatically fall back to the **heuristic engine** (still fully playable).

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20.x |
| npm | ≥ 10.x |
| Python | ≥ 3.11 |
| pip | Latest |
| PM2 | Latest (process manager) |
| Nginx | Latest |

---

## Step 1 — Provision a Hostinger VPS

1. Purchase a VPS plan at [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting).
2. During setup, select **Ubuntu 22.04 LTS** as the OS template.
3. Note your VPS IP address (shown in the Hostinger hPanel).
4. Connect via SSH:
   ```bash
   ssh root@YOUR_VPS_IP
   ```

---

## Step 2 — Server Setup & Dependencies

```bash
# Update packages
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python 3.11 + pip
apt install -y python3.11 python3.11-venv python3-pip

# Install PM2 (global process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git
```

Verify installations:
```bash
node -v        # v20.x.x
python3.11 -V  # Python 3.11.x
pm2 -v
nginx -v
```

---

## Step 3 — Clone Your Repository

```bash
# Create a directory for your app
mkdir -p /var/www/tetris
cd /var/www/tetris

# Clone from GitHub
git clone https://github.com/Aukairo/tetris.git .
```

---

## Step 4 — Configure Environment Variables

### NestJS Server (`server/.env`)

```bash
cat > /var/www/tetris/server/.env << 'EOF'
PORT=3001
DATABASE_URL="file:/var/www/tetris/server/prisma/prod.db"
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
AI_ENGINE_URL=http://localhost:8000
EOF
```

### Next.js Web (`web/.env.local`)

```bash
cat > /var/www/tetris/web/.env.local << 'EOF'
NEXT_PUBLIC_SERVER_URL=https://api.yourdomain.com
NEXT_PUBLIC_AI_URL=https://ai.yourdomain.com
EOF
```

> [!WARNING]
> Replace `yourdomain.com` with your actual domain. Never commit `.env` files to Git.

---

## Step 5 — Deploy the NestJS Game Server

```bash
cd /var/www/tetris/server

# Install dependencies
npm install

# Run Prisma migrations to create the production SQLite DB
npx prisma migrate deploy

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/main.js --name "tetris-server" --env production
pm2 save
```

> [!NOTE]
> The current `package.json` uses `tsx` for development. For production, `npm run build` compiles to `dist/`. Make sure `tsconfig.json` has `"outDir": "dist"` set.

---

## Step 6 — Deploy the Python AI Engine

```bash
cd /var/www/tetris/ai-engine

# Create a virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
# Note: laya-mlx and mlx are Apple Silicon only — they will fail gracefully on Linux
# and the heuristic fallback engine will activate automatically
pip install fastapi>=0.115.0 uvicorn>=0.30.0 numpy>=1.26.0 pydantic>=2.8.0

# Start with PM2 using the venv Python
pm2 start "venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000 --workers 2" \
  --name "tetris-ai" \
  --interpreter none
pm2 save
```

Verify the AI engine is healthy:
```bash
curl http://localhost:8000/health
# Expected: {"status":"online","laya_status":"fallback (...)","engine":"heuristic-fallback"}
```

---

## Step 7 — Build & Deploy the Next.js Web App

```bash
cd /var/www/tetris/web

# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2
pm2 start "npm start" --name "tetris-web" --cwd /var/www/tetris/web
pm2 save
```

---

## Step 8 — Configure Nginx as Reverse Proxy

### Point Your Domain to the VPS

In Hostinger's **hPanel → DNS Zone**, add these A records:

| Hostname | Type | Value |
|---|---|---|
| `@` | A | `YOUR_VPS_IP` |
| `api` | A | `YOUR_VPS_IP` |
| `ai` | A | `YOUR_VPS_IP` |

DNS propagation can take 5–60 minutes.

### Create the Nginx Config

```bash
nano /etc/nginx/sites-available/tetris
```

Paste the following (replace `yourdomain.com` throughout):

```nginx
# Main web app
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# NestJS API + WebSocket server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        # Critical: WebSocket (Socket.IO) headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}

# Python AI Engine
server {
    listen 80;
    server_name ai.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and reload:
```bash
ln -s /etc/nginx/sites-available/tetris /etc/nginx/sites-enabled/
nginx -t          # Test config — must say "test is successful"
systemctl reload nginx
```

---

## Step 9 — Enable HTTPS with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificates for all three subdomains
certbot --nginx \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  -d ai.yourdomain.com

# Auto-renew (runs twice daily via cron)
systemctl enable certbot.timer
```

After certbot runs, Nginx is automatically updated to redirect HTTP → HTTPS.

---

## Step 10 — Configure PM2 to Auto-Start on Reboot

```bash
# Generate the startup script for your OS
pm2 startup

# Run the command that PM2 prints (it looks like this):
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save the current process list
pm2 save
```

Verify all three services are running:
```bash
pm2 list
```

Expected output:
```
┌────┬──────────────────┬─────────┬─────────┬──────────┐
│ id │ name             │ status  │ cpu     │ memory   │
├────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0  │ tetris-server    │ online  │ 0%      │ 80mb     │
│ 1  │ tetris-ai        │ online  │ 0%      │ 120mb    │
│ 2  │ tetris-web       │ online  │ 0%      │ 160mb    │
└────┴──────────────────┴─────────┴─────────┴──────────┘
```

---

## Step 11 — Database Migration (SQLite → PostgreSQL, Optional but Recommended)

The current schema uses SQLite (`file:./dev.db`), which works fine for low-to-medium traffic. For production scalability, consider migrating to PostgreSQL:

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Create a database and user
sudo -u postgres psql << 'SQL'
CREATE DATABASE tetris_prod;
CREATE USER tetris_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE tetris_prod TO tetris_user;
SQL
```

Then update `server/prisma/schema.prisma`:

```diff
datasource db {
-  provider = "sqlite"
-  url      = "file:./dev.db"
+  provider = "postgresql"
+  url      = env("DATABASE_URL")
}
```

And set `DATABASE_URL` in `server/.env`:
```
DATABASE_URL="postgresql://tetris_user:strong_password_here@localhost:5432/tetris_prod"
```

Then re-run migrations:
```bash
cd /var/www/tetris/server
npx prisma migrate deploy
```

---

## Deployment Checklist

- [ ] VPS provisioned with Ubuntu 22.04
- [ ] Node.js 20, Python 3.11, PM2, Nginx installed
- [ ] Repo cloned to `/var/www/tetris`
- [ ] Environment variables configured (`.env`, `.env.local`)
- [ ] NestJS server built and started via PM2
- [ ] Python AI engine running via PM2 (heuristic fallback confirmed)
- [ ] Next.js built and started via PM2
- [ ] DNS A records pointed to VPS IP
- [ ] Nginx configured with proxy for all 3 services
- [ ] SSL certificates issued via Let's Encrypt
- [ ] PM2 auto-start on reboot enabled
- [ ] Verified `https://yourdomain.com` loads the game
- [ ] Verified `https://api.yourdomain.com/health` returns 200
- [ ] Verified `https://ai.yourdomain.com/health` returns JSON

---

## Useful Commands

```bash
# View live logs
pm2 logs tetris-server
pm2 logs tetris-web
pm2 logs tetris-ai

# Restart all services
pm2 restart all

# Pull latest code and redeploy
cd /var/www/tetris && git pull
cd server && npm install && npm run build && pm2 restart tetris-server
cd ../web && npm install && npm run build && pm2 restart tetris-web
cd ../ai-engine && source venv/bin/activate && pip install -r requirements.txt && pm2 restart tetris-ai
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| WebSocket connections dropped | Ensure `proxy_read_timeout 86400s` is in Nginx config |
| `ai.yourdomain.com` returns 502 | Check `pm2 logs tetris-ai`; confirm port 8000: `ss -tlnp \| grep 8000` |
| Prisma migration fails | Run `npx prisma db push` as a quick alternative to `migrate deploy` |
| `laya-mlx` install fails | Expected on Linux — the heuristic fallback activates automatically |
| 413 Request Entity Too Large | Add `client_max_body_size 10M;` to your Nginx server block |
| CORS errors in browser | Confirm `NEXT_PUBLIC_SERVER_URL` matches `https://api.yourdomain.com` |
