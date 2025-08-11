// api/generate-bottle-image.js
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
    // 🔧 CORS Headers HIER setzen (innerhalb der Funktion)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // OPTIONS Request handhaben (Preflight):
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

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

        console.log('🎨 Server-Side PNG Generierung gestartet:', { 
            weinprofilId, 
            articleId, 
            flasche, 
            korken, 
            kapsel 
        });

        // Ninox sendet manchmal Arrays - normalisieren
        const normalizedParams = {
            flasche: Array.isArray(flasche) ? flasche[0] : flasche,
            korken: Array.isArray(korken) ? korken[0] : korken,
            kapsel: Array.isArray(kapsel) ? kapsel[0] : kapsel,
            weinfarbe: Array.isArray(weinfarbe) ? weinfarbe[0] : weinfarbe,
            customColor: Array.isArray(customColor) ? customColor[0] : customColor,
            etikettSrc: Array.isArray(etikettSrc) ? etikettSrc[0] : etikettSrc
        };

        console.log('📦 Normalisierte Parameter:', normalizedParams);

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

        // 3. Konfigurator-URL mit normalisierten Parametern generieren
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://konfigurator.isla.wine';
        const configUrl = new URL(baseUrl);
        configUrl.searchParams.set('mode', 'headless'); // Spezieller Modus

        // Normalisierte Parameter verwenden
        if (normalizedParams.flasche) configUrl.searchParams.set('flasche', normalizedParams.flasche);
        if (normalizedParams.korken) configUrl.searchParams.set('korken', normalizedParams.korken);
        if (normalizedParams.kapsel) configUrl.searchParams.set('kapsel', normalizedParams.kapsel);
        if (normalizedParams.weinfarbe) configUrl.searchParams.set('weinfarbe', normalizedParams.weinfarbe);
        if (normalizedParams.customColor) configUrl.searchParams.set('customColor', normalizedParams.customColor);
        if (normalizedParams.etikettSrc) configUrl.searchParams.set('etikettSrc', encodeURIComponent(normalizedParams.etikettSrc));

        console.log('🔗 Lade Konfigurator-URL:', configUrl.toString());

        // 4. Seite laden
        await page.goto(configUrl.toString(), { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // 5. Warten bis Konfigurator fertig geladen ist
        await page.waitForSelector('[data-konfigurator-flasche]', { timeout: 20000 });
        
        // Extra warten für Etikett-Loading falls vorhanden
        if (normalizedParams.etikettSrc) {
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
                filename: filename || `bottle_${normalizedParams.flasche}_${Date.now()}.png`,
                configData: normalizedParams
            });
            
            return res.status(200).json({
                success: true,
                message: 'PNG generiert und zu Ninox hochgeladen',
                ninoxResult: uploadResult,
                imageSize: imageBuffer.length,
                parameters: normalizedParams
            });
        }

        // 8. PNG als Base64 zurückgeben
        const base64Image = imageBuffer.toString('base64');
        
        res.status(200).json({
            success: true,
            message: 'PNG erfolgreich generiert',
            imageData: `data:image/png;base64,${base64Image}`,
            imageSize: imageBuffer.length,
            parameters: normalizedParams
        });

    } catch (error) {
        console.error('❌ Server-Side PNG Generierung Fehler:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Fehler bei der Server-Side PNG Generierung',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        // Browser immer schließen
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('❌ Fehler beim Schließen des Browsers:', closeError);
            }
        }
    }
}

// Hilfsfunktion: Upload zu Ninox
async function uploadToNinox({ weinprofilId, articleId, imageBuffer, filename, configData }) {
    try {
        const recordId = weinprofilId || articleId;
        const tableName = weinprofilId ? 'EB' : 'W';
        
        const baseUrl = process.env.NINOX_BASE_URL;
        const teamId = process.env.NINOX_TEAM_ID;
        const databaseId = process.env.NINOX_DATABASE_ID;
        const token = process.env.NINOX_API_TOKEN;

        if (!baseUrl || !teamId || !databaseId || !token) {
            throw new Error('Ninox API Credentials nicht vollständig konfiguriert');
        }

        console.log('📤 Ninox Upload gestartet:', { recordId, tableName, filename });

        // 1. File upload zu Ninox
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
            const errorText = await uploadResponse.text();
            throw new Error(`Ninox Upload Fehler: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('✅ Datei zu Ninox hochgeladen:', uploadResult.name);

        // 2. Artikelbild-Feld verknüpfen
        const linkPayload = {
            id: recordId,
            fields: {
                Artikelbild: {
                    name: uploadResult.name,
                    id: uploadResult.id
                }
            }
        };

        // Optional: linkURL-Feld setzen (für Shareable Link)
        if (configData) {
            const shareUrl = generateShareableUrl(configData);
            linkPayload.fields.linkURL = shareUrl;
        }

        const linkResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(linkPayload)
        });

        const linkResult = linkResponse.ok;
        if (linkResult) {
            console.log('✅ Artikelbild-Feld erfolgreich verknüpft');
        } else {
            console.warn('⚠️ Artikelbild-Feld konnte nicht verknüpft werden');
        }

        return {
            fileUploaded: uploadResult,
            fieldLinked: linkResult,
            recordId: recordId,
            tableName: tableName
        };

    } catch (error) {
        console.error('❌ Ninox Upload Fehler:', error);
        throw error;
    }
}

// Hilfsfunktion: Shareable URL generieren
function generateShareableUrl(configData) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://konfigurator.isla.wine';
    const url = new URL(baseUrl);
    
    // Parameter für öffentlichen Link (ohne mode=headless)
    if (configData.flasche) url.searchParams.set('flasche', configData.flasche);
    if (configData.korken) url.searchParams.set('korken', configData.korken);
    if (configData.kapsel) url.searchParams.set('kapsel', configData.kapsel);
    if (configData.weinfarbe) url.searchParams.set('weinfarbe', configData.weinfarbe);
    if (configData.customColor) url.searchParams.set('customColor', configData.customColor);
    if (configData.etikettSrc) url.searchParams.set('etikettSrc', configData.etikettSrc);
    
    return url.toString();
}