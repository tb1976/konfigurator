# Vercel Deployment Guide für Flaschen-Konfigurator

## 🚀 Deployment-Schritte

### 1. Vorbereitung
- Repository auf GitHub pushen
- Vercel Account erstellen (falls noch nicht vorhanden)

### 2. Vercel Deployment

#### Option A: Über Vercel Dashboard
1. [Vercel Dashboard](https://vercel.com/dashboard) öffnen
2. "New Project" klicken
3. GitHub Repository importieren
4. Framework automatisch als "Next.js" erkannt
5. Deploy klicken

#### Option B: Über Vercel CLI
```bash
# Vercel CLI installieren
npm i -g vercel

# Im Projektordner
vercel

# Fragen beantworten:
# ? Set up and deploy "~/path/to/flaschen-konfigurator"? [Y/n] y
# ? Which scope do you want to deploy to? [Ihr Account]
# ? Link to existing project? [N/y] n
# ? What's your project's name? flaschen-konfigurator
# ? In which directory is your code located? ./
```

### 3. Automatische Konfiguration
- Build Command: `npm run build` (automatisch erkannt)
- Output Directory: `.next` (automatisch erkannt)
- Install Command: `npm install` (automatisch erkannt)

### 4. Environment Variables (falls benötigt)
Im Vercel Dashboard unter "Settings" > "Environment Variables":
```
NODE_ENV=production
```

## 🎯 Features die funktionieren

### ✅ Client-side Canvas
- Fabric.js läuft vollständig im Browser
- Etikett-Upload und -Bearbeitung
- Drag & Drop Funktionalität
- Export-Funktionen

### ✅ Responsive Design
- Mobile-optimiert
- Touch-Unterstützung
- Adaptive Sidebar

### ✅ Local Storage
- Entwürfe speichern
- Etikett-Historie
- Konfiguration merken

### ✅ Static Assets
- Alle Bilder in `/public/`
- Optimierte Bildauslieferung

## 🔧 Konfiguration Details

### Next.js für Vercel optimiert
- `output: 'standalone'` für bessere Performance
- Client-side Canvas ohne Server-Dependencies
- Optimierte Webpack-Konfiguration

### Canvas Dependencies entfernt
- Server-side `canvas` Package entfernt
- Nur Browser-basierte Canvas-APIs
- Fabric.js für clientseitige Bildbearbeitung

## 🌐 Nach dem Deployment

### URL-Struktur
```
https://ihr-projekt.vercel.app/
https://ihr-projekt.vercel.app/konfigurator/ninox/[recordId]
```

### API-Endpoints (falls benötigt)
```
/api/ninox/configuration/[recordId]
/api/ninox/export/[recordId]
```

## 📊 Performance Optimierungen

### Automatisch von Vercel
- Edge Network (CDN)
- Automatische Bildoptimierung
- Gzip-Kompression
- HTTP/2 Support

### Im Code implementiert
- Image lazy loading
- Component lazy loading
- Debounced updates
- Optimierte Bundle-Größe

## 🔍 Monitoring

### Vercel Analytics
- Automatisch verfügbar
- Performance Insights
- Error Tracking

### Console Logs
- Entwickler-Tools im Browser
- Vercel Function Logs (für API-Calls)

## 🚨 Troubleshooting

### Build Fehler
```bash
# Lokal testen
npm run build
```

### Canvas Probleme
- Fabric.js läuft nur client-side
- Browser-Kompatibilität prüfen
- CORS für externe Bilder beachten

### Memory Issues
- Bilder vor Upload komprimieren
- Canvas-Objekte nach Gebrauch disposed

## 🔄 Updates deployen

### Automatisch via Git
- Push zu `main` Branch
- Vercel deployed automatisch

### Manuell via CLI
```bash
vercel --prod
```

## 📱 Mobile Optimierungen

### Bereits implementiert
- Touch-Events für Canvas
- Responsive Sidebar
- Mobile-optimierte Gesten
- Viewport-optimierte Skalierung

## 🎨 Custom Domain (optional)

1. Vercel Dashboard > Projekt > "Domains"
2. Custom Domain hinzufügen
3. DNS-Records beim Domain-Provider setzen
4. SSL automatisch von Vercel

## 📈 Skalierung

### Vercel Limits (Hobby Plan)
- 100GB Bandwidth/Monat
- 10-second Function Timeout
- Unlimited Static Requests

### Pro Plan Features
- Mehr Bandwidth
- Längere Function Timeouts
- Team Collaboration
- Advanced Analytics
