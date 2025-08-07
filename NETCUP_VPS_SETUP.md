# Netcup VPS Setup für Canvas-Projekt

## 1. Canvas Dependencies installieren
```bash
# Auf Ihrem Netcup VPS:
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Falls Node.js fehlt oder zu alt ist:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 installieren (falls noch nicht vorhanden)
sudo npm install -g pm2
```

## 2. Projekt auf VPS deployen
```bash
# In einem separaten Verzeichnis
cd /var/www
sudo mkdir konfigurator
sudo chown $USER:$USER konfigurator
cd konfigurator

# Projekt hochladen (Git oder FTP)
git clone https://github.com/tb1976/konfigurator.git .
# oder per FTP/SCP hochladen

# Dependencies installieren
npm install

# Environment Variables erstellen
cp .env.example .env.local
# Bearbeiten Sie .env.local mit Ihren Ninox API Daten

# Build erstellen
npm run build

# PM2 Process starten (auf anderem Port als Zammad)
pm2 start npm --name "konfigurator" -- start -- -p 3001
pm2 save
```

## 3. Nginx Konfiguration erweitern
```nginx
# Neue Server Block in /etc/nginx/sites-available/konfigurator
server {
    listen 80;
    server_name konfigurator.your-domain.com;  # Subdomain für Konfigurator

    location / {
        proxy_pass http://localhost:3001;  # Port 3001 für Konfigurator
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Für große Canvas-Exports
        client_max_body_size 10M;
        proxy_read_timeout 60s;
    }
}

# Site aktivieren
sudo ln -s /etc/nginx/sites-available/konfigurator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. SSL Zertifikat für Subdomain
```bash
sudo certbot --nginx -d konfigurator.your-domain.com
```

## 5. Automatische Updates einrichten
```bash
# Deploy Script erstellen
sudo nano /home/deploy-konfigurator.sh

#!/bin/bash
cd /var/www/konfigurator
git pull origin main
npm install
npm run build
pm2 restart konfigurator

# Ausführbar machen
sudo chmod +x /home/deploy-konfigurator.sh
```

## 6. Systemd Service (Alternative zu PM2)
```bash
# Falls Sie systemd bevorzugen
sudo nano /etc/systemd/system/konfigurator.service

[Unit]
Description=Konfigurator Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/konfigurator
ExecStart=/usr/bin/npm start -- -p 3001
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target

# Service aktivieren
sudo systemctl enable konfigurator
sudo systemctl start konfigurator
```
