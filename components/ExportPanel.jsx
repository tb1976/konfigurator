// components/ExportPanel.jsx - Erweitert mit Dateiname-Editor und Link-Popup
"use client";

import { Download, Share2, Link as LinkIcon, Edit3, Copy, X, Check } from 'lucide-react';
import { useState } from 'react';

function ExportCard({ icon, title, description, onClick, disabled, colorClass }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                group w-full flex items-center border rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                hover:-translate-y-0.5 p-3 shadow-sm hover:shadow-md
                ${disabled
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
            `}
        >
            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center mr-3 bg-gray-50 rounded-md transition-colors ${
                disabled ? 'text-gray-400' : colorClass
            }`}>
                {icon}
            </div>
            <div className="text-left flex-grow">
                <h4 className={`font-medium text-sm leading-tight transition-colors ${
                    disabled ? 'text-gray-500' : 'text-gray-800'
                }`}>
                    {title}
                </h4>
                <p className={`text-xs mt-1 transition-colors ${
                    disabled ? 'text-gray-400' : 'text-gray-500'
                }`}>
                    {description}
                </p>
            </div>
        </button>
    );
}

// Link-Popup Komponente
function LinkPopup({ isOpen, onClose, shareUrl }) {
    const [copied, setCopied] = useState(false);

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset nach 2 Sekunden
        } catch (error) {
            console.error('Fehler beim Kopieren:', error);
            // Fallback für ältere Browser
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Teilbarer Link</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Teilen Sie diesen Link, um Ihre Flaschenkonfiguration mit anderen zu teilen:
                    </p>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">URL:</div>
                        <div className="text-sm font-mono text-gray-800 break-all leading-relaxed">
                            {shareUrl}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleCopyToClipboard}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            copied 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {copied ? (
                            <>
                                <Check size={16} />
                                Link kopiert!
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                Link kopieren
                            </>
                        )}
                    </button>
                    
                    <div className="text-xs text-gray-500">
                        💡 Der Link enthält alle aktuellen Einstellungen und kann direkt geteilt werden.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExportPanel({ 
    activeFlasche, 
    exportableCanvas, 
    fabricRef, 
    flaschenConfig, 
    urlFilename, // Prop vom Konfigurator
    onGenerateConfigUrl // Neue Prop für URL-Generierung
}) {
    const [exportSize, setExportSize] = useState('display'); // 'display', 'original'
    const [customFilename, setCustomFilename] = useState(urlFilename || '');
    const [isEditingFilename, setIsEditingFilename] = useState(false);
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    
    // Exportgrößen definieren
    const getExportOptions = () => {
        // Original-Seitenverhältnis: 960 x 3000 = 1:3.125
        const aspectRatio = 3000 / 960; // 3.125
        
        return {
            display: {
                label: 'Display-Größe (700px)',
                description: 'Wie auf dem Bildschirm angezeigt',
                width: Math.round(700 / aspectRatio), // ca. 224px Breite
                height: 700
            },
            original: {
                label: 'Original-Größe (3000px)',
                description: 'Vollauflösung für Druck',
                width: 960, // Original-Breite
                height: 3000 // Original-Höhe
            }
        };
    };

    // Aktueller Dateiname (Custom > URL > Standard)
    const getCurrentFilename = () => {
        if (isEditingFilename || customFilename) {
            return customFilename;
        }
        return urlFilename || '';
    };

    // Filename generieren basierend auf verschiedenen Quellen
    const generateFilename = (selectedSize = exportSize) => {
        const exportOptions = getExportOptions();
        const sizeConfig = exportOptions[selectedSize];
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        
        const currentFilename = getCurrentFilename();
        
        // Priorität: Custom-Input > URL-Parameter > Standard-Name
        if (currentFilename.trim()) {
            // Custom/URL-Filename verwenden
            const baseFilename = currentFilename.replace(/\.(png|jpg|jpeg|pdf)$/i, ''); // Entferne eventuelle Dateiendung
            return `${baseFilename}.png`;
        } else {
            // Fallback auf Standard-Naming
            return `flaschen-konfiguration-${sizeConfig.height}px-${timestamp}.png`;
        }
    };

    // Dateiname-Editor Funktionen
    const handleFilenameEdit = () => {
        setIsEditingFilename(true);
        setCustomFilename(getCurrentFilename());
    };

    const handleFilenameSave = () => {
        setIsEditingFilename(false);
        // Optional: Custom filename in URL Parameter übernehmen
        console.log('💾 Custom Filename gesetzt:', customFilename);
    };

    const handleFilenameCancel = () => {
        setIsEditingFilename(false);
        setCustomFilename(urlFilename || '');
    };

    const createExportCanvas = async (selectedSize = exportSize) => {
        if (!exportableCanvas || !fabricRef?.current?.canvas || !flaschenConfig) {
            return null;
        }

        try {
            const exportOptions = getExportOptions();
            const sizeConfig = exportOptions[selectedSize];
            
            const { domToPng } = await import('modern-screenshot');
            const flaschenContainer = document.querySelector('[data-konfigurator-flasche]');
            if (!flaschenContainer) {
                console.error('Flaschenkonfigurator-Container nicht gefunden');
                return null;
            }

            // Erstelle zunächst ein hochauflösendes Bild
            const dataUrl = await domToPng(flaschenContainer, {
                quality: 1.0,
                pixelRatio: 4, // Hohe Auflösung für bessere Qualität beim Skalieren
                style: { transform: 'none' }
            });

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Setze die exakte gewünschte Export-Größe
                    canvas.width = sizeConfig.width;
                    canvas.height = sizeConfig.height;
                    
                    // Hochqualitative Skalierung aktivieren
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Skaliere das hochauflösende Bild auf die gewünschte Größe
                    ctx.drawImage(img, 0, 0, sizeConfig.width, sizeConfig.height);
                    
                    console.log('Export Canvas erstellt:', {
                        gewünschteGröße: `${sizeConfig.width}x${sizeConfig.height}`,
                        tatsächlicheGröße: `${canvas.width}x${canvas.height}`,
                        originalBildGröße: `${img.width}x${img.height}`,
                        filename: generateFilename(selectedSize),
                        customFilename: customFilename,
                        urlFilename: urlFilename
                    });
                    
                    resolve(canvas);
                };
                img.src = dataUrl;
            });
        } catch (error) {
            console.error("Fehler beim Erstellen des Export-Canvas:", error);
            return null;
        }
    };

    const handleDownload = async () => {
        const finalCanvas = await createExportCanvas();
        if (!finalCanvas) {
            alert("Export fehlgeschlagen.");
            return;
        }
        
        const filename = generateFilename();
        console.log('💾 Download gestartet mit Filename:', filename);
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = finalCanvas.toDataURL('image/png', 1.0);
        link.click();
    };

    const handleShare = async () => {
        const finalCanvas = await createExportCanvas();
        if (!finalCanvas) {
            alert("Share fehlgeschlagen.");
            return;
        }
        if (navigator.share) {
            finalCanvas.toBlob((blob) => {
                const filename = generateFilename();
                const file = new File([blob], filename, { type: 'image/png' });
                const exportOptions = getExportOptions();
                const sizeConfig = exportOptions[exportSize];
                
                console.log('📤 Share gestartet mit Filename:', filename);
                
                navigator.share({
                    title: 'Meine Flaschenkonfiguration',
                    text: `Schau dir meine Flaschenkonfiguration an! (${sizeConfig.label})`,
                    files: [file]
                }).catch(e => console.log("Share-Fehler", e));
            }, 'image/png');
        } else {
            alert("Die Web Share API wird von Ihrem Browser nicht unterstützt.");
        }
    };

    const handleGenerateLink = () => {
        // URL vom Konfigurator generieren lassen
        if (onGenerateConfigUrl) {
            const generatedUrl = onGenerateConfigUrl();
            setShareUrl(generatedUrl);
            setShowLinkPopup(true);
        } else {
            // Fallback falls Callback nicht verfügbar
            const currentUrl = window.location.href;
            setShareUrl(currentUrl);
            setShowLinkPopup(true);
        }
    };

    const isReady = exportableCanvas && fabricRef?.current?.canvas;

    return (
        <div className="space-y-4 p-2">
            <p className="text-sm text-gray-600 mb-4">Exportieren Sie Ihre fertige Flaschenkonfiguration.</p>
            
            {/* Dateiname-Editor */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Dateiname:</label>
                    {!isEditingFilename && (
                        <button
                            onClick={handleFilenameEdit}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                            <Edit3 size={12} />
                            Bearbeiten
                        </button>
                    )}
                </div>
                
                {isEditingFilename ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={customFilename}
                            onChange={(e) => setCustomFilename(e.target.value)}
                            placeholder="Gewünschter Dateiname (ohne .png)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleFilenameSave}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                                Speichern
                            </button>
                            <button
                                onClick={handleFilenameCancel}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-800 font-mono break-all">
                        {generateFilename()}
                    </div>
                )}
                
                {(urlFilename && !isEditingFilename) && (
                    <div className="mt-2 text-xs text-blue-600">
                        📁 Basiert auf URL-Parameter: {urlFilename}
                    </div>
                )}
            </div>
            
            {/* Export-Größe Auswahl */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export-Größe auswählen:
                </label>
                <div className="space-y-2">
                    {Object.entries(getExportOptions()).map(([key, option]) => (
                        <label key={key} className="flex items-start space-x-3 cursor-pointer">
                            <input
                                type="radio"
                                name="exportSize"
                                value={key}
                                checked={exportSize === key}
                                onChange={(e) => setExportSize(e.target.value)}
                                className="mt-1 text-blue-600"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                    {option.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {option.description} • {option.width} × {Math.round(option.height)} px
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                <ExportCard 
                    icon={<Download size={20} />}
                    title="Als PNG herunterladen"
                    description={`${getExportOptions()[exportSize].label} • ${getCurrentFilename() ? 'Custom Filename' : 'Standard-Naming'}`}
                    onClick={handleDownload}
                    disabled={!isReady}
                    colorClass="text-blue-600"
                />
                <ExportCard 
                    icon={<Share2 size={20} />}
                    title="Konfiguration teilen"
                    description={`${getExportOptions()[exportSize].label} • Via Apps teilen`}
                    onClick={handleShare}
                    disabled={!isReady || !navigator.share}
                    colorClass="text-purple-600"
                />
                <ExportCard 
                    icon={<LinkIcon size={20} />}
                    title="Teilbaren Link erstellen"
                    description="URL mit allen Einstellungen generieren und kopieren"
                    onClick={handleGenerateLink}
                    disabled={!isReady}
                    colorClass="text-green-600"
                />
            </div>
            
            {!activeFlasche && (
                <p className="text-sm text-center text-gray-400 mt-4">
                    Wählen Sie zuerst eine Flasche aus.
                </p>
            )}
            
            {/* Link-Popup */}
            <LinkPopup 
                isOpen={showLinkPopup}
                onClose={() => setShowLinkPopup(false)}
                shareUrl={shareUrl}
            />
        </div>
    );
}