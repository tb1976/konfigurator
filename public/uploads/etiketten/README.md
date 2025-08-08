# Upload Directory

Dieses Verzeichnis speichert hochgeladene Etiketten mit eindeutigen IDs.

## Struktur
- Jedes Etikett bekommt eine UUID als Dateiname
- Originalname wird nicht gespeichert (Sicherheit)
- Unterstützte Formate: PNG, JPG, JPEG, GIF, WEBP

## API Endpoints
- `POST /api/etikett/upload` - Upload neues Etikett
- `GET /api/etikett/[id]` - Etikett abrufen

## Cleanup
- TODO: Automatisches Löschen alter Dateien implementieren
- TODO: Rate Limiting für Uploads
