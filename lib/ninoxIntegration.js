// lib/ninoxIntegration.js
// Integration mit Ninox Datenbank über URL-Parameter

/**
 * Generiert eine Konfigurator-URL aus Ninox Datensatz
 * @param {Object} ninoxRecord - Der Datensatz aus Ninox
 * @param {string} baseUrl - Basis URL des Konfigurators
 * @returns {string} - Vollständige URL für den vorkonfigurierten Konfigurator
 */
export function generateKonfiguratorUrlFromNinox(ninoxRecord, baseUrl = 'https://yourdomain.com/konfigurator') {
    const params = new URLSearchParams();
    
    // Ninox Felder zu Konfigurator Parameter Mapping
    const fieldMapping = {
        // Ninox Feldname -> Konfigurator Parameter
        'Flaschentyp': 'flasche',
        'Korken': 'korken', 
        'Kapsel': 'kapsel',
        'Weinfarbe': 'weinfarbe',
        'Benutzerdefinierte_Farbe': 'customColor',
        'Etikett_URL': 'etikettSrc',
        'Etikett_Position_X': 'etikettLeft',
        'Etikett_Position_Y': 'etikettTop',
        'Etikett_Skalierung_X': 'etikettScaleX',
        'Etikett_Skalierung_Y': 'etikettScaleY',
        'Etikett_Rotation': 'etikettRotation',
        'Dateiname': 'filename',
        'Kunden_ID': 'customerId'
    };
    
    // Werte-Mapping für Ninox zu Konfigurator
    const valueMapping = {
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
    
    // Parameter aus Ninox Record extrahieren und mappen
    Object.entries(fieldMapping).forEach(([ninoxField, paramName]) => {
        if (ninoxRecord[ninoxField] !== undefined && ninoxRecord[ninoxField] !== null && ninoxRecord[ninoxField] !== '') {
            let value = ninoxRecord[ninoxField];
            
            // Wert durch Mapping konvertieren falls vorhanden
            if (valueMapping[paramName] && valueMapping[paramName][value]) {
                value = valueMapping[paramName][value];
            }
            
            // URL-enkodieren für spezielle Parameter
            if (paramName === 'etikettSrc' || paramName === 'customColor') {
                value = encodeURIComponent(value);
            }
            
            params.set(paramName, value);
        }
    });
    
    // Spezielle Behandlung für Wein-Einstellungen
    if (ninoxRecord['Wein_Transparenz'] || ninoxRecord['Wein_Kontrast'] || ninoxRecord['Wein_Blend_Modus']) {
        const weinSettings = {
            opacity: ninoxRecord['Wein_Transparenz'] || 1.0,
            contrast: ninoxRecord['Wein_Kontrast'] || 1.5,
            blendMode: ninoxRecord['Wein_Blend_Modus'] || 'multiply'
        };
        params.set('weinSettings', encodeURIComponent(JSON.stringify(weinSettings)));
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Ninox Formel für URL-Generierung (Copy-Paste in Ninox)
 * Erstellen Sie ein Formel-Feld in Ninox mit diesem Code:
 */
export const ninoxFormula = `
"https://yourdomain.com/konfigurator?" + 
if Flaschentyp then "flasche=" + 
    switch Flaschentyp do
    case "Bordeaux 0.75L Optima": "bd75optima"
    case "Bordeaux 0.75L Prestige": "bd75prestige"  
    case "Burgunder 0.75L Optima": "bg75optima"
    case "Paris 0.75L": "paris75"
    default: ""
    end + "&"
else "" end +
if Korken then "korken=" + 
    switch Korken do
    case "Natur": "natur"
    case "Natur 2": "natur2"
    case "Mikrogranulat": "mikro" 
    case "Branded": "brand"
    default: ""
    end + "&"
else "" end +
if Kapsel then "kapsel=" + 
    switch Kapsel do
    case "Keine": "keine"
    case "Silber": "silber"
    case "Gold": "gold"
    case "Kupfer": "kupfer"
    case "Schwarz Matt": "schwMatt"
    case "Blau": "blau"
    case "Rot": "rot"
    case "Weiß": "weiss"
    default: ""
    end + "&"
else "" end +
if Weinfarbe then "weinfarbe=" + 
    switch Weinfarbe do
    case "Weißwein": "weiss"
    case "Rosé": "rose"
    case "Rotwein Hell": "rotHell"
    case "Rotwein Dunkel": "rotDunkel"
    case "Benutzerdefiniert": "custom"
    default: ""
    end + "&"
else "" end +
if Benutzerdefinierte_Farbe then "customColor=" + urlEncode(Benutzerdefinierte_Farbe) + "&" else "" end +
if Etikett_URL then "etikettSrc=" + urlEncode(Etikett_URL) + "&" else "" end +
if Etikett_Position_X then "etikettLeft=" + Etikett_Position_X + "&" else "" end +
if Etikett_Position_Y then "etikettTop=" + Etikett_Position_Y + "&" else "" end +
if Etikett_Skalierung_X then "etikettScaleX=" + Etikett_Skalierung_X + "&" else "" end +
if Etikett_Skalierung_Y then "etikettScaleY=" + Etikett_Skalierung_Y + "&" else "" end +
if Kunden_ID then "customerId=" + Kunden_ID else "" end
`;

/**
 * Vereinfachte Ninox Formel (nur Basis-Parameter)
 */
export const ninoxFormulaSimple = `
"https://yourdomain.com/konfigurator?flasche=" + 
switch Flaschentyp do
case "Bordeaux 0.75L Optima": "bd75optima"
case "Bordeaux 0.75L Prestige": "bd75prestige"  
case "Burgunder 0.75L Optima": "bg75optima"
case "Paris 0.75L": "paris75"
default: "bd75optima"
end + 
if Korken then "&korken=" + 
    switch Korken do
    case "Natur": "natur"
    case "Natur 2": "natur2"
    case "Mikrogranulat": "mikro"
    case "Branded": "brand" 
    default: "natur"
    end
else ""
end +
if Weinfarbe then "&weinfarbe=" + 
    switch Weinfarbe do
    case "Weißwein": "weiss"
    case "Rosé": "rose"
    case "Rotwein Hell": "rotHell"
    case "Rotwein Dunkel": "rotDunkel"
    default: "rotDunkel"
    end
else ""
end
`;

/**
 * Hilfsfunktion für Ninox REST API Integration
 */
export function createNinoxApiIntegration(apiKey, teamId, databaseId) {
    const baseUrl = `https://api.ninox.com/v1/teams/${teamId}/databases/${databaseId}`;
    
    return {
        /**
         * Lädt einen Datensatz und generiert Konfigurator URL
         */
        async getKonfiguratorUrl(recordId, konfiguratorBaseUrl) {
            try {
                const response = await fetch(`${baseUrl}/tables/Flaschen/records/${recordId}`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Ninox API Fehler: ${response.status}`);
                }
                
                const record = await response.json();
                return generateKonfiguratorUrlFromNinox(record.fields, konfiguratorBaseUrl);
            } catch (error) {
                console.error('Fehler beim Laden des Ninox Records:', error);
                throw error;
            }
        },
        
        /**
         * Speichert eine Konfiguration zurück in Ninox
         */
        async saveConfiguration(recordId, configuration) {
            const ninoxFields = {
                'Flaschentyp': configuration.flasche,
                'Korken': configuration.korken,
                'Kapsel': configuration.kapsel, 
                'Weinfarbe': configuration.weinfarbe,
                'Benutzerdefinierte_Farbe': configuration.customColor,
                'Etikett_URL': configuration.etikett?.src,
                'Etikett_Position_X': configuration.etikett?.left,
                'Etikett_Position_Y': configuration.etikett?.top,
                'Etikett_Skalierung_X': configuration.etikett?.scaleX,
                'Etikett_Skalierung_Y': configuration.etikett?.scaleY,
                'Konfiguration_URL': generateKonfiguratorUrlFromNinox(configuration)
            };
            
            try {
                const response = await fetch(`${baseUrl}/tables/Flaschen/records/${recordId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fields: ninoxFields })
                });
                
                if (!response.ok) {
                    throw new Error(`Ninox API Fehler: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('Fehler beim Speichern in Ninox:', error);
                throw error;
            }
        }
    };
}
