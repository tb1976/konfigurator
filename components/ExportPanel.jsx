// components/ExportPanel.jsx
"use client";

import { Download, Mail, Share2, Link as LinkIcon } from 'lucide-react';

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
    const createExportCanvas = async () => {
        if (!exportableCanvas || !fabricRef?.current?.canvas || !flaschenConfig) {
            return null;
        }

        try {
            const { domToPng } = await import('modern-screenshot');
            const flaschenContainer = document.querySelector('[data-konfigurator-flasche]');
            if (!flaschenContainer) {
                console.error('Flaschenkonfigurator-Container nicht gefunden');
                return null;
            }

            const dataUrl = await domToPng(flaschenContainer, {
                quality: 1.0,
                pixelRatio: 2,
                style: { transform: 'none' }
            });

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
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
        const link = document.createElement('a');
        link.download = 'flaschen-konfiguration.png';
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
                const file = new File([blob], 'flaschen-konfiguration.png', { type: 'image/png' });
                navigator.share({
                    title: 'Meine Flaschenkonfiguration',
                    text: 'Schau dir meine Flaschenkonfiguration an!',
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
            
            <div className="space-y-2">
                <ExportCard 
                    icon={<Download size={20} />}
                    title="Als PNG herunterladen"
                    description="Hochauflösendes Bild für Druck & Web"
                    onClick={handleDownload}
                    disabled={!isReady}
                    colorClass="text-blue-600"
                />
                <ExportCard 
                    icon={<Share2 size={20} />}
                    title="Konfiguration teilen"
                    description="Direkt über Apps wie WhatsApp teilen"
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