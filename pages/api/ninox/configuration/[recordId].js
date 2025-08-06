// pages/api/ninox/configuration/[recordId].js
// API-Route für Ninox Integration

import { createNinoxApiIntegration } from '@/lib/ninoxIntegration';

export default async function handler(req, res) {
    const { recordId } = req.query;
    
    // Ninox API Konfiguration (aus Umgebungsvariablen)
    const ninoxApi = createNinoxApiIntegration(
        process.env.NINOX_API_KEY,
        process.env.NINOX_TEAM_ID, 
        process.env.NINOX_DATABASE_ID
    );
    
    if (req.method === 'GET') {
        try {
            // Lade Datensatz aus Ninox und konvertiere zu Konfigurator-Format
            const konfiguratorUrl = await ninoxApi.getKonfiguratorUrl(
                recordId, 
                `${req.headers.origin}/konfigurator`
            );
            
            // Lade auch die Raw-Daten für direkten API-Zugriff
            const response = await fetch(`https://api.ninox.com/v1/teams/${process.env.NINOX_TEAM_ID}/databases/${process.env.NINOX_DATABASE_ID}/tables/Flaschen/records/${recordId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.NINOX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                return res.status(404).json({ error: 'Datensatz nicht gefunden' });
            }
            
            const ninoxRecord = await response.json();
            
            // Konvertiere zu Konfigurator-Format
            const configuration = {
                recordId: recordId,
                flasche: mapNinoxValue(ninoxRecord.fields.Flaschentyp, 'flasche'),
                korken: mapNinoxValue(ninoxRecord.fields.Korken, 'korken'),
                kapsel: mapNinoxValue(ninoxRecord.fields.Kapsel, 'kapsel'),
                weinfarbe: mapNinoxValue(ninoxRecord.fields.Weinfarbe, 'weinfarbe'),
                customColor: ninoxRecord.fields.Benutzerdefinierte_Farbe,
                etikett: ninoxRecord.fields.Etikett_URL ? {
                    src: ninoxRecord.fields.Etikett_URL,
                    top: ninoxRecord.fields.Etikett_Position_Y || 0,
                    left: ninoxRecord.fields.Etikett_Position_X || 0,
                    scaleX: ninoxRecord.fields.Etikett_Skalierung_X || 1,
                    scaleY: ninoxRecord.fields.Etikett_Skalierung_Y || 1,
                    rotation: ninoxRecord.fields.Etikett_Rotation || 0
                } : null,
                weinSettings: {
                    opacity: ninoxRecord.fields.Wein_Transparenz || 1.0,
                    contrast: ninoxRecord.fields.Wein_Kontrast || 1.5,
                    blendMode: ninoxRecord.fields.Wein_Blend_Modus || 'multiply'
                },
                shareUrl: konfiguratorUrl,
                ninoxData: ninoxRecord.fields // Original Ninox Daten für Referenz
            };
            
            res.status(200).json({
                success: true,
                configuration,
                urls: {
                    konfigurator: konfiguratorUrl,
                    direct: `${req.headers.origin}/konfigurator/ninox/${recordId}`
                }
            });
            
        } catch (error) {
            console.error('Ninox API Fehler:', error);
            res.status(500).json({ 
                error: 'Fehler beim Laden der Konfiguration',
                details: error.message 
            });
        }
    } 
    else if (req.method === 'PUT') {
        try {
            // Speichere Konfiguration zurück in Ninox
            const configuration = req.body;
            const result = await ninoxApi.saveConfiguration(recordId, configuration);
            
            res.status(200).json({
                success: true,
                message: 'Konfiguration in Ninox gespeichert',
                ninoxRecord: result
            });
            
        } catch (error) {
            console.error('Ninox Speicher-Fehler:', error);
            res.status(500).json({ 
                error: 'Fehler beim Speichern in Ninox',
                details: error.message 
            });
        }
    } 
    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

// Hilfsfunktion für Werte-Mapping
function mapNinoxValue(ninoxValue, paramType) {
    const mappings = {
        flasche: {
            'Bordeaux 0.75L Optima': 'bd75optima',
            'Bordeaux 0.75L Prestige': 'bd75prestige', 
            'Burgunder 0.75L Optima': 'bg75optima',
            'Paris 0.75L': 'paris75'
        },
        korken: {
            'Natur': 'natur',
            'Natur 2': 'natur2', 
            'Mikrogranulat': 'mikro',
            'Branded': 'brand'
        },
        kapsel: {
            'Keine': 'keine',
            'Silber': 'silber',
            'Gold': 'gold',
            'Kupfer': 'kupfer',
            'Schwarz Matt': 'schwMatt',
            'Blau': 'blau',
            'Rot': 'rot',
            'Weiß': 'weiss'
        },
        weinfarbe: {
            'Weißwein': 'weiss',
            'Rosé': 'rose',
            'Rotwein Hell': 'rotHell',
            'Rotwein Dunkel': 'rotDunkel',
            'Benutzerdefiniert': 'custom'
        }
    };
    
    return mappings[paramType]?.[ninoxValue] || ninoxValue;
}
