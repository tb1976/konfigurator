// components/ExportPanel.jsx
"use client";

import { Download, Mail, Share2, Link as LinkIcon, Settings } from 'lucide-react';
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


export default function ExportPanel({ activeFlasche, exportableCanvas, fabricRef, flaschenConfig }) {
    const [exportSize, setExportSize] = useState('display'); // 'display', 'original'
    
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
                        originalBildGröße: `${img.width}x${img.height}`
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
        
        const exportOptions = getExportOptions();
        const sizeConfig = exportOptions[exportSize];
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const filename = `flaschen-konfiguration-${sizeConfig.height}px-${timestamp}.png`;
        
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
                const exportOptions = getExportOptions();
                const sizeConfig = exportOptions[exportSize];
                const file = new File([blob], `flaschen-konfiguration-${sizeConfig.height}px.png`, { type: 'image/png' });
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
        // Diese Funktion muss aus Konfigurator.jsx übergeben werden oder die Logik hierher verschoben werden.
        // Fürs Erste simulieren wir es.
        alert("Link-Generierung wird implementiert.");
    };

    const isReady = exportableCanvas && fabricRef?.current?.canvas;

    return (
        <div className="space-y-4 p-2">
            <p className="text-sm text-gray-600 mb-4">Exportieren Sie Ihre fertige Flaschenkonfiguration.</p>
            
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
                    description={`${getExportOptions()[exportSize].label} • Hochauflösung`}
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
                    description="Link kopieren und manuell versenden"
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
        </div>
    );
}