# SmartUp Online ERP — Production Server Configuration

---

**Server:** `187.77.153.192` (Hostinger VPS)  
**SSH alias:** `ssh smartup-online` → `root@187.77.153.192`  
**Domain:** `smartuplearning.online` & `www.smartuplearning.online` (via Cloudflare Proxy)  
**Date Deployed:** October 22, 2026  
**Status:** ✅ PRODUCTION LIVE  
**Isolation:** Dedicated Standalone VPS (100% Decoupled from Offline ERP)  

---

## 1. System Overview

The **SmartUp Online ERP Frontend** is a dedicated Next.js 16 application engineered specifically for SmartUp's virtual campus, online batches, GCC programs, and digital fee processing. It operates on an isolated Hostinger KVM VPS and connects directly to Frappe Cloud.

| Property | Offline ERP (`smartup-erp-frontend`) | Online ERP (`smartup-online-erp`) |
|:---|:---|:---|
| **Server Host** | `76.13.244.60` (Shared Portal VPS) | **`187.77.153.192` (Dedicated Hostinger VPS)** |
| **Server Hardware** | 4 vCPU / 8 GB RAM | **4 vCPU / 16 GB RAM / 200 GB SSD** |
| **Domain** | `smartuplearning.net` | **`smartuplearning.online`** |
| **DNS / SSL** | Cloudflare Proxy → Origin Cert | **Cloudflare Proxy → Origin Cert (Full SSL)** |
| **App Port** | 3001 (Clustered 3001–3007) | **3000** |
| **PM2 Process** | `smartup-erp` | **`smartup-online-erp`** |
| **Install Path** | `/var/www/smartup-erp` | **`/var/www/smartup-online-erp`** |
| **Runtime** | Node.js 18 / Next.js 16.1.6 | **Node.js 22.23.4 LTS / Next.js 16.4.2** |
| **Backend** | `smartup.m.frappe.cloud` | **`smartupedu.frappe.cloud`** |
| **Git Repo** | `pydart-hub/smartup-erp-frontend` | **`arjun-smartup/smartup-online-erp`** |

---

## 2. Deployment Checklist

- [x] **DNS Setup**: Point `smartuplearning.online` & `www` to `187.77.153.192` with Cloudflare Proxy (Orange Cloud).
- [x] **Base Server Setup**: Ubuntu 26.04 LTS provisioned with Node.js 22 LTS, npm, PM2, Git, UFW, and Nginx.
- [x] **Firewall Hardening**: UFW enabled (Ports 22 SSH, 80 HTTP, 443 HTTPS allowed).
- [x] **Code Deployment**: Cloned repo to `/var/www/smartup-online-erp` from `https://github.com/arjun-smartup/smartup-online-erp.git`.
- [x] **Environment Security**: Configured `/var/www/smartup-online-erp/.env.production` (chmod 600).
- [x] **Production Build**: Dependencies installed (`npm ci`) and compiled with Next.js Turbopack (`npm run build`).
- [x] **Process Management**: Configured PM2 (`smartup-online-erp`) on port 3000 with systemd startup on reboot.
- [x] **Reverse Proxy**: Nginx configured with SSL, WebSocket upgrades, and streaming buffers for Next.js 16.
- [x] **End-to-End Verification**: HTTP/HTTPS status verified 200 OK.

---

## 3. DNS Configuration (Cloudflare)

DNS is managed through **Cloudflare** with the proxy enabled to provide edge DDoS protection and global caching:

| Type | Name | Target / IP | Proxy Status | TTL |
|:---|:---|:---|:---|:---|
| **A** | `@` (`smartuplearning.online`) | `187.77.153.192` | ☁️ Proxied (Orange) | Auto |
| **CNAME** | `www` | `@` | ☁️ Proxied (Orange) | Auto |

### Cloudflare SSL/TLS Settings
* **Encryption Mode**: **Full** (or Full Strict).
* **Traffic Flow**:
  1. **Browser to Cloudflare**: Cloudflare Universal SSL (TLS 1.3).
  2. **Cloudflare to Hostinger VPS**: Encrypted HTTPS on port 443 connecting to Nginx with origin certificate.

---

## 4. Repository & Code Placement

* **Repository**: `https://github.com/arjun-smartup/smartup-online-erp.git`
* **Default Branch**: `main`
* **Server Install Path**: `/var/www/smartup-online-erp`

```bash
# Clone to server (initial setup)
mkdir -p /var/www
cd /var/www
git clone https://github.com/arjun-smartup/smartup-online-erp.git smartup-online-erp
cd smartup-online-erp
```

---

## 5. Production Environment Configuration

**File:** `/var/www/smartup-online-erp/.env.production`  
**File Permissions:** `chmod 600 /var/www/smartup-online-erp/.env.production`

```env
# Frappe Backend Instance (Online Batches & GCC Programs)
NEXT_PUBLIC_FRAPPE_URL=https://smartupedu.frappe.cloud

# Server-Side API Authentication (Server-to-Server Only)
FRAPPE_API_KEY=39f71c6530cd462
FRAPPE_API_SECRET=064f8d6fb2fb0bc

# Application Identity & URLs
NEXT_PUBLIC_APP_NAME="SmartUp Online ERP"
NEXT_PUBLIC_APP_URL=https://smartuplearning.online
NEXT_PUBLIC_DEFAULT_DIVISION="SmartUp Online Kerala"

# NextAuth / Cookie Secret
NEXTAUTH_SECRET=smartup-online-erp-production-secret-key-32chars-secure

# Production Mode
NODE_ENV=production
```

### Environment Variables Reference

