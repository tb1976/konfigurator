// pages/konfigurator/ninox/[recordId].js
// Direkte Ninox-Integration Seite

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Konfigurator from '../../../components/Konfigurator';
import Head from 'next/head';

export default function NinoxKonfigurator() {
    const router = useRouter();
    const { recordId, autoExport } = router.query;
    const [configuration, setConfiguration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!recordId) return;

        const loadNinoxConfiguration = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/ninox/configuration/${recordId}`);
                
                if (!response.ok) {
                    throw new Error('Datensatz konnte nicht geladen werden');
                }
                
                const data = await response.json();
                setConfiguration(data.configuration);
                setError(null);
            } catch (err) {
                console.error('Fehler beim Laden der Ninox-Konfiguration:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadNinoxConfiguration();
    }, [recordId]);

    const handleSaveToNinox = async (updatedConfiguration) => {
        try {
            const response = await fetch(`/api/ninox/configuration/${recordId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedConfiguration)
            });

            if (!response.ok) {
                throw new Error('Konfiguration konnte nicht gespeichert werden');
            }

            const result = await response.json();
            console.log('✅ Erfolgreich in Ninox gespeichert:', result);
            
            // Zeige Erfolgs-Nachricht
            alert('Konfiguration wurde erfolgreich in Ninox gespeichert!');
            
        } catch (error) {
            console.error('❌ Fehler beim Speichern in Ninox:', error);
            alert('Fehler beim Speichern in Ninox: ' + error.message);
        }
    };

    const handleAutoExport = async (canvas) => {
        if (!autoExport || !canvas) return;
        
        setExporting(true);
        try {
            // Canvas zu Blob konvertieren
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            
            // Als Base64 für API konvertieren
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result;
                
                // Dateiname aus Konfiguration bestimmen
                const filename = configuration?.filename || `flasche-${recordId}`;
                
                // An Export-API senden
                const exportResponse = await fetch(`/api/ninox/export-simple/${recordId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageData: base64Data,
                        filename: filename,
                        format: 'png'
                    })
                });

                if (exportResponse.ok) {
                    // Download auslösen
                    const blob = await exportResponse.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filename}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    
                    console.log('✅ Export erfolgreich');
                } else {
                    console.error('❌ Export fehlgeschlagen');
                }
            };
            reader.readAsDataURL(blob);
            
        } catch (error) {
            console.error('❌ Auto-Export Fehler:', error);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Lade Konfiguration aus Ninox...</h2>
                    <p className="text-gray-500 mt-2">Datensatz ID: {recordId}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Fehler beim Laden</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => router.back()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Zurück
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Head>
                <title>Flaschen-Konfigurator - Ninox Integration</title>
                <meta name="description" content="Konfigurieren Sie Ihre Flasche basierend auf Ninox-Daten" />
            </Head>

            {/* Auto-Export Indicator */}
            {autoExport && (
                <div className="bg-yellow-50 border-b border-yellow-200 p-3">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-sm text-yellow-800">
                            {exporting ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full mr-2"></span>
                                    Export wird vorbereitet...
                                </>
                            ) : (
                                '⬇️ Auto-Export aktiviert - Bild wird automatisch heruntergeladen'
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Ninox Information Header */}
            <div className="bg-blue-50 border-b border-blue-200 p-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">N</div>
                        <div>
                            <p className="text-sm font-medium text-blue-800">
                                Ninox-Integration aktiv
                            </p>
                            <p className="text-xs text-blue-600">
                                Datensatz: {recordId} • Änderungen werden automatisch synchronisiert
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSaveToNinox(configuration)}
                        className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        In Ninox speichern
                    </button>
                </div>
            </div>

            {/* Konfigurator */}
            <Konfigurator
                initialConfig={configuration}
                mode="ninox"
                customerId={recordId}
                onSaveCallback={handleSaveToNinox}
                onCanvasReady={autoExport ? handleAutoExport : null}
            />
        </div>
    );
}

// Optional: Server-side Rendering für bessere Performance
export async function getServerSideProps({ params, req }) {
    const { recordId } = params;
    
    try {
        // Lade Konfiguration auf Server-Seite
        const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
        const response = await fetch(`${baseUrl}/api/ninox/configuration/${recordId}`);
        
        if (response.ok) {
            const data = await response.json();
            return {
                props: {
                    initialConfiguration: data.configuration,
                    recordId
                }
            };
        }
    } catch (error) {
        console.error('SSR Fehler:', error);
    }
    
    // Fallback zu Client-side Loading
    return {
        props: {
            recordId
        }
    };
}
