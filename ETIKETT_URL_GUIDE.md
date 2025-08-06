# Etikett-URL Parameter Guide

## 📋 Verfügbare URL-Parameter für Etiketten

### Basis-Parameter
| Parameter | Beschreibung | Beispielwert | Pflicht |
|-----------|--------------|--------------|---------|
| `etikettSrc` | URL zum Etikett-Bild | `https://example.com/label.png` | ✅ |
| `etikettTop` | Y-Position (vertikal) | `50` | ❌ |
| `etikettLeft` | X-Position (horizontal) | `30` | ❌ |
| `etikettScaleX` | Breiten-Skalierung | `1.2` | ❌ |
| `etikettScaleY` | Höhen-Skalierung | `1.2` | ❌ |
| `etikettRotation` | Rotation in Grad | `5` | ❌ |

## 🔗 Beispiel-URLs

### 1. Einfach - Nur Etikett-URL
```
https://konfigurator.domain.com/konfigurator?
bottle=bd75optima&
etikettSrc=https://example.com/mein-etikett.png
```

### 2. Vollständig - Mit Position und Skalierung
```
https://konfigurator.domain.com/konfigurator?
bottle=bd75optima&
cork=natur&
cap=gold&
wine=rot&
etikettSrc=https://example.com/mein-etikett.png&
etikettTop=50&
etikettLeft=30&
etikettScaleX=1.2&
etikettScaleY=1.2&
etikettRotation=5&
filename=meine-flasche&
customerId=123
```

### 3. URL-Encoding für spezielle Zeichen
```
https://konfigurator.domain.com/konfigurator?
etikettSrc=https%3A//example.com/etikett%20mit%20leerzeichen.png
```

## 📐 Wertebereiche

### Position
- **etikettTop**: `0` bis `400` (je nach Flaschengröße)
- **etikettLeft**: `0` bis `200` (je nach Flaschengröße)

### Skalierung
- **etikettScaleX**: `0.1` bis `3.0` (10% bis 300%)
- **etikettScaleY**: `0.1` bis `3.0` (10% bis 300%)

### Rotation
- **etikettRotation**: `-180` bis `180` Grad

## 🚀 Ninox-Integration

### Einfache Formel
```javascript
"https://konfigurator.domain.com/konfigurator?" +
"bottle=" + (Flaschentyp) +
"&etikettSrc=" + urlEncode(EtikettURL) +
"&customerId=" + text(Id)
```

### Vollständige Formel mit allen Parametern
```javascript
let baseUrl := "https://konfigurator.domain.com/konfigurator?";
let params := "bottle=" + (Flaschentyp) +
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
              "&customerId=" + text(Id);
baseUrl + params
```

### Mit Auto-Export
```javascript
"https://konfigurator.domain.com/konfigurator?" +
"bottle=" + (Flaschentyp) +
"&etikettSrc=" + urlEncode(EtikettURL) +
"&autoExport=true&" +
"customerId=" + text(Id)
```

## ⚠️ Wichtige Hinweise

### URL-Encoding
- **Immer nötig** für URLs mit Sonderzeichen
- **Ninox**: Verwenden Sie `urlEncode()` Funktion
- **JavaScript**: Verwenden Sie `encodeURIComponent()`

### Etikett-Dateiformate
- ✅ **PNG** (empfohlen für Transparenz)
- ✅ **JPG** (für Fotos)
- ✅ **SVG** (für Vektorgrafiken)
- ✅ **GIF** (für einfache Grafiken)

### CORS-Anforderungen
- Etikett-Server muss **CORS** erlauben
- Für lokale Tests: `Access-Control-Allow-Origin: *`
- Für Produktion: Spezifische Domain angeben

### Performance-Tipps
- **Bildgröße**: Max. 2MB für schnelles Laden
- **Dimensionen**: 200x150px bis 800x600px optimal
- **CDN**: Verwenden Sie CDN für bessere Performance

## 🧪 Testing

### Test-URLs (funktionsfähig)
```
# Mit Placeholder-Etikett:
http://localhost:3000/konfigurator?bottle=bd75optima&etikettSrc=https%3A//via.placeholder.com/200x150/FF6B6B/FFFFFF%3Ftext%3DTest%2BLabel

# Mit Position und Skalierung:
http://localhost:3000/konfigurator?bottle=bd75optima&etikettSrc=https%3A//via.placeholder.com/200x150&etikettTop=50&etikettLeft=30&etikettScaleX=1.2

# Mit Auto-Export:
http://localhost:3000/konfigurator?bottle=bd75optima&etikettSrc=https%3A//via.placeholder.com/200x150&autoExport=true
```

### JavaScript-Test im Browser
```javascript
// Test URL-Parameter parsen
const params = new URLSearchParams(window.location.search);
console.log('Etikett-URL:', decodeURIComponent(params.get('etikettSrc')));
console.log('Position:', params.get('etikettTop'), params.get('etikettLeft'));
console.log('Skalierung:', params.get('etikettScaleX'), params.get('etikettScaleY'));
```

## 🔧 Troubleshooting

### Etikett wird nicht angezeigt
1. **URL-Encoding** prüfen
2. **CORS-Einstellungen** des Bild-Servers prüfen
3. **Bildformat** unterstützt?
4. **Browser-Konsole** auf Fehler prüfen

### Position stimmt nicht
1. **Flaschentyp** beeinflusst Canvas-Größe
2. **Koordinaten** sind absolut, nicht relativ
3. **Skalierung** beeinflusst Endposition

### Performance-Probleme
1. **Bildgröße** reduzieren
2. **CDN** verwenden
3. **WebP-Format** für moderne Browser
