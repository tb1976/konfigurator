# VPS/Server Deployment Guide

## Server Requirements
- Node.js 18+ 
- PM2 für Process Management
- Nginx als Reverse Proxy
- Canvas Dependencies

## 1. Server Setup (Ubuntu/Debian)
```bash
# Canvas Dependencies installieren
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 installieren
sudo npm install -g pm2
```

## 2. Projekt auf Server deployen
```bash
# Projekt hochladen (FTP/Git)
git clone https://github.com/tb1976/konfigurator.git
cd konfigurator

# Dependencies installieren
npm install

# Build erstellen
npm run build

# PM2 Process starten
pm2 start npm --name "konfigurator" -- start
pm2 save
pm2 startup
```

## 3. Nginx Konfiguration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 4. SSL mit Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 5. Automatische Updates
```bash
# Deploy Script erstellen
#!/bin/bash
cd /path/to/konfigurator
git pull origin main
npm install
npm run build
pm2 restart konfigurator
```
