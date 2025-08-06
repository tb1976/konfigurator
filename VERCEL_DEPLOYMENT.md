# 🚀 Vercel Deployment Guide

Schritt-für-Schritt Anleitung für das Deployment auf Vercel.

## 📋 Vorbereitung

### 1. Repository Status prüfen
```bash
# Aktueller Remote
git remote -v
# origin  https://github.com/tb1976/konfigurator.git (fetch)
# origin  https://github.com/tb1976/konfigurator.git (push)

# Alle Änderungen committen
git add .
git commit -m "Add Ninox integration and deployment config"
git push origin main
```

### 2. Ninox API-Credentials beschaffen
- **Ninox Admin-Panel** öffnen
- **Settings → API → Create new API Key**
- **Team ID** und **Database ID** aus URL notieren
- **API Key** sicher aufbewahren

## 🌐 Vercel Setup

### Option A: Web-Interface (Empfohlen)

#### 1. Vercel Account
1. Gehe zu [vercel.com](https://vercel.com)
2. **Sign up** mit GitHub-Account
3. **Import Git Repository** klicken

#### 2. Repository Import
```
Repository URL: https://github.com/tb1976/konfigurator.git
Framework Preset: Next.js
Root Directory: ./
```

#### 3. Environment Variables
```bash
# In Vercel Settings → Environment Variables
NINOX_API_KEY=your_ninox_api_key_here
NINOX_TEAM_ID=your_team_id_here
NINOX_DATABASE_ID=your_database_id_here
NINOX_TABLE_NAME=Flaschen
NEXT_PUBLIC_KONFIGURATOR_URL=https://your-vercel-domain.vercel.app
```

#### 4. Deploy
- **Deploy** Button klicken
- **Warten** auf Build-Completion
- **Domain** notieren (z.B. `konfigurator-xyz.vercel.app`)

### Option B: CLI Deployment

```bash
# Vercel CLI installieren
npm i -g vercel

# Login
vercel login

# Initial Setup
vercel

# Production Deployment
vercel --prod
```

## 🔧 Domain-Konfiguration

### Custom Domain hinzufügen

#### Via Web-Interface
1. **Vercel Dashboard** → Ihr Projekt
2. **Settings** → **Domains**
3. **Add Domain**: `konfigurator.yourdomain.com`
4. **DNS-Records** bei Domain-Provider setzen

#### Via CLI
```bash
vercel domains add konfigurator.yourdomain.com
```

### DNS-Konfiguration
```dns
# Bei Ihrem Domain-Provider (z.B. Cloudflare, GoDaddy)
CNAME konfigurator cname.vercel-dns.com
```

## ⚙️ Environment Variables

### Produktions-Environment
```bash
# Vercel Dashboard → Settings → Environment Variables
NINOX_API_KEY=prod_api_key_here
NINOX_TEAM_ID=your_team_id
NINOX_DATABASE_ID=your_database_id
NINOX_TABLE_NAME=Flaschen
NEXT_PUBLIC_KONFIGURATOR_URL=https://konfigurator.yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
ALLOWED_ORIGINS=https://dashboard.yourdomain.com,https://yourdomain.com
```

### Development-Environment
```bash
# .env.local (lokal)
NINOX_API_KEY=dev_api_key_here
NINOX_TEAM_ID=your_team_id
NINOX_DATABASE_ID=your_database_id
NINOX_TABLE_NAME=Flaschen
NEXT_PUBLIC_KONFIGURATOR_URL=http://localhost:3000
```

## 🔍 Deployment-Verification

### 1. Build-Logs prüfen
```
Vercel Dashboard → Deployments → Latest → View Function Logs
```

### 2. Test-URLs
```bash
# Basis-Konfigurator
https://konfigurator.yourdomain.com/

# Test-Seite
https://konfigurator.yourdomain.com/test-export

# API-Test
https://konfigurator.yourdomain.com/api/ninox/configuration/test-123
```

### 3. Ninox-Integration testen
```javascript
// In Ninox-Formel testen:
"https://konfigurator.yourdomain.com/konfigurator/ninox/" + text(Id)
```

## 🔧 Troubleshooting

### Build-Fehler

#### "Module not found"
```bash
# Lokaler Test
npm install
npm run build

# Package.json prüfen
cat package.json
```

#### "API Routes nicht erreichbar"
```bash
# Vercel Functions aktiviert?
# vercel.json prüfen
cat vercel.json
```

### Environment-Probleme

#### API-Keys nicht verfügbar
```bash
# Vercel Dashboard → Settings → Environment Variables
# Alle Keys vorhanden?
# Production und Preview Environment?
```

#### CORS-Fehler
```bash
# next.config.js prüfen
# ALLOWED_ORIGINS Environment Variable gesetzt?
```

### Domain-Probleme

#### Domain nicht erreichbar
```bash
# DNS-Propagation prüfen
nslookup konfigurator.yourdomain.com

# Vercel-Domain funktioniert?
curl https://your-project.vercel.app
```

## 📊 Performance-Optimierung

### Vercel-Analytics aktivieren
```bash
# Vercel Dashboard → Analytics → Enable
# Web Vitals tracking
# Performance insights
```

### Caching-Strategie
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

## 🔄 Continuous Deployment

### GitHub-Integration
```bash
# Automatisches Deployment bei Push
git push origin main
# → Vercel deployed automatisch

# Branch-Previews
git checkout -b feature/new-feature
git push origin feature/new-feature
# → Vercel erstellt Preview-URL
```

### Environment-spezifische Branches
```bash
# Production: main branch
# Staging: staging branch  
# Development: dev branch
```

## 📈 Monitoring

### Vercel-Dashboard
- **Analytics** → Performance-Metriken
- **Functions** → API-Performance
- **Domains** → SSL-Status
- **Deployments** → Build-Historie

### Error-Tracking
```javascript
// Vercel automatisches Error-Tracking
// Sentry-Integration möglich
// Custom Error-Boundary
```

## 🔐 Security

### HTTPS-Enforcement
```javascript
// Automatisch durch Vercel
// SSL-Zertifikate automatisch erneuert
// HSTS-Header aktiviert
```

### API-Security
```javascript
// Environment Variables sicher
// API-Keys nie im Frontend
// CORS richtig konfiguriert
```

## 📞 Support

### Vercel-Support
- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel](https://github.com/vercel/vercel)
- **Discord**: [vercel.com/discord](https://vercel.com/discord)

### Projekt-spezifisch
- **Repository**: [github.com/tb1976/konfigurator](https://github.com/tb1976/konfigurator)
- **Issues**: GitHub Issues verwenden
- **Dokumentation**: `./NINOX_INTEGRATION.md`

---

**Status**: ✅ Production-Ready  
**Last Updated**: August 2025  
**Vercel Plan**: Hobby/Pro empfohlen
