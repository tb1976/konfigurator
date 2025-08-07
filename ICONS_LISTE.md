# Icon-Liste für den Konfigurator

## Benötigte Icons (24x24px PNG, transparent)

### Bereits vorhanden:
- ✅ `bottle.png` - Flasche
- ✅ `cork.png` - Korken  
- ✅ `capsule.png` - Kapsel
- ✅ `label.png` - Etikett

### Noch zu erstellen:
- ⏳ `wine.png` - Weinfarbe/Weinglas
- ⏳ `drafts.png` - Entwürfe (Dokument/Ordner)
- ⏳ `export.png` - Export (Download-Pfeil)
- ⏳ `help.png` - Hilfe (Fragezeichen)

## Design-Empfehlungen:

### Stil:
- **Größe**: 24x24px optimal (skaliert gut auf 16px und 32px)
- **Format**: PNG mit transparentem Hintergrund
- **Stil**: Einfach, minimalistisch, gut erkennbar
- **Farbe**: Grau/Schwarz oder einfarbig (wird via CSS eingefärbt)

### Icon-Bedeutungen:
- **wine.png**: Weinglas oder Tropfen für Weinfarbe
- **drafts.png**: Gestapelte Dokumente oder Ordner für Entwürfe
- **export.png**: Pfeil nach unten oder Share-Symbol für Export
- **help.png**: Fragezeichen oder Info-Symbol für Hilfe

### Konsistenz:
- Alle Icons sollten ähnlichen Stil haben
- Gleiche Strichstärke
- Ähnliche Detailgrade
- Einheitliche Ausrichtung im 24x24px Raster

## Installation:
Legen Sie die neuen PNG-Dateien in `/public/icons/` ab:
```
/public/icons/
├── bottle.png    ✅
├── cork.png      ✅  
├── capsule.png   ✅
├── label.png     ✅
├── wine.png      ⏳
├── drafts.png    ⏳
├── export.png    ⏳
└── help.png      ⏳
```

## Fallback:
Falls ein Icon nicht geladen werden kann, wird es ausgeblendet. Das System ist robust gegen fehlende Icons.
