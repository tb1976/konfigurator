// components/KonfiguratorIntegration.jsx
// Komponente für Dashboard-Integration

import { useState } from 'react';

export function KonfiguratorEmbed({ 
    recordId = null, 
    config = {}, 
    height = "800px",
    showHeader = true 
}) {
    const [loading, setLoading] = useState(true);
    
    // URL generieren basierend auf Props
    const generateUrl = () => {
        const baseUrl = process.env.NEXT_PUBLIC_KONFIGURATOR_URL || 'https://konfigurator.yourdomain.com';
        
        if (recordId) {
            return `${baseUrl}/konfigurator/ninox/${recordId}`;
        }
        
        const params = new URLSearchParams();
        Object.entries(config).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        
        return `${baseUrl}/konfigurator?${params.toString()}`;
    };

    const konfiguratorUrl = generateUrl();

    return (
        <div className="konfigurator-embed border rounded-lg overflow-hidden">
            {showHeader && (
                <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">Flaschen-Konfigurator</h3>
                    <a 
                        href={konfiguratorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        In neuem Tab öffnen ↗
                    </a>
                </div>
            )}
            
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Konfigurator wird geladen...</p>
                        </div>
                    </div>
                )}
                
                <iframe 
                    src={konfiguratorUrl}
                    width="100%" 
                    height={height}
                    style={{ border: 'none' }}
                    title="Flaschen-Konfigurator"
                    onLoad={() => setLoading(false)}
                />
            </div>
        </div>
    );
}

export function KonfiguratorButton({ 
    recordId = null, 
    config = {}, 
    children = "Konfigurator öffnen",
    variant = "primary",
    autoExport = false 
}) {
    const openKonfigurator = () => {
        const baseUrl = process.env.NEXT_PUBLIC_KONFIGURATOR_URL || 'https://konfigurator.yourdomain.com';
        
        let url;
        if (recordId) {
            url = `${baseUrl}/konfigurator/ninox/${recordId}`;
        } else {
            const params = new URLSearchParams(config);
            url = `${baseUrl}/konfigurator?${params.toString()}`;
        }
        
        if (autoExport) {
            url += url.includes('?') ? '&autoExport=true' : '?autoExport=true';
        }
        
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const buttonClasses = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "bg-gray-600 hover:bg-gray-700 text-white",
        outline: "border border-blue-600 text-blue-600 hover:bg-blue-50"
    };

    return (
        <button
            onClick={openKonfigurator}
            className={`px-4 py-2 rounded-md transition-colors ${buttonClasses[variant]}`}
        >
            {children}
        </button>
    );
}

export function KonfiguratorAPI() {
    const baseUrl = process.env.NEXT_PUBLIC_KONFIGURATOR_URL || 'https://konfigurator.yourdomain.com';
    
    return {
        // Konfiguration laden
        async loadConfiguration(recordId) {
            const response = await fetch(`${baseUrl}/api/ninox/configuration/${recordId}`);
            if (!response.ok) throw new Error('Konfiguration konnte nicht geladen werden');
            return response.json();
        },
        
        // Konfiguration speichern
        async saveConfiguration(recordId, config) {
            const response = await fetch(`${baseUrl}/api/ninox/configuration/${recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (!response.ok) throw new Error('Konfiguration konnte nicht gespeichert werden');
            return response.json();
        },
        
        // Bild exportieren
        async exportImage(recordId, options = {}) {
            const response = await fetch(`${baseUrl}/api/ninox/export-simple/${recordId}`, {
                method: options.format ? 'POST' : 'GET',
                headers: options.format ? { 'Content-Type': 'application/json' } : {},
                body: options.format ? JSON.stringify(options) : undefined
            });
            if (!response.ok) throw new Error('Export fehlgeschlagen');
            return response.blob();
        },
        
        // URL generieren
        generateUrl(recordId = null, config = {}, autoExport = false) {
            let url;
            if (recordId) {
                url = `${baseUrl}/konfigurator/ninox/${recordId}`;
            } else {
                const params = new URLSearchParams(config);
                url = `${baseUrl}/konfigurator?${params.toString()}`;
            }
            
            if (autoExport) {
                url += url.includes('?') ? '&autoExport=true' : '?autoExport=true';
            }
            
            return url;
        }
    };
}

// Hook für einfache Nutzung
export function useKonfigurator() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const api = KonfiguratorAPI();
    
    const handleAsync = async (operation) => {
        setLoading(true);
        setError(null);
        try {
            const result = await operation();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };
    
    return {
        loading,
        error,
        loadConfiguration: (recordId) => handleAsync(() => api.loadConfiguration(recordId)),
        saveConfiguration: (recordId, config) => handleAsync(() => api.saveConfiguration(recordId, config)),
        exportImage: (recordId, options) => handleAsync(() => api.exportImage(recordId, options)),
        generateUrl: api.generateUrl
    };
}
