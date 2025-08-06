# 🍷 Flaschen-Konfigurator

Ein interaktiver Web-Konfigurator zum Erstellen und Konfigurieren von Weinflaschen mit direkter Ninox-Datenbank-Integration.

## 🚀 Live Demo

- **Repository**: [https://github.com/tb1976/konfigurator.git](https://github.com/tb1976/konfigurator.git)
- **Live URL**: `https://konfigurator.yourdomain.com` (nach Deployment)

## ✨ Features

- 🎨 **Interaktiver Konfigurator** - Drag & Drop Etikett-Editor
- 📱 **Responsive Design** - Funktioniert auf Desktop und Mobile
- 🔗 **Ninox Integration** - Direkte Datenbank-Anbindung
- 📤 **Auto-Export** - Automatischer Bild-Download
- 🌐 **URL-Parameter** - Vorkonfigurierte Links
- 🎯 **Gastbenutzer** - Keine Anmeldung erforderlich
- 🔧 **API-Ready** - REST-Endpoints für Integration

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Styling**: TailwindCSS
- **Canvas**: Fabric.js
- **Database**: Ninox API
- **Deployment**: Vercel
- **Language**: JavaScript/JSX

## 📦 Installation

```bash
# Repository klonen
git clone https://github.com/tb1976/konfigurator.git
cd konfigurator

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

## 🔧 Environment Setup

Erstellen Sie eine `.env.local` Datei:

```bash
# Ninox API Credentials
NINOX_API_KEY=your_ninox_api_key_here
NINOX_TEAM_ID=your_team_id_here
NINOX_DATABASE_ID=your_database_id_here
NINOX_TABLE_NAME=Flaschen

# URLs
NEXT_PUBLIC_KONFIGURATOR_URL=https://konfigurator.yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
```

## 🚀 Vercel Deployment

### Automatisches Deployment

1. **Vercel Account** erstellen: [vercel.com](https://vercel.com)
2. **Import Repository**: `https://github.com/tb1976/konfigurator.git`
3. **Framework**: Next.js
4. **Environment Variables** hinzufügen (siehe oben)
5. **Deploy** klicken

### CLI Deployment

```bash
# Vercel CLI installieren
npm i -g vercel

# Login
vercel login

# Deployment
vercel --prod

# Custom Domain (optional)
vercel domains add konfigurator.yourdomain.com
```

## 📚 Verwendung

### 1. Direkter Zugriff
```
https://konfigurator.yourdomain.com/
```

### 2. URL-Parameter
```
https://konfigurator.yourdomain.com/konfigurator?
bottle=bd75optima&
cork=natur&
cap=gold&
wine=rot&
etikettSrc=https://example.com/label.png&
filename=meine-flasche
```

### 3. Ninox-Integration
```javascript
// In Ninox-Formel:
"https://konfigurator.yourdomain.com/konfigurator/ninox/" + text(Id)
```

### 4. Auto-Export
```
https://konfigurator.yourdomain.com/konfigurator/ninox/123?autoExport=true
```

## 🔌 API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/ninox/configuration/[id]` | GET | Konfiguration laden |
| `/api/ninox/configuration/[id]` | PUT | Konfiguration speichern |
| `/api/ninox/export-simple/[id]` | GET | Bild exportieren |
| `/api/ninox/export-simple/[id]` | POST | Custom Export |

## 🧪 Testing

### Test-Seite
```
http://localhost:3000/test-export
```

### Manuelle Tests
```bash
# 1. URL-Parameter
http://localhost:3000/konfigurator?bottle=bd75optima&cork=natur

# 2. Ninox Record
http://localhost:3000/konfigurator/ninox/test-123

# 3. Auto-Export
http://localhost:3000/konfigurator/ninox/test-123?autoExport=true
```

## 📖 Dokumentation

- **[Ninox Integration](./NINOX_INTEGRATION.md)** - Vollständige Ninox-Dokumentation
- **[Etikett URL Guide](./ETIKETT_URL_GUIDE.md)** - URL-Parameter für Etiketten
- **[Deployment Strategy](./DEPLOYMENT_STRATEGY.md)** - Deployment-Optionen

---

Entwickelt mit ❤️ für moderne Weinflaschenkonfiguration
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Vercel Deployment Test
