"use client";

import { useRef, useEffect } from 'react';
import EtikettenHistorie from './EtikettenHistorie';

export default function EtikettUploader({ 
    onUpload,
    isProcessing,
    isReady,
    fabricRef,
    globalEtiketten,
    onThumbnailClick,
    onEtikettDelete
}) {
    const isDisabled = !isReady || isProcessing;
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log("1. Datei im Input-Feld erkannt:", file);
        console.log("2. Status-Check:", { isReady, isProcessing, isDisabled });
        
        if (file) {
            if (!isReady) {
                console.error("FEHLER: Fabric ist nicht bereit!");
                alert("Der Konfigurator ist noch nicht vollständig geladen.");
                return;
            }
            if (isProcessing) {
                console.error("FEHLER: Upload bereits in Bearbeitung!");
                return;
            }
            console.log("3. Rufe onUpload-Funktion aus Konfigurator auf.");
            onUpload(file);
        } else {
            console.log("Keine Datei ausgewählt.");
        }
    };

    const handleDropZoneClick = () => {
        console.log("Drop-Zone geklickt, Status:", { isReady, isProcessing });
        if (!isProcessing && isReady) {
            console.log("Öffne Dateiauswahl...");
            fileInputRef.current?.click();
        } else {
            console.log("Upload blockiert - Fabric nicht bereit oder bereits in Bearbeitung");
        }
    };
    
    const handleDragOver = (e) => e.preventDefault();
    
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        console.log("1. Datei per Drag & Drop erkannt:", file);
        console.log("2. Status-Check:", { isReady, isProcessing, isDisabled });
        
        if (file) {
            if (!isReady) {
                console.error("FEHLER: Fabric ist nicht bereit!");
                alert("Der Konfigurator ist noch nicht vollständig geladen.");
                return;
            }
            if (isProcessing) {
                console.error("FEHLER: Upload bereits in Bearbeitung!");
                return;
            }
            console.log("3. Rufe onUpload-Funktion aus Konfigurator auf.");
            onUpload(file);
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-600 mb-4">Laden Sie ein eigenes Etikett hoch oder wählen Sie aus bereits verwendeten Etiketten.</p>
            
            <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    !isDisabled 
                        ? 'border-gray-300 cursor-pointer hover:border-blue-500 hover:bg-gray-50' 
                        : 'border-red-300 cursor-not-allowed bg-red-50'
                }`}
                onClick={handleDropZoneClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg, image/png"
                    disabled={isDisabled}
                />
                
                {isProcessing ? (
                    <p className="text-blue-600 animate-pulse">Etikett wird verarbeitet...</p>
                ) : !isReady ? (
                    <p className="text-red-600">Konfigurator wird geladen...</p>
                ) : (
                    <>
                        <p className="text-gray-500 mb-2">
                            Ziehen Sie Ihr Etikett hierher oder klicken Sie, um eine Datei auszuwählen.
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                            Nur JPG oder PNG.
                        </p>
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                            💡 <strong>Tipp:</strong> Sie können Etiketten auch direkt auf die Flasche ziehen!
                        </div>
                    </>
                )}
            </div>
            <div className="mt-4 text-xs text-gray-500">
                <p>Maximale Dateigröße: 10 MB</p>
                <p>Empfohlene Auflösung: 300 DPI, beliebiges Seitenverhältnis</p>
                <p>Unterstützte Formate: JPG, PNG</p>
                <p>💡 Krümmung wird automatisch an die Bildgröße angepasst</p>
            </div>
            <div>
                <EtikettenHistorie
                    etiketten={globalEtiketten}
                    onSelect={onThumbnailClick}
                    onDelete={onEtikettDelete}
                />
            </div>
        </div>
    );
}