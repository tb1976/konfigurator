import puppeteer from 'puppeteer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let browser = null;
    
    try {
        const {
            weinprofilId,
            articleId,
            flasche,
            korken,
            kapsel,
            weinfarbe,
            customColor,
            etikettSrc,
            filename
        } = req.body;

        console.log('🎨 Server-Side PNG Generierung gestartet:', { flasche, korken, kapsel });

        // 1. Browser starten
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        
        // 2. Viewport setzen für konsistente Größe
        await page.setViewport({ 
            width: 800, 
            height: 1200, 
            deviceScaleFactor: 2 // Für High-DPI
        });

        // 3. Konfigurator-URL mit Parametern generieren
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const configUrl = new URL(baseUrl);
        configUrl.searchParams.set('mode', 'headless'); // Spezieller Modus
        configUrl.searchParams.set('flasche', flasche);
        if (korken) configUrl.searchParams.set('korken', korken);
        if (kapsel) configUrl.searchParams.set('kapsel', kapsel);
        if (weinfarbe) configUrl.searchParams.set('weinfarbe', weinfarbe);
        if (customColor) configUrl.searchParams.set('customColor', customColor);
        if (etikettSrc) configUrl.searchParams.set('etikettSrc', encodeURIComponent(etikettSrc));

        console.log('🔗 Lade Konfigurator-URL:', configUrl.toString());

        // 4. Seite laden
        await page.goto(configUrl.toString(), { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // 5. Warten bis Konfigurator fertig geladen ist
        await page.waitForSelector('[data-konfigurator-flasche]', { timeout: 20000 });
        
        // Extra warten für Etikett-Loading falls vorhanden
        if (etikettSrc) {
            await page.waitForTimeout(3000);
        }

        // 6. PNG-Screenshot vom Flaschenkonfigurator-Bereich
        const flaschenElement = await page.$('[data-konfigurator-flasche]');
        
        if (!flaschenElement) {
            throw new Error('Flaschenkonfigurator-Element nicht gefunden');
        }

        const imageBuffer = await flaschenElement.screenshot({
            type: 'png',
            omitBackground: true // Transparenter Hintergrund
        });

        console.log('✅ PNG-Screenshot erstellt, Größe:', imageBuffer.length, 'bytes');

        // 7. Optional: Direkt zu Ninox uploaden
        if (weinprofilId || articleId) {
            const uploadResult = await uploadToNinox({
                weinprofilId,
                articleId,
                imageBuffer,
                filename: filename || `bottle_${flasche}_${Date.now()}.png`
            });
            
            return res.status(200).json({
                success: true,
                message: 'PNG generiert und zu Ninox hochgeladen',
                ninoxResult: uploadResult,
                imageSize: imageBuffer.length
            });
        }

        // 8. PNG als Base64 zurückgeben
        const base64Image = imageBuffer.toString('base64');
        
        res.status(200).json({
            success: true,
            message: 'PNG erfolgreich generiert',
            imageData: `data:image/png;base64,${base64Image}`,
            imageSize: imageBuffer.length,
            parameters: { flasche, korken, kapsel, weinfarbe }
        });

    } catch (error) {
        console.error('❌ Server-Side PNG Generierung Fehler:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Fehler bei der Server-Side PNG Generierung'
        });
    } finally {
        // Browser immer schließen
        if (browser) {
            await browser.close();
        }
    }
}

// Hilfsfunktion: Upload zu Ninox
async function uploadToNinox({ weinprofilId, articleId, imageBuffer, filename }) {
    const recordId = weinprofilId || articleId;
    const tableName = weinprofilId ? 'EB' : 'W';
    
    const baseUrl = process.env.NINOX_BASE_URL;
    const teamId = process.env.NINOX_TEAM_ID;
    const databaseId = process.env.NINOX_DATABASE_ID;
    const token = process.env.NINOX_API_TOKEN;

    // 1. File upload
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('file', blob, filename);

    const uploadResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records/${recordId}/files`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData
    });

    if (!uploadResponse.ok) {
        throw new Error(`Ninox Upload Fehler: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();

    // 2. Artikelbild-Feld verknüpfen
    const linkResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: recordId,
            fields: {
                Artikelbild: {
                    name: uploadResult.name,
                    id: uploadResult.id
                }
            }
        })
    });

    return {
        fileUploaded: uploadResult,
        fieldLinked: linkResponse.ok
    };
}