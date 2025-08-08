"use client";

import { useRef, useEffect } from 'react';
import EtikettenHistorie from './EtikettenHistorie';

export default function EtikettUploader({ 
    onUpload,
    isProcessing,
    processingProgress = 0,
    processingMessage = '',
    isReady,
    fabricRef,
    globalEtiketten,
    onThumbnailClick,
    onEtikettDelete
}) {
    const isDisabled = !isReady || isProcessing;
    const fileInputRef = useRef(null);

    // Debug: Props prüfen
    console.log('🔍 EtikettUploader Props:', {
        isProcessing,
        processingProgress,
        processingMessage,
        isReady
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log("1. Datei im Input-Feld erkannt:", file);
        console.log("2. Status-Check:", { isReady, isProcessing, isDisabled });
        
        if (file) {
            // Validiere Dateityp
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
            const fileName = file.name.toLowerCase();
            const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!allowedTypes.includes(file.type) && !hasValidExtension) {
                alert("Ungültiger Dateityp. Bitte verwenden Sie JPG, PNG oder PDF.");
                return;
            }
            
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
            // Validiere Dateityp
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
            const fileName = file.name.toLowerCase();
            const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!allowedTypes.includes(file.type) && !hasValidExtension) {
                alert("Ungültiger Dateityp. Bitte verwenden Sie JPG, PNG oder PDF.");
                return;
            }
            
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
                    accept="image/jpeg, image/png, application/pdf"
                    disabled={isDisabled}
                />
                
                {isProcessing ? (
                    <div className="text-center">
                        <div className="text-blue-600 mb-3">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                            <p className="font-medium">{processingMessage || 'Etikett wird verarbeitet...'}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: `${Math.max(5, processingProgress)}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-500">{processingProgress}% abgeschlossen</p>
                    </div>
                ) : !isReady ? (
                    <p className="text-red-600">Konfigurator wird geladen...</p>
                ) : (
                    <>
                        <p className="text-gray-500 mb-2">
                            Ziehen Sie Ihr Etikett hierher oder klicken Sie, um eine Datei auszuwählen.
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                            JPG, PNG oder PDF (mit automatischer Schnittmarken-Erkennung).
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
                <p>Unterstützte Formate: JPG, PNG, PDF</p>
                <p>📄 PDFs werden automatisch in Bilder konvertiert und auf Schnittmarken geprüft</p>
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