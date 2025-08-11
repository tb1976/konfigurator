// api/ninox-weinprofil.js - Mit echtem File Upload anstatt Base64

export default async function handler(req, res) {
    if (req.method === 'POST') {
        return await handleSaveWithFileUpload(req, res);
    } else if (req.method === 'GET') {
        return await handleLoad(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

// Speichern mit File Upload (wie Ihr PDF-Beispiel)
async function handleSaveWithFileUpload(req, res) {
    try {
        const { weinprofilId, configData, imageDataUrl } = req.body;
        
        console.log('🍷 Ninox Weinprofil Update mit File Upload gestartet:', { weinprofilId });

        // Umgebungsvariablen
        const baseUrl = process.env.NINOX_BASE_URL;
        const teamId = process.env.NINOX_TEAM_ID;
        const databaseId = process.env.NINOX_DATABASE_ID;
        const tableName = process.env.NINOX_PROFILE_TABLE_NAME || 'EB';
        const token = process.env.NINOX_API_TOKEN;

        // 1. Zuerst Weinprofil-Datensatz aktualisieren/erstellen (nur OnlineAusstattung)
        const recordPayload = {
            id: weinprofilId, // Wenn vorhanden = Update, wenn leer = Create
            fields: {
                OnlineAusstattung: JSON.stringify({
                    flasche: configData.flasche,
                    korken: configData.korken,
                    kapsel: configData.kapsel,
                    weinfarbe: configData.weinfarbe,
                    customColor: configData.customColor,
                    weinSettings: configData.weinSettings,
                    etikett: configData.etikett ? {
                        id: configData.etikett.id,
                        position: configData.etikett.position
                    } : null,
                    lastUpdated: new Date().toISOString(),
                    updatedBy: 'konfigurator'
                })
            }
        };

        console.log('📤 1. Aktualisiere Weinprofil-Record...');
        
        const updateResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recordPayload)
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Fehler beim Aktualisieren des Weinprofils:', errorText);
            throw new Error(`Weinprofil Update Fehler: ${updateResponse.status} - ${errorText}`);
        }

        const updatedRecord = await updateResponse.json();
        const finalRecordId = updatedRecord.id || weinprofilId;
        
        console.log('✅ Weinprofil aktualisiert, Record ID:', finalRecordId);

        // 2. Etikett-Bild als File hochladen (falls vorhanden)
        let fileUploadResult = null;
        if (imageDataUrl) {
            console.log('📤 2. Lade Etikett-Bild als Datei hoch...');
            
            // Base64 zu Blob konvertieren
            const imageBlob = dataURLtoBlob(imageDataUrl);
            const fileName = `etikett_${finalRecordId}_${Date.now()}.png`;
            
            // FormData für File Upload erstellen
            const formData = new FormData();
            formData.append('file', imageBlob, fileName);
            
            const fileUploadResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records/${finalRecordId}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!fileUploadResponse.ok) {
                const errorText = await fileUploadResponse.text();
                console.error('❌ Fehler beim Hochladen der Etikett-Datei:', errorText);
                throw new Error(`File Upload Fehler: ${fileUploadResponse.status} - ${errorText}`);
            }

            fileUploadResult = await fileUploadResponse.json();
            console.log('✅ Etikett-Datei hochgeladen:', fileUploadResult);
        }

        // 3. Erfolgreiche Antwort
        res.status(200).json({
            success: true,
            ninoxRecordId: finalRecordId,
            message: weinprofilId ? 'Weinprofil aktualisiert' : 'Neues Weinprofil erstellt',
            updatedFields: ['OnlineAusstattung'],
            uploadedFile: fileUploadResult ? {
                fileName: fileUploadResult.name,
                fileId: fileUploadResult.id,
                size: fileUploadResult.size
            } : null,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ninox Weinprofil Update Fehler:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Fehler beim Aktualisieren des Weinprofils in Ninox'
        });
    }
}

