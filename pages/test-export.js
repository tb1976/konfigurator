// pages/test-export.js
// Test-Seite für Ninox Export Funktionen

import { useState } from 'react';
import Head from 'next/head';

export default function TestExport() {
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const addResult = (test, success, message) => {
        setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
    };

    const testDirectExport = async () => {
        setLoading(true);
        addResult('Direct Export API', null, 'Teste direkten Export...');
        
        try {
            const response = await fetch('/api/ninox/export-simple/test-123');
            
            if (response.ok) {
                const result = await response.json();
                addResult('Direct Export API', true, `✅ Export-URL generiert: ${result.exportUrl}`);
            } else {
                addResult('Direct Export API', false, `❌ Fehler: ${response.status}`);
            }
        } catch (error) {
            addResult('Direct Export API', false, `❌ Fehler: ${error.message}`);
        }
        
        setLoading(false);
    };

    const testNinoxIntegration = async () => {
        setLoading(true);
        addResult('Ninox Integration', null, 'Teste Ninox URL-Generierung...');
        
        try {
            // Test URL-Generierung
            const testUrl = `/konfigurator/ninox/test-123?autoExport=true`;
            addResult('Ninox Integration', true, `✅ Test-URL: ${testUrl}`);
            
            // Test Parameter-URL
            const paramUrl = `/konfigurator?bottle=bd75optima&cork=natur&cap=gold&wine=rot&filename=test-flasche&customerId=test-123`;
            addResult('Ninox Integration', true, `✅ Parameter-URL: ${paramUrl}`);
            
            // Test mit Etikett-URL
            const etikettUrl = `/konfigurator?bottle=bd75optima&etikettSrc=${encodeURIComponent('https://via.placeholder.com/200x150/FF6B6B/FFFFFF?text=Test+Label')}&etikettTop=50&etikettLeft=30&etikettScaleX=1.2&filename=test-mit-etikett`;
            addResult('Ninox Integration', true, `✅ Etikett-URL: ${etikettUrl}`);
            
        } catch (error) {
            addResult('Ninox Integration', false, `❌ Fehler: ${error.message}`);
        }
        
        setLoading(false);
    };

    const testImageExport = async () => {
        setLoading(true);
        addResult('Image Export', null, 'Teste Bild-Export...');
        
        try {
            // Erstelle ein Test-Canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            
            // Zeichne ein Test-Bild
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 400, 600);
            ctx.fillStyle = '#333';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Test Flasche', 200, 300);
            
            // Konvertiere zu Blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const reader = new FileReader();
            
            reader.onload = async () => {
                const base64Data = reader.result;
                
                // Sende an Export-API
                const response = await fetch('/api/ninox/export-simple/test-123', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageData: base64Data,
                        filename: 'test-export',
                        format: 'png'
                    })
                });

                if (response.ok) {
                    addResult('Image Export', true, '✅ Bild-Export erfolgreich');
                    
                    // Download auslösen
                    const downloadBlob = await response.blob();
                    const url = window.URL.createObjectURL(downloadBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'test-export.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } else {
                    addResult('Image Export', false, `❌ Export fehlgeschlagen: ${response.status}`);
                }
            };
            
            reader.readAsDataURL(blob);
            
        } catch (error) {
            addResult('Image Export', false, `❌ Fehler: ${error.message}`);
        }
        
        setLoading(false);
    };

    const clearResults = () => {
        setTestResults([]);
    };

    const openTestKonfigurator = () => {
        window.open('/konfigurator/ninox/test-123?autoExport=true', '_blank');
    };

    const openTestWithLabel = () => {
        const etikettUrl = 'https://via.placeholder.com/200x150/FF6B6B/FFFFFF?text=Test+Label';
        const testUrl = `/konfigurator?bottle=bd75optima&cork=natur&cap=gold&wine=rot&etikettSrc=${encodeURIComponent(etikettUrl)}&etikettTop=50&etikettLeft=30&etikettScaleX=1.2&etikettScaleY=1.2&filename=test-mit-etikett`;
        window.open(testUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Head>
                <title>Ninox Export Tests</title>
            </Head>

            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        🧪 Ninox Export Tests
                    </h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <button
                            onClick={testDirectExport}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Direct Export API
                        </button>
                        
                        <button
                            onClick={testNinoxIntegration}
                            disabled={loading}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            Ninox Integration
                        </button>
                        
                        <button
                            onClick={testImageExport}
                            disabled={loading}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            Image Export
                        </button>
                        
                        <button
                            onClick={openTestKonfigurator}
                            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                        >
                            Test Konfigurator
                        </button>
                        
                        <button
                            onClick={openTestWithLabel}
                            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
                        >
                            Test mit Etikett
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">
                            Test Ergebnisse ({testResults.length})
                        </h2>
                        <button
                            onClick={clearResults}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Löschen
                        </button>
                    </div>
                </div>

                {/* Test Results */}
                <div className="space-y-2">
                    {testResults.map((result, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-md border-l-4 ${
                                result.success === true 
                                    ? 'bg-green-50 border-green-500' 
                                    : result.success === false
                                    ? 'bg-red-50 border-red-500'
                                    : 'bg-blue-50 border-blue-500'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-800">
                                        {result.test}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {result.message}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {result.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {testResults.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Keine Tests durchgeführt. Klicken Sie auf einen Test-Button oben.
                        </div>
                    )}
                </div>

                {/* Example Usage */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        📋 Beispiel-URLs für Ninox
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">1. Direkte Ninox-Integration:</h3>
                            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                                https://your-domain.com/konfigurator/ninox/[RECORD_ID]
                            </code>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">2. Mit Auto-Export:</h3>
                            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                                https://your-domain.com/konfigurator/ninox/[RECORD_ID]?autoExport=true
                            </code>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">3. URL-Parameter mit Etikett:</h3>
                            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                                https://your-domain.com/konfigurator?bottle=bd75optima&cork=natur&cap=gold&wine=rot&etikettSrc=https://example.com/label.png&filename=meine-flasche
                            </code>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">4. Vollständige Etikett-Konfiguration:</h3>
                            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                                https://your-domain.com/konfigurator?bottle=bd75optima&etikettSrc=https://example.com/label.png&etikettTop=50&etikettLeft=30&etikettScaleX=1.2&etikettScaleY=1.2&etikettRotation=5
                            </code>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-700 mb-2">5. API Export:</h3>
                            <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                                GET /api/ninox/export-simple/[RECORD_ID]
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
