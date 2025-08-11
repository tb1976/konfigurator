// api/ninox-artikelbild.js - Neue API für Artikel und Weinprofil

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            weinprofilId, 
            articleId, 
            imageDataUrl, 
            linkURL, 
            configData 
        } = req.body;
        
        // Bestimme Tabelle und Record-ID basierend auf übergebenen Parametern
        const isWeinprofil = !!weinprofilId;
        const isArtikel = !!articleId;
        
        if (!isWeinprofil && !isArtikel) {
            return res.status(400).json({ error: 'Entweder weinprofilId oder articleId muss angegeben werden' });
        }
        
        const recordId = weinprofilId || articleId;
        const tableName = isWeinprofil ? 'EB' : 'W'; // Weinprofil oder Artikel
        const recordType = isWeinprofil ? 'Weinprofil' : 'Artikel';
        
        console.log(`🍷 Ninox ${recordType} Artikelbild Update gestartet:`, { 
            recordId, 
            tableName, 
            hasImage: !!imageDataUrl,
            hasLinkURL: !!linkURL 
        });

        // Umgebungsvariablen
        const baseUrl = process.env.NINOX_BASE_URL;
        const teamId = process.env.NINOX_TEAM_ID;
        const databaseId = process.env.NINOX_DATABASE_ID;
        const token = process.env.NINOX_API_TOKEN;

        // 1. Record mit linkURL und ggf. Konfigurationsdaten aktualisieren
        const updateFields = {
            linkURL: linkURL
        };

        // Füge Konfigurationsdaten hinzu (nur bei Weinprofil oder wenn gewünscht)
        if (configData && isWeinprofil) {
            updateFields.OnlineAusstattung = JSON.stringify({
                ...configData,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'konfigurator',
                generatedImage: true
            });
        }

        const recordPayload = {
            id: recordId,
            fields: updateFields
        };

        console.log('📤 1. Aktualisiere Record-Felder...', Object.keys(updateFields));
        
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
            console.error(`❌ Fehler beim Aktualisieren des ${recordType}s:`, errorText);
            throw new Error(`${recordType} Update Fehler: ${updateResponse.status} - ${errorText}`);
        }

        const updatedRecord = await updateResponse.json();
        console.log(`✅ ${recordType} aktualisiert, Record ID:`, updatedRecord.id);

        // 2. Artikelbild als File hochladen
        let fileUploadResult = null;
        if (imageDataUrl) {
            console.log('📤 2. Lade Artikelbild als Datei hoch...');
            
            // Base64 zu Blob konvertieren
            const imageBlob = dataURLtoBlob(imageDataUrl);
            const fileName = `artikelbild_${recordType.toLowerCase()}_${recordId}_${Date.now()}.png`;
            
            // FormData für File Upload erstellen
            const formData = new FormData();
            formData.append('file', imageBlob, fileName);
            
            const fileUploadResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records/${recordId}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!fileUploadResponse.ok) {
                const errorText = await fileUploadResponse.text();
                console.error('❌ Fehler beim Hochladen des Artikelbildes:', errorText);
                throw new Error(`File Upload Fehler: ${fileUploadResponse.status} - ${errorText}`);
            }

            fileUploadResult = await fileUploadResponse.json();
            console.log('✅ Artikelbild hochgeladen:', fileUploadResult.name);

            // 3. Artikelbild-Feld mit der hochgeladenen Datei verknüpfen
            console.log('📤 3. Verknüpfe Artikelbild-Feld...');
            
            const imageFieldPayload = {
                id: recordId,
                fields: {
                    Artikelbild: {
                        name: fileUploadResult.name,
                        id: fileUploadResult.id
                    }
                }
            };

            const imageFieldResponse = await fetch(`${baseUrl}/teams/${teamId}/databases/${databaseId}/tables/${tableName}/records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageFieldPayload)
            });

            if (!imageFieldResponse.ok) {
                const errorText = await imageFieldResponse.text();
                console.error('❌ Fehler beim Verknüpfen des Artikelbild-Feldes:', errorText);
                // Nicht kritisch - Datei wurde hochgeladen, nur Verknüpfung fehlgeschlagen
                console.warn('⚠️ Artikelbild hochgeladen, aber Feld-Verknüpfung fehlgeschlagen');
            } else {
                console.log('✅ Artikelbild-Feld erfolgreich verknüpft');
            }
        }

        // 4. Erfolgreiche Antwort
        res.status(200).json({
            success: true,
            recordId: recordId,
            recordType: recordType,
            tableName: tableName,
            message: `${recordType} Artikelbild erfolgreich erstellt`,
            updatedFields: Object.keys(updateFields),
            uploadedFile: fileUploadResult ? {
                fileName: fileUploadResult.name,
                fileId: fileUploadResult.id,
                size: fileUploadResult.size
            } : null,
            linkURL: linkURL,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ninox Artikelbild Update Fehler:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Fehler beim Erstellen des Artikelbildes in Ninox'
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

// Frontend Integration - Erweiterte page.jsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Konfigurator from '../components/Konfigurator';

function KonfiguratorWrapper() {
    const searchParams = useSearchParams();
    
    // URL-Parameter auslesen
    const mode = searchParams.get('mode') || 'standalone';
    const weinprofilId = searchParams.get('weinprofilId');
    const articleId = searchParams.get('articleId');
    const autoExport = searchParams.get('autoExport') === 'true';
    
    // Bestimme Record-Type für Ninox-Modus
    const isNinoxMode = mode === 'ninox';
    const recordType = weinprofilId ? 'weinprofil' : articleId ? 'artikel' : null;

    // Callbacks für Ninox-Modus
    const handleNinoxArtikelbildExport = async (exportData) => {
        console.log('🏭 Ninox Artikelbild Export gestartet:', { recordType, exportData });
        
        try {
            // Link-URL generieren (für linkURL Feld)
            const linkURL = generateShareableURL();
            
            const response = await fetch('/api/ninox-artikelbild', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weinprofilId: weinprofilId,
                    articleId: articleId,
                    imageDataUrl: exportData.imageDataUrl,
                    linkURL: linkURL,
                    configData: exportData.configData
                })
            });

            if (!response.ok) {
                throw new Error('Ninox Artikelbild Export fehlgeschlagen');
            }

            const result = await response.json();
            console.log('✅ Ninox Artikelbild Export erfolgreich:', result);
            
            // Für Iframe-Integration: Nachricht an Parent
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'NINOX_ARTIKELBILD_COMPLETE',
                    data: {
                        success: true,
                        recordId: result.recordId,
                        recordType: result.recordType,
                        fileName: result.uploadedFile?.fileName,
                        linkURL: result.linkURL
                    }
                }, '*');
            }
            
        } catch (error) {
            console.error('❌ Ninox Artikelbild Export Fehler:', error);
            
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'NINOX_ARTIKELBILD_ERROR',
                    error: error.message
                }, '*');
            }
        }
    };

    // Shareable URL generieren
    const generateShareableURL = () => {
        const currentURL = new URL(window.location.href);
        // Entferne Ninox-spezifische Parameter für öffentlichen Link
        currentURL.searchParams.delete('mode');
        currentURL.searchParams.delete('autoExport');
        return currentURL.toString();
    };

    // Props für den Konfigurator
    const konfiguratorProps = {
        mode: mode,
        weinprofilId: weinprofilId,
        articleId: articleId,
        
        ...(isNinoxMode && {
            onAutoExport: handleNinoxArtikelbildExport,
            autoExport: autoExport,
            showEtikettShop: false,
            showExportPanel: false
        }),
        
        ...(mode === 'standalone' && {
            showEtikettShop: true,
            showExportPanel: true
        })
    };

    return (
        <main>
            {/* Header basierend auf Modus und Record-Type */}
            {isNinoxMode && (
                <div className="bg-green-50 border-b border-green-200 p-4 text-center">
                    <h1 className="text-lg font-bold text-green-800">
                        🏭 Ninox Artikelbild Generator
                    </h1>
                    <p className="text-green-600 text-sm">
                        {recordType === 'weinprofil' && `Weinprofil: ${weinprofilId}`}
                        {recordType === 'artikel' && `Artikel: ${articleId}`}
                        {!recordType && 'Fehler: Keine gültige ID übergeben'}
                    </p>
                    {autoExport && (
                        <div className="mt-2 text-green-700 text-xs">
                            ⚙️ Automatischer Export aktiviert
                        </div>
                    )}
                </div>
            )}
            
            <Konfigurator {...konfiguratorProps} />
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div>Lade Konfigurator...</div>}>
            <KonfiguratorWrapper />
        </Suspense>
    );
}

// USAGE BEISPIELE:

// 1. Weinprofil Artikelbild:
// URL: https://example.com/?mode=ninox&weinprofilId=123&flasche=flasche2&etikettSrc=https://...&autoExport=true

// 2. Artikel Artikelbild:  
// URL: https://example.com/?mode=ninox&articleId=456&flasche=flasche4&korken=natur&autoExport=true

// 3. Ninox Button/Script Beispiel:
/*
// Aus Weinprofil-Datensatz
const url = `https://konfigurator.example.com/?mode=ninox&weinprofilId=${record.id}&flasche=flasche2&etikettSrc=${record.EtikettURL}&autoExport=true`;
window.open(url, '_blank');

// Aus Artikel-Datensatz  
const url = `https://konfigurator.example.com/?mode=ninox&articleId=${record.id}&flasche=${record.FlaschenTyp}&korken=${record.KorkenArt}&autoExport=true`;
window.open(url, '_blank');
*/

// NINOX FELDER (in beiden Tabellen):
// - Artikelbild (Bild-Feld)
// - linkURL (Text-Feld) 
// - OnlineAusstattung (Text-Feld, nur bei Weinprofil)

// ERGEBNIS:
// ✅ PNG-Datei wird in "Artikelbild"-Feld geladen
// ✅ Shareable URL wird in "linkURL"-Feld gespeichert  
// ✅ Funktioniert für beide Tabellen (EB + W)
// ✅ Flexibel über URL-Parameter steuerbar