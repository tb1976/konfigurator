// API Endpoint für Etikett-Upload mit ID-Generierung
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = new formidable.IncomingForm();
        const [fields, files] = await form.parse(req);
        
        const uploadedFile = files.etikett?.[0];
        if (!uploadedFile) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen' });
        }

        // Dateityp validieren
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        const originalFileName = uploadedFile.originalFilename || uploadedFile.name || '';
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
        const hasValidExtension = allowedExtensions.some(ext => originalFileName.toLowerCase().endsWith(ext));
        
        if (!allowedTypes.includes(uploadedFile.mimetype) && !hasValidExtension) {
            return res.status(400).json({ 
                error: 'Ungültiger Dateityp. Nur JPG, PNG und PDF sind erlaubt.' 
            });
        }

        // Eindeutige ID generieren
        const etikettId = uuidv4();
        
        // Upload-Ordner sicherstellen
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'etiketten');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Datei-Extension erhalten
        const ext = path.extname(originalFileName);
        const fileName = `${etikettId}${ext}`;
        const targetPath = path.join(uploadDir, fileName);

        // Datei verschieben
        fs.copyFileSync(uploadedFile.filepath, targetPath);
        
        // Temporäre Datei löschen
        fs.unlinkSync(uploadedFile.filepath);

        // Erfolg zurückgeben
        res.status(200).json({
            success: true,
            etikettId: etikettId,
            url: `/uploads/etiketten/${fileName}`,
            filename: fileName
        });

    } catch (error) {
        console.error('Upload-Fehler:', error);
        res.status(500).json({ error: 'Upload fehlgeschlagen' });
    }
}
