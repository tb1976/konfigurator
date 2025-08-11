// app/page.jsx
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

// USAGE - Ihre URLs bleiben einfach:

// 1. STANDALONE (wie bisher):
// https://example.com/

// 2. NINOX GENERATOR:
// https://example.com/?mode=ninox&customerId=123&etikettSrc=https://example.com/etikett.png&autoExport=true

// 3. CUSTOMER DASHBOARD:  
// https://example.com/?mode=dashboard&customerId=456&weinprofilId=789

// ODER sogar noch einfacher - minimale Version:
export function HomeMinimal() {
  return (
    <main>
      <Suspense fallback={<div>Laden...</div>}>
        <KonfiguratorWithParams />
      </Suspense>
    </main>
  );
}

function KonfiguratorWithParams() {
  const searchParams = useSearchParams();
  
  return (
    <Konfigurator 
      mode={searchParams.get('mode') || 'standalone'}
      customerId={searchParams.get('customerId')}
      weinprofilId={searchParams.get('weinprofilId')}
      autoExport={searchParams.get('autoExport') === 'true'}
    />
  );
}