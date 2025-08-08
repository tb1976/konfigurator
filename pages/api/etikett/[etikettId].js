// API Endpoint zum Abrufen gespeicherter Etiketten
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const { etikettId } = req.query;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!etikettId) {
        return res.status(400).json({ error: 'Etikett-ID fehlt' });
    }

    try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'etiketten');
        
        // Finde Datei mit dieser ID (verschiedene Extensions möglich)
        const files = fs.readdirSync(uploadDir).filter(file => 
            file.startsWith(etikettId)
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'Etikett nicht gefunden' });
        }

        const fileName = files[0];
        const filePath = path.join(uploadDir, fileName);
        
        // Content-Type basierend auf Datei-Extension
        const ext = path.extname(fileName).toLowerCase();
        const contentTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        // Datei zurückgeben
        const fileBuffer = fs.readFileSync(filePath);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr Cache
        res.send(fileBuffer);

    } catch (error) {
        console.error('Etikett-Abruf-Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Etiketts' });
    }
}
