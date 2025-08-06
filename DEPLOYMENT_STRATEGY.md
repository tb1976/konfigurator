# Deployment Strategy: Separater Konfigurator

## 🎯 Empfohlene Architektur

### Konfigurator (Separat auf Vercel)
```
Domain: konfigurator.yourdomain.com
├── Public Routes (keine Auth)
│   ├── / (Hauptkonfigurator)
│   ├── /konfigurator/ninox/[id] (Ninox-Integration)
│   ├── /test-export (Testing)
│   └── /api/ninox/* (Ninox API)
│
├── Features
│   ├── ✅ Gastbenutzer erlaubt
│   ├── ✅ Ninox-Integration
│   ├── ✅ URL-Parameter
│   ├── ✅ Direkter Export
│   └── ✅ Embedding-fähig
│
└── Dependencies
    ├── Minimal (nur Konfigurator-spezifisch)
    ├── Keine Auth-Komplexität
    └── Optimiert für Performance
```

### Dashboard (Bestehend)
```
Domain: dashboard.yourdomain.com
├── Protected Routes (mit Auth)
│   ├── /dashboard/* (Admin-Bereich)
│   ├── /users/* (Benutzerverwaltung)
│   └── /settings/* (Einstellungen)
│
├── Konfigurator-Integration
│   ├── iframe: konfigurator.yourdomain.com
│   ├── Redirect: konfigurator.yourdomain.com/ninox/[id]
│   └── API: konfigurator.yourdomain.com/api/ninox/*
│
└── Vorteile
    ├── ✅ Saubere Trennung
    ├── ✅ Keine Sicherheitsrisiken
    ├── ✅ Einfache Wartung
    └── ✅ Flexible Integration
```

## 🔧 Integration ins Dashboard

### 1. iframe-Embedding
```jsx
// Dashboard: components/KonfiguratorEmbed.jsx
export function KonfiguratorEmbed({ recordId, config }) {
    const konfiguratorUrl = recordId 
        ? `https://konfigurator.yourdomain.com/konfigurator/ninox/${recordId}`
        : `https://konfigurator.yourdomain.com/konfigurator?${new URLSearchParams(config)}`;
    
    return (
        <iframe 
            src={konfiguratorUrl}
            width="100%" 
            height="800px"
            className="border rounded-lg"
            title="Flaschen-Konfigurator"
        />
    );
}
```

### 2. Redirect-Integration
```jsx
// Dashboard: Redirect zu Konfigurator
const openKonfigurator = (recordId) => {
    const url = `https://konfigurator.yourdomain.com/konfigurator/ninox/${recordId}?autoExport=true`;
    window.open(url, '_blank');
};
```

### 3. API-Integration
```jsx
// Dashboard: Nutze Konfigurator-API
const exportConfiguration = async (recordId) => {
    const response = await fetch(`https://konfigurator.yourdomain.com/api/ninox/export-simple/${recordId}`);
    const blob = await response.blob();
    // Download handling...
};
```

## 📦 Deployment Setup

### Konfigurator (Vercel)
```bash
# Neues Vercel-Projekt
git clone flaschen-konfigurator
cd flaschen-konfigurator
vercel --prod

# Domain Setup
Domain: konfigurator.yourdomain.com
Environment: Production
Build: next build && next export
```

### Environment Variables
```bash
# konfigurator.yourdomain.com
NINOX_API_KEY=xxx
NINOX_TEAM_ID=xxx  
NINOX_DATABASE_ID=xxx
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
```

### CORS Setup
```javascript
// next.config.js (Konfigurator)
module.exports = {
    async headers() {
        return [
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'https://dashboard.yourdomain.com'
                    }
                ]
            }
        ];
    }
};
```

## 🔐 Sicherheitskonzept

### Konfigurator (Public)
```javascript
// Keine sensiblen Daten
- Nur öffentliche Bilder
- Keine Benutzerdaten
- Temporäre Konfigurationen
- Ninox-Integration über Record-ID
```

### Dashboard (Protected)
```javascript
// Sensible Daten geschützt
- Benutzerverwaltung
- Ninox-Credentials (Server-side)
- Zahlungsdaten
- Admin-Funktionen
```

## 🚀 Vorteile der Trennung

### Performance
- ✅ Konfigurator: Optimiert für Gastbenutzer
- ✅ Dashboard: Optimiert für Admin-Tasks
- ✅ Separate CDN-Strategien
- ✅ Unabhängige Caching

### Wartung  
- ✅ Separate Repositories
- ✅ Unabhängige Deployments
- ✅ Verschiedene Update-Zyklen
- ✅ Isolierte Fehlerbehandlung

### Skalierung
- ✅ Konfigurator: Horizontal skalierbar
- ✅ Dashboard: Vertikal skalierbar  
- ✅ Verschiedene Hosting-Strategien
- ✅ Kostenoptimierung

### Flexibilität
- ✅ Dashboard-unabhängig nutzbar
- ✅ Multiple Dashboard-Integrationen
- ✅ White-Label-fähig
- ✅ API-first Architecture

## ⚡ Quick Start

### 1. Konfigurator-Repo vorbereiten
```bash
# Repository ist bereits verfügbar
git remote -v
# origin  https://github.com/tb1976/konfigurator.git (fetch)
# origin  https://github.com/tb1976/konfigurator.git (push)

# Lokale Änderungen committen
git add .
git commit -m "Add Ninox integration and deployment config"
git push origin main
```

### 2. Vercel Deployment
```bash
vercel login
vercel --prod
vercel domains add konfigurator.yourdomain.com

# Oder direkt mit GitHub-Integration:
# 1. Gehe zu vercel.com
# 2. "Import Git Repository"
# 3. Repository: https://github.com/tb1976/konfigurator.git
# 4. Framework: Next.js
# 5. Root Directory: ./
```

### 3. Dashboard-Integration
```jsx
// Dashboard: pages/konfigurator.jsx
import KonfiguratorEmbed from '@/components/KonfiguratorEmbed';

export default function KonfiguratorPage() {
    return (
        <div className="container mx-auto">
            <h1>Flaschen-Konfigurator</h1>
            <KonfiguratorEmbed />
        </div>
    );
}
```

## 📊 Entscheidungsmatrix

| Kriterium | Separat | Integriert |
|-----------|---------|------------|
| Sicherheit | ✅ Optimal | ⚠️ Komplex |
| Performance | ✅ Optimal | ⚠️ Mixed |
| Wartung | ✅ Einfach | ❌ Komplex |
| Gastbenutzer | ✅ Nativ | ⚠️ Auth-Bypass |
| Deployment | ✅ Unabhängig | ❌ Gekoppelt |
| Skalierung | ✅ Flexibel | ❌ Limitiert |
| **EMPFEHLUNG** | **🎯 JA** | **❌ NEIN** |