// Laden Funktion (unverändert)
async function handleLoad(req, res) {
    try {
        const { weinprofilId } = req.query;
        
        if (!weinprofilId) {
            return res.status(400).json({ error: 'weinprofilId ist erforderlich' });
        }

        console.log('📥 Lade Weinprofil aus Ninox:', weinprofilId);

        const baseUrl = process.env.NINOX_BASE_URL;
        const teamId = process.env.NINOX_TEAM_ID;
        const databaseId = process.env.NINOX_DATABASE_ID;
        const tableName = process.env.NINOX_PROFILE_TABLE_NAME || 'EB';

        // Record aus Ninox laden
        const response = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records/${weinprofilId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.NINOX_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ninox Load Fehler:', response.status, errorText);
            throw new Error(`Ninox Load Error: ${response.status} - ${errorText}`);
        }

        const ninoxRecord = await response.json();
        console.log('✅ Weinprofil geladen:', ninoxRecord.id);

        // OnlineAusstattung JSON parsen
        let configuration = null;
        if (ninoxRecord.fields && ninoxRecord.fields.OnlineAusstattung) {
            try {
                configuration = JSON.parse(ninoxRecord.fields.OnlineAusstattung);
            } catch (parseError) {
                console.warn('⚠️ Fehler beim Parsen der OnlineAusstattung:', parseError);
            }
        }

        // Dateien des Records laden (für Etikett-Bilder)
        const filesResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records/${weinprofilId}/files`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.NINOX_API_TOKEN}`,
            }
        });

        let etikettFiles = [];
        if (filesResponse.ok) {
            const files = await filesResponse.json();
            etikettFiles = files.filter(file => 
                file.name.includes('etikett') && 
                (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'))
            );
            console.log('📁 Etikett-Dateien gefunden:', etikettFiles.length);
        }

        // Neueste Etikett-Datei als URL
        let etikettUrl = null;
        if (etikettFiles.length > 0) {
            const latestEtikett = etikettFiles.sort((a, b) => 
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )[0];
            
            etikettUrl = `${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records/${weinprofilId}/files/${latestEtikett.id}`;
        }

        res.status(200).json({
            success: true,
            weinprofilId: ninoxRecord.id,
            configuration: configuration,
            etikettUrl: etikettUrl,
            etikettFiles: etikettFiles.map(f => ({ id: f.id, name: f.name, size: f.size, createdAt: f.createdAt })),
            lastUpdated: configuration?.lastUpdated || null,
            hasEtikett: !!etikettUrl,
            hasConfiguration: !!configuration
        });
        
    } catch (error) {
        console.error('❌ Ninox Load Fehler:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
}

// Hilfsfunktion: DataURL zu Blob konvertieren
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
}

// Frontend Integration - Konfigurator.jsx
const handleSaveToNinoxWeinprofilWithFile = async () => {
    if (!weinprofilId) {
        console.error('❌ Keine WeinprofilId vorhanden');
        return;
    }

    setIsProcessing(true);
    setProcessingMessage('Speichere in Ninox Weinprofil...');

    try {
        // 1. Canvas zu PNG exportieren
        const { domToPng } = await import('modern-screenshot');
        const flaschenContainer = document.querySelector('[data-konfigurator-flasche]');
        
        if (!flaschenContainer) {
            throw new Error('Flaschenkonfigurator-Container nicht gefunden');
        }

        const imageDataUrl = await domToPng(flaschenContainer, {
            quality: 1.0,
            pixelRatio: 2,
            style: { transform: 'none' }
        });

        // 2. Konfigurationsdaten sammeln
        const configData = {
            flasche: activeFlasche,
            korken: activeKorken,
            kapsel: activeKapsel,
            weinfarbe: activeWeinfarbe,
            customColor: customColor,
            weinSettings: weinSettings,
            etikett: getCurrentEtikettState(),
            timestamp: new Date().toISOString()
        };

        // 3. An Ninox API senden (mit File Upload)
        const response = await fetch('/api/ninox-weinprofil', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weinprofilId: weinprofilId,
                imageDataUrl: imageDataUrl, // Wird zu File konvertiert
                configData: configData
            })
        });

        if (!response.ok) {
            throw new Error('Ninox API Fehler');
        }

        const result = await response.json();
        console.log('✅ Ninox Weinprofil mit File Upload gespeichert:', result);

        alert(`Konfiguration erfolgreich gespeichert!\n${result.message}`);

    } catch (error) {
        console.error('❌ Fehler beim Speichern in Ninox:', error);
        alert('Fehler beim Speichern: ' + error.message);
    } finally {
        setIsProcessing(false);
        setProcessingMessage('');
    }
};