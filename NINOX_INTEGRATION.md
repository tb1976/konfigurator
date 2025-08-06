# Ninox Database Integration

Dieser Konfigurator kann direkt mit Ninox-Datenbanken integriert werden. Die Integration ermöglicht es, Flaschen-Konfigurationen direkt aus Ninox heraus zu öffnen und Änderungen zurück zu speichern.

## Setup

### 1. Environment Variables
Kopieren Sie `.env.local` und füllen Sie die Ninox-Credentials aus:

```bash
NINOX_API_KEY=your_ninox_api_key_here
NINOX_TEAM_ID=your_team_id_here  
NINOX_DATABASE_ID=your_database_id_here
NINOX_TABLE_NAME=Flaschen
```

### 2. Ninox API Key erhalten
1. In Ninox: Settings → API → Create new API Key
2. Notieren Sie Team ID und Database ID aus der URL
3. Tragen Sie die Werte in `.env.local` ein

## Usage

### Aus Ninox heraus öffnen

#### Option 1: URL-Parameter (Einfach)
```javascript
// In einer Ninox-Formel:
"https://your-domain.com/konfigurator?" + 
"bottle=" + (Flaschentyp) +
"&cork=" + (Korkentyp) +
"&cap=" + (Kapseltyp) +
"&wine=" + (Weinfarbe) +
"&etikettSrc=" + urlEncode(EtikettURL) +
"&filename=" + (Dateiname) +
"&customerId=" + (Id)
```

#### Option 1b: URL-Parameter mit Etikett-Position
```javascript
// Vollständige Etikett-Konfiguration:
"https://your-domain.com/konfigurator?" + 
"bottle=" + (Flaschentyp) +
"&cork=" + (Korkentyp) +
"&cap=" + (Kapseltyp) +
"&wine=" + (Weinfarbe) +
"&etikettSrc=" + urlEncode(EtikettURL) +
"&etikettTop=" + (EtikettPositionY) +
"&etikettLeft=" + (EtikettPositionX) +
"&etikettScaleX=" + (EtikettBreite) +
"&etikettScaleY=" + (EtikettHoehe) +
"&etikettRotation=" + (EtikettRotation) +
"&filename=" + (Dateiname) +
"&customerId=" + (Id)
```

#### Option 2: Ninox Record ID (Empfohlen)
```javascript
// In einer Ninox-Formel:
"https://your-domain.com/konfigurator/ninox/" + (Id)
```

#### Option 3: Dashboard Integration
```javascript
// Für eingebettete Darstellung:
"https://your-domain.com/konfigurator?mode=dashboard&customerId=" + (Id) + 
"&bottle=" + (Flaschentyp) + "&cork=" + (Korkentyp) + "&cap=" + (Kapseltyp)
```

### Field Mapping

Die folgenden Ninox-Felder werden automatisch gemappt:

| Ninox Feld | Konfigurator | Werte |
|------------|--------------|-------|
| `Flaschentyp` | bottle | bd75optima, bd75prestige, bg75optima, paris75 |
| `Korkentyp` | cork | natur, natur2, mikro, brand |
| `Kapseltyp` | cap | gold, silber, kupfer, blau, rot, schwarz, weiss, keine |
| `Weinfarbe` | wine | weiss, rose, rot |
| `EtikettURL` | etikettSrc | Vollständige URL zum Etikett-Bild |
| `EtikettPositionX` | etikettLeft | X-Position des Etiketts (0-200) |
| `EtikettPositionY` | etikettTop | Y-Position des Etiketts (0-400) |
| `EtikettBreite` | etikettScaleX | Breiten-Skalierung (0.1-3.0) |
| `EtikettHoehe` | etikettScaleY | Höhen-Skalierung (0.1-3.0) |
| `EtikettRotation` | etikettRotation | Rotation in Grad (-180 bis 180) |
| `Dateiname` | filename | Gewünschter Export-Dateiname (ohne Endung) |
| `KonfiguratorURL` | - | Automatisch generiert |

### API Endpoints

#### GET `/api/ninox/configuration/[recordId]`
Lädt eine Konfiguration aus Ninox:
```javascript
const response = await fetch('/api/ninox/configuration/123');
const data = await response.json();
// { configuration: { bottle: "bd75optima", cork: "natur", ... } }
```

#### PUT `/api/ninox/configuration/[recordId]`
Speichert eine Konfiguration nach Ninox:
```javascript
await fetch('/api/ninox/configuration/123', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        bottle: "bd75optima",
        cork: "natur",
        cap: "gold",
        wine: "rot"
    })
});
```

#### GET `/api/ninox/export/[recordId]`
Exportiert die Konfiguration direkt als Bild:
```javascript
// Lädt Konfiguration und exportiert als PNG
const response = await fetch('/api/ninox/export/123');
const blob = await response.blob();

// Als Download anbieten
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'meine-flasche.png';
a.click();
```

