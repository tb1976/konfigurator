// pages/api/ninox/export/[recordId].js
// API Endpoint für direkten Bild-Export aus Ninox-Konfiguration

import { createCanvas, loadImage } from 'canvas';
import { createNinoxApiIntegration } from '@/lib/ninoxIntegration';

export default async function handler(req, res) {
    const { recordId } = req.query;
    
    if (!recordId) {
        return res.status(400).json({ error: 'Record ID ist erforderlich' });
    }

    try {
        if (req.method === 'GET') {
            // Einfacher Export mit Standardeinstellungen
            await handleExport(req, res, recordId, {
                format: 'png',
                width: 800,
                height: 1200,
                quality: 1.0
            });
        } else if (req.method === 'POST') {
            // Export mit benutzerdefinierten Einstellungen
            const exportSettings = {
                format: req.body.format || 'png',
                width: req.body.width || 800,
                height: req.body.height || 1200,
                quality: req.body.quality || 1.0,
                filename: req.body.filename
            };
            await handleExport(req, res, recordId, exportSettings);
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('❌ Export-Fehler:', error);
        return res.status(500).json({ 
            error: 'Export fehlgeschlagen',
            details: error.message 
        });
    }
}

async function handleExport(req, res, recordId, settings) {
    // 1. Lade Konfiguration aus Ninox
    const ninoxApi = createNinoxApiIntegration();
    const ninoxRecord = await ninoxApi.getRecord(recordId);
    
    if (!ninoxRecord) {
        return res.status(404).json({ error: 'Datensatz nicht gefunden' });
    }

    // 2. Konvertiere zu Konfigurator-Format
    const configuration = mapNinoxToConfiguration(ninoxRecord);
    
    // 3. Erstelle Canvas mit Flaschen-Konfiguration
    const canvas = createCanvas(settings.width, settings.height);
    const ctx = canvas.getContext('2d');
    
    // Weißer Hintergrund
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, settings.width, settings.height);
    
    try {
        // 4. Zeichne Flasche basierend auf Konfiguration
        await drawBottleConfiguration(ctx, configuration, settings);
        
        // 5. Dateiname bestimmen
        const filename = configuration.filename || 
                        ninoxRecord.Dateiname || 
                        settings.filename || 
                        `flasche-${recordId}`;
        
        // 6. Bild exportieren
        const buffer = await exportCanvasAsBuffer(canvas, settings);
        
        // 7. HTTP Response mit Bild
        const mimeType = getMimeType(settings.format);
        const fileExtension = getFileExtension(settings.format);
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.${fileExtension}"`);
        res.setHeader('Content-Length', buffer.length);
        
        return res.send(buffer);
        
    } catch (drawError) {
        console.error('❌ Zeichenfehler:', drawError);
        return res.status(500).json({ 
            error: 'Fehler beim Erstellen des Bildes',
            details: drawError.message 
        });
    }
}

async function drawBottleConfiguration(ctx, config, settings) {
    const { width, height } = settings;
    
    // Skalierungsfaktor für verschiedene Canvas-Größen
    const scale = Math.min(width / 800, height / 1200);
    
    // Zentrier-Offset
    const offsetX = (width - (800 * scale)) / 2;
    const offsetY = (height - (1200 * scale)) / 2;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    try {
        // 1. Flasche zeichnen
        if (config.bottle) {
            const bottleImg = await loadBottleImage(config.bottle, config.wine);
            if (bottleImg) {
                ctx.drawImage(bottleImg, 200, 100, 400, 800);
            }
        }
        
        // 2. Korken zeichnen  
        if (config.cork && config.cork !== 'keiner') {
            const corkImg = await loadCorkImage(config.cork);
            if (corkImg) {
                ctx.drawImage(corkImg, 350, 80, 100, 40);
            }
        }
        
        // 3. Kapsel zeichnen
        if (config.cap && config.cap !== 'keine') {
            const capImg = await loadCapImage(config.cap);
            if (capImg) {
                ctx.drawImage(capImg, 340, 70, 120, 60);
            }
        }
        
        // 4. Etikett zeichnen (wenn vorhanden)
        if (config.label && config.labelSrc) {
            await drawLabel(ctx, config);
        }
        
    } finally {
        ctx.restore();
    }
}

