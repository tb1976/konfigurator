#!/bin/bash

# Netcup VPS Deployment Script für Konfigurator
# Ausführen mit: ./deploy.sh

echo "🚀 Deploying Konfigurator to Netcup VPS..."

# 1. Lokaler Build und Test
echo "📦 Building locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed!"
    exit 1
fi

# 2. Git Push
echo "📤 Pushing to Git..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

# 3. Server Deployment (SSH Commands)
echo "🔧 Deploying on server..."
ssh your-user@your-netcup-server.com << 'EOF'
    cd /var/www/konfigurator
    git pull origin main
    npm install --production
    npm run build
    pm2 restart konfigurator
    echo "✅ Deployment completed!"
EOF

echo "🎉 Konfigurator deployed successfully!"
echo "🌐 Available at: https://konfigurator.your-domain.com"