#### POST `/api/ninox/export/[recordId]`
Exportiert mit benutzerdefinierten Einstellungen:
```javascript
await fetch('/api/ninox/export/123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        format: 'png',           // png, jpg, pdf
        quality: 0.9,           // 0.1-1.0 für jpg
        width: 800,             // Export-Breite
        height: 1200,           // Export-Höhe
        filename: 'custom-name'  // Optional: Dateiname überschreiben
    })
});
```

## Ninox Formulas

### URL für Konfigurator generieren
```javascript
let url := "https://your-domain.com/konfigurator/ninox/" + text(Id);
url
```

### Vollständige URL mit Parametern
```javascript
let baseUrl := "https://your-domain.com/konfigurator?";
let params := "bottle=" + Flaschentyp + 
              "&cork=" + Korkentyp + 
              "&cap=" + Kapseltyp + 
              "&wine=" + Weinfarbe +
              "&customerId=" + text(Id);
baseUrl + params
```

### Button in Ninox
```javascript
// Öffnet Konfigurator in neuem Tab
openUrl("https://your-domain.com/konfigurator/ninox/" + text(Id))
```

## Troubleshooting

### API Key Probleme
- Prüfen Sie ob der API Key korrekt ist
- Team ID und Database ID müssen exakt stimmen
- API Key muss Lese- und Schreibrechte haben

### Field Mapping
- Feldnamen in Ninox müssen exakt übereinstimmen
- Custom Mapping über `NINOX_FIELD_MAPPING` möglich
- Debugging über Browser Console möglich

### Network Errors
- CORS-Einstellungen prüfen
- SSL-Zertifikat bei HTTPS erforderlich
- Firewall-Einstellungen prüfen

## Examples

### 1. Einfache Integration
```javascript
// Ninox Formel für Button:
openUrl("https://konfigurator.domain.com/konfigurator/ninox/" + text(Id))
```

### 2. Dashboard Embedding
```html
<!-- In Ninox HTML View -->
<iframe src="https://konfigurator.domain.com/konfigurator?mode=dashboard&customerId=123&bottle=bd75optima">
</iframe>
```

### 3. Automatische URL-Generierung
```javascript
// Ninox computed field "KonfiguratorURL":
"https://konfigurator.domain.com/konfigurator?" + 
"bottle=" + (Flaschentyp) +
"&cork=" + (Korkentyp) +
"&cap=" + (Kapseltyp) +
"&wine=" + (Weinfarbe) +
"&filename=" + (Dateiname) +
"&customerId=" + text(Id)
```

### 4. Auto-Export URL
```javascript
// Für direkten Bild-Download:
"https://konfigurator.domain.com/konfigurator/ninox/" + text(Id) + "?autoExport=true"
```

### 5. API-basierter Export
```javascript
// Direkte API-Nutzung in Ninox:
let exportUrl := "https://konfigurator.domain.com/api/ninox/export-simple/" + text(Id);
openUrl(exportUrl)
```

### 6. Vollständige URL mit Etikett
```javascript
// Ninox Formel mit Etikett-URL:
let baseUrl := "https://konfigurator.domain.com/konfigurator?";
let params := "bottle=" + (Flaschentyp) + 
              "&cork=" + (Korkentyp) + 
              "&cap=" + (Kapseltyp) + 
              "&wine=" + (Weinfarbe) +
              "&etikettSrc=" + urlEncode(EtikettURL) +
              "&filename=" + (Dateiname) +
              "&customerId=" + text(Id);
baseUrl + params
```

## Deployment

### Repository
```
GitHub: https://github.com/tb1976/konfigurator.git
Live Demo: https://konfigurator.yourdomain.com (nach Vercel-Setup)
```

### Vercel Deployment
1. **Vercel Account** erstellen/anmelden
2. **Import Repository**: `https://github.com/tb1976/konfigurator.git`
3. **Framework**: Next.js auswählen
4. **Environment Variables** setzen:
   ```
   NINOX_API_KEY=your_api_key
   NINOX_TEAM_ID=your_team_id
   NINOX_DATABASE_ID=your_database_id
   ```
5. **Deploy** klicken

### Domain Setup
```bash
# Custom Domain in Vercel hinzufügen
vercel domains add konfigurator.yourdomain.com
```

## Testing

### Test-Seite aufrufen
```
http://localhost:3000/test-export
```

Die Test-Seite bietet folgende Funktionen:
- ✅ Direct Export API testen
- ✅ Ninox Integration testen
- ✅ Image Export testen
- ✅ Test-Konfigurator öffnen

### Manuelle Tests
```javascript
// 1. Test mit URL-Parametern
http://localhost:3000/konfigurator?bottle=bd75optima&cork=natur&cap=gold&wine=rot&filename=test-flasche

// 2. Test mit Ninox Record ID
http://localhost:3000/konfigurator/ninox/test-123

// 3. Test mit Auto-Export
http://localhost:3000/konfigurator/ninox/test-123?autoExport=true

// 4. Test API Export
curl http://localhost:3000/api/ninox/export-simple/test-123
```

## Security

- API Keys niemals in Frontend-Code einbetten
- Environment Variables für Production verwenden
- HTTPS für Produktionsumgebung erforderlich
- API Rate Limits beachten
