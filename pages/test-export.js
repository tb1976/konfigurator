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

    const clearResults = () => {
        setTestResults([]);
    };

    return (
        <>
            <Head>
                <title>Ninox Export Tests</title>
            </Head>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">
                            🧪 Ninox Export Tests
                        </h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={testDirectExport}
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Direct Export API Test
                            </button>
                            
                            <button
                                onClick={clearResults}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Clear Results
                            </button>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">
                                Test Ergebnisse ({testResults.length})
                            </h2>
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
                </div>
            </div>
        </>
    );
}
