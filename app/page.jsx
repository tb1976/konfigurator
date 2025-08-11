// app/page.jsx (oder pages/index.js) - Ihre bestehende Datei erweitert
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Konfigurator from '../components/Konfigurator';

function KonfiguratorWrapper() {
  const searchParams = useSearchParams();
  
  // URL-Parameter auslesen
  const mode = searchParams.get('mode') || 'standalone';
  const customerId = searchParams.get('customerId');
  const weinprofilId = searchParams.get('weinprofilId');
  const autoExport = searchParams.get('autoExport') === 'true';

  // Callbacks für verschiedene Modi
  const handleNinoxExport = async (exportData) => {
    console.log('🏭 Ninox Export gestartet:', exportData);
    
    try {
      const response = await fetch('/api/ninox-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          imageData: exportData.imageDataUrl,
          configData: exportData.configData,
          filename: exportData.filename
        })
      });

      const result = await response.json();
      
      // Für Iframe-Integration: Nachricht an Parent
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'NINOX_EXPORT_COMPLETE',
          data: result
        }, '*');
      }
      
    } catch (error) {
      console.error('Ninox Export Fehler:', error);
      
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'NINOX_EXPORT_ERROR',
          error: error.message
        }, '*');
      }
    }
  };

  const handleDashboardSave = async (configData) => {
    console.log('👤 Dashboard Speichern:', configData);
    
    try {
      await fetch('/api/weinprofil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          weinprofilId: weinprofilId,
          configuration: configData
        })
      });
      
      console.log('✅ Konfiguration gespeichert');
      
    } catch (error) {
      console.error('Save Fehler:', error);
    }
  };

  // Props für den Konfigurator basierend auf Modus
  const konfiguratorProps = {
    // Basis-Props (immer)
    mode: mode,
    customerId: customerId,
    weinprofilId: weinprofilId,
    
    // Mode-spezifische Props
    ...(mode === 'ninox' && {
      onAutoExport: handleNinoxExport,
      autoExport: autoExport,
      showEtikettShop: false,
      showExportPanel: false
    }),
    
    ...(mode === 'dashboard' && {
      onSaveToProfile: handleDashboardSave,
      showEtikettShop: false,
      showExportPanel: true
    }),
    
    ...(mode === 'standalone' && {
      showEtikettShop: true,
      showExportPanel: true
    })
  };

  return (
    <main>
      {/* Optional: Header je nach Modus */}
      {mode === 'ninox' && (
        <div className="bg-green-50 border-b border-green-200 p-4 text-center">
          <h1 className="text-lg font-bold text-green-800">🏭 Ninox Bildgenerator</h1>
          <p className="text-green-600 text-sm">Automatische Bilderstellung für den Onlineshop</p>
        </div>
      )}
      
      {mode === 'dashboard' && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 text-center">
          <h1 className="text-lg font-bold text-blue-800">👤 Kundenkonfiguration</h1>
          <p className="text-blue-600 text-sm">Weinprofil: {weinprofilId} • Kunde: {customerId}</p>
        </div>
      )}
      
      {/* Ihr bestehender Konfigurator - einfach mit Props erweitert */}
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