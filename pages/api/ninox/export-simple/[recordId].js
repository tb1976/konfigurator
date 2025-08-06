// pages/api/ninox/export-simple/[recordId].js
// Vereinfachte API für Bild-Export (ohne Canvas dependency)

export default async function handler(req, res) {
    const { recordId } = req.query;
    
    if (!recordId) {
        return res.status(400).json({ error: 'Record ID ist erforderlich' });
    }

    try {
        if (req.method === 'GET') {
            // Leite zur Konfigurator-Seite mit Auto-Export weiter
            const exportUrl = `/konfigurator/ninox/${recordId}?autoExport=true`;
            
            // Für API-Calls: Redirect zur Export-Seite
            if (req.headers.accept?.includes('application/json')) {
                return res.status(200).json({
                    success: true,
                    exportUrl: exportUrl,
                    downloadUrl: `/api/ninox/download/${recordId}`,
                    message: 'Export wird vorbereitet. Verwenden Sie downloadUrl für direkten Download.'
                });
            }
            
            // Für Browser: Direkter Redirect
            return res.redirect(302, exportUrl);
            
        } else if (req.method === 'POST') {
            // Konfiguration für Export empfangen und verarbeiten
            const { imageData, filename, format = 'png' } = req.body;
            
            if (!imageData) {
                return res.status(400).json({ error: 'Bilddaten fehlen' });
            }
            
            // Base64 zu Buffer konvertieren
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Dateiname aus Request oder Ninox-Record bestimmen
            const finalFilename = filename || `flasche-${recordId}`;
            const mimeType = getMimeType(format);
            const fileExtension = getFileExtension(format);
            
            // HTTP Response mit Bild
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}.${fileExtension}"`);
            res.setHeader('Content-Length', buffer.length);
            
            return res.send(buffer);
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

function getMimeType(format) {
    switch (format?.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
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
        case 'png':
        default:
            return 'png';
    }
}