| Variable | Scope | Purpose |
|:---|:---|:---|
| `NEXT_PUBLIC_FRAPPE_URL` | Client & Server | Online Frappe Cloud ERP backend instance URL |
| `FRAPPE_API_KEY` | Server Only | Frappe Administrator/Manager API key |
| `FRAPPE_API_SECRET` | Server Only | Frappe Administrator/Manager API secret |
| `NEXT_PUBLIC_APP_NAME` | Client | Browser tab and navbar branding title |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Canonical public URL (`https://smartuplearning.online`) |
| `NEXT_PUBLIC_DEFAULT_DIVISION`| Client | Default division assigned to new online students |
| `NEXTAUTH_SECRET` | Server Only | Cryptographic secret used for session/cookie token signing |

---

## 6. Build & Dependency Specifications

* **Runtime**: Node.js `v22.23.4 LTS` / npm `10.9.9`
* **Framework**: Next.js `16.4.2` (Turbopack, App Router, React 19.3.0, Tailwind CSS v4)

```bash
cd /var/www/smartup-online-erp
npm ci
npm run build
```

### Production Route Topology
* **Static Prerendered Pages (`○`)**:
  * `/` — Online ERP executive dashboard
  * `/students` — Online student directory
  * `/students/new` — Student registration wizard
  * `/fees` — Digital fee tracking and collection summaries
  * `/assessments` — Online test and evaluation schedules
  * `/live-classes` — Virtual lecture and meeting manager
  * `/settings/frappe-status` — Backend API connection diagnostics
  * `/login` — Role-based staff/admin authentication
* **Partial Prerendering (`◐`)**:
  * `/students/[id]` — Dynamic student profile with static shell and dynamic ledger streaming
* **Dynamic API Endpoints (`ƒ`)**:
  * `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
  * `/api/dashboard/summary`
  * `/api/students/list`, `/api/students/[id]`, `/api/students/enrol`
  * `/api/fees/summary`, `/api/invoices/create-monthly`, `/api/payments/create`
  * `/api/frappe/health`, `/api/proxy/[...path]`

---

## 7. PM2 Process Manager

The application runs as a background daemon managed by PM2 on port 3000:

```bash
cd /var/www/smartup-online-erp
pm2 start npm --name "smartup-online-erp" -- start -- -p 3000
pm2 save
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root
```

### Process Management Commands
```bash
# Check status and CPU/RAM usage
pm2 status

# View live streaming logs
pm2 logs smartup-online-erp

# Gracefully reload without downtime
pm2 reload smartup-online-erp

# Restart process
pm2 restart smartup-online-erp
```

---

## 8. Nginx Reverse Proxy & SSL Configuration

Nginx handles edge traffic, redirects, and passes requests to the Next.js PM2 process.

**Config File:** `/etc/nginx/sites-available/smartup-online-erp`  
**Symlinked:** `/etc/nginx/sites-enabled/smartup-online-erp`

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    server_name smartuplearning.online www.smartuplearning.online _;

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        # Disable buffering for Next.js 16 Partial Prerendering and streaming
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

```bash
# Verify syntax and reload Nginx
nginx -t
systemctl reload nginx
```

---

## 9. Architecture Topology

```
                              INTERNET / CLIENTS
                                       │
                                       ▼
                   ┌───────────────────────────────────────┐
                   │    Cloudflare Edge Network (DDoS/CDN) │
                   │  - smartuplearning.online             │
                   │  - www.smartuplearning.online         │
                   │  - Edge SSL (Browser ↔ Cloudflare)    │
                   └───────────────────┬───────────────────┘
                                       │ HTTPS Port 443 (Full Mode)
                                       ▼
                   ┌───────────────────────────────────────┐
                   │   Hostinger VPS: 187.77.153.192       │
                   │   Ubuntu 26.04 LTS (16GB RAM)         │
                   │                                       │
                   │   Nginx Reverse Proxy (:80 / :443)    │
                   │   └─ Origin SSL Certificate           │
                   └───────────────────┬───────────────────┘
                                       │ Reverse Proxy (:3000)
                                       ▼
                   ┌───────────────────────────────────────┐
                   │   PM2: smartup-online-erp             │
                   │   Next.js 16.4.2 Production Server    │
                   │   Node.js 22.23.4 LTS                 │
                   └───────────────────┬───────────────────┘
                                       │ Server-to-Server API
                                       ▼
                   ┌───────────────────────────────────────┐
                   │      Frappe Cloud Backend             │
                   │      smartupedu.frappe.cloud          │
                   │      Online Batches / GCC / ERPNext   │
                   └───────────────────────────────────────┘
```

---

## 10. SSH Access Configuration

To connect directly to this VPS from your local development machine using an alias:

Add this block to your local `~/.ssh/config` (or `C:\Users\arjun\.ssh\config`):

```ssh-config
Host smartup-online
    HostName 187.77.153.192
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Then you can connect with:
```bash
ssh smartup-online
```

---

## 11. Quick Reference & Deployment Commands

### One-Line Production Update (Run from Local Terminal)
Whenever you push code changes to `main` on GitHub, run this single command to deploy the update onto the VPS:

```bash
ssh smartup-online "cd /var/www/smartup-online-erp && git pull origin main && npm ci && npm run build && pm2 reload smartup-online-erp"
```

### Server Health Checks
```bash
# Check PM2 process
ssh smartup-online "pm2 status"

# Check recent application logs
ssh smartup-online "pm2 logs smartup-online-erp --lines 50"

# Check Nginx status
ssh smartup-online "systemctl status nginx"

# Test local HTTP response
ssh smartup-online "curl -I http://127.0.0.1:3000"
```
