// components/HilfePanel.jsx
"use client";

export default function HilfePanel() {
    return (
        <div className="space-y-6 p-2">
            <p className="text-sm text-gray-600 mb-4">Hier finden Sie Hilfe zur Bedienung des Flaschen-Konfigurators.</p>
            
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Wie funktioniert der Konfigurator?</h4>
                <p className="text-sm text-gray-600 mb-4">
                    Gestalten Sie Ihre Wunschflasche in wenigen Schritten:
                </p>
                <ol className="text-sm text-gray-600 space-y-2 ml-4">
                    <li>1. Wählen Sie eine Flaschenform</li>
                    <li>2. Bestimmen Sie Korken und Kapsel</li>
                    <li>3. Legen Sie die Weinfarbe fest</li>
                    <li>4. Laden Sie Ihr Etikett hoch</li>
                    <li>5. Exportieren Sie das Ergebnis</li>
                </ol>
            </div>
            
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Navigation</h4>
                <div className="text-sm text-gray-600 space-y-3">
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span><strong>Haus-Symbol:</strong> Zurück zur Übersicht</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span><strong>Pfeil links:</strong> Einen Schritt zurück</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 rounded">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Korken</span>
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span><strong>Weiter-Button:</strong> Zum nächsten Schritt</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Etikett-Upload</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-700 space-y-2">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Unterstützte Formate:</strong> JPG, PNG, GIF</span>
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Empfohlene Auflösung:</strong> 300 DPI</span>
                        </div>
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>Maximale Dateigröße:</strong> 10 MB</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Tipps für beste Ergebnisse</h4>
                <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Verwenden Sie kontrastreiche Bilder für bessere Sichtbarkeit</span>
                    </div>
                    <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Achten Sie auf ausreichend Rand um wichtige Texte</span>
                    </div>
                    <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Testen Sie verschiedene Weinfarben für optimale Darstellung</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Probleme?</h4>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-red-800">
                            <p className="font-medium mb-1">Bei technischen Problemen:</p>
                            <ul className="space-y-1">
                                <li>• Laden Sie die Seite neu (F5)</li>
                                <li>• Leeren Sie den Browser-Cache</li>
                                <li>• Kontaktieren Sie unseren Support</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
                <div className="text-center text-xs text-gray-400">
                    Flaschenkonfigurator v2.0 - Entwickelt für optimale Benutzerfreundlichkeit
                </div>
            </div>
        </div>
    );
}