async function loadBottleImage(bottleType, wineColor) {
    const imagePaths = {
        'bd75optima': wineColor === 'weiss' ? '/images/bd75optimaCan.png' : '/images/bd75optimaDark.png',
        'bd75prestige': wineColor === 'weiss' ? '/images/bd75prestigeCan.png' : '/images/bd75prestigeDark.png',
        'bg75optima': wineColor === 'weiss' ? '/images/bg75optimaCan.png' : '/images/bg75optimaDark.png',
        'paris75': '/images/paris75Can.png'
    };
    
    const imagePath = imagePaths[bottleType];
    if (!imagePath) return null;
    
    try {
        return await loadImage(`./public${imagePath}`);
    } catch (error) {
        console.warn(`⚠️ Flaschenbild nicht gefunden: ${imagePath}`);
        return null;
    }
}

async function loadCorkImage(corkType) {
    const imagePaths = {
        'natur': '/images/korkNatur.png',
        'natur2': '/images/korkNatur2.png', 
        'mikro': '/images/korkMikro.png',
        'brand': '/images/korkBrand.png'
    };
    
    const imagePath = imagePaths[corkType];
    if (!imagePath) return null;
    
    try {
        return await loadImage(`./public${imagePath}`);
    } catch (error) {
        console.warn(`⚠️ Korkenbild nicht gefunden: ${imagePath}`);
        return null;
    }
}

async function loadCapImage(capType) {
    const imagePaths = {
        'gold': '/images/kapselGold.png',
        'silber': '/images/kapselSilber.png',
        'kupfer': '/images/kapselKupfer.png',
        'blau': '/images/kapselBlau.png',
        'rot': '/images/kapselRot.png',
        'schwarz': '/images/kapselSchwMatt.png',
        'weiss': '/images/kapselWeiss.png'
    };
    
    const imagePath = imagePaths[capType];
    if (!imagePath) return null;
    
    try {
        return await loadImage(`./public${imagePath}`);
    } catch (error) {
        console.warn(`⚠️ Kapselbild nicht gefunden: ${imagePath}`);
        return null;
    }
}

async function drawLabel(ctx, config) {
    try {
        const labelImg = await loadImage(config.labelSrc);
        
        // Etikett-Position und Größe
        const labelWidth = (config.labelWidth || 80) * 2;
        const labelHeight = (config.labelHeight || 60) * 2;
        
        // Position basierend auf label-Einstellung
        let x = 300; // Zentriert auf Flasche
        let y = 400; // Mitte der Flasche
        
        switch (config.label) {
            case 'top':
                y = 300;
                break;
            case 'bottom': 
                y = 600;
                break;
            case 'center':
            default:
                y = 400;
                break;
        }
        
        // Zentriere das Etikett
        x = x - labelWidth / 2;
        y = y - labelHeight / 2;
        
        ctx.drawImage(labelImg, x, y, labelWidth, labelHeight);
        
    } catch (error) {
        console.warn('⚠️ Etikett konnte nicht geladen werden:', error.message);
    }
}

function mapNinoxToConfiguration(ninoxRecord) {
    return {
        bottle: ninoxRecord.Flaschentyp,
        cork: ninoxRecord.Korkentyp,
        cap: ninoxRecord.Kapseltyp,
        wine: ninoxRecord.Weinfarbe,
        label: ninoxRecord.EtikettPosition || 'center',
        labelWidth: ninoxRecord.EtikettBreite || 80,
        labelHeight: ninoxRecord.EtikettHoehe || 60,
        labelSrc: ninoxRecord.EtikettURL,
        filename: ninoxRecord.Dateiname
    };
}

async function exportCanvasAsBuffer(canvas, settings) {
    return new Promise((resolve, reject) => {
        if (settings.format === 'jpg' || settings.format === 'jpeg') {
            const buffer = canvas.toBuffer('image/jpeg', { quality: settings.quality });
            resolve(buffer);
        } else if (settings.format === 'pdf') {
            // PDF Export würde zusätzliche Library benötigen
            reject(new Error('PDF Export noch nicht implementiert'));
        } else {
            // PNG (default)
            const buffer = canvas.toBuffer('image/png');
            resolve(buffer);
        }
    });
}

function getMimeType(format) {
    switch (format?.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'pdf':
            return 'application/pdf';
        case 'png':
        default:
            return 'image/png';
    }
}

function getFileExtension(format) {
    switch (format?.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return 'jpg';
        case 'pdf':
            return 'pdf';
        case 'png':
        default:
            return 'png';
    }
}
