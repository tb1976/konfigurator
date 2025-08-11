"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import EtikettenHistorie from './EtikettenHistorie';

// ImageSettingSlider als EXTERNE Komponente
const ImageSettingSlider = ({ 
    label, 
    value, 
    onChange, 
    min = -100, 
    max = 100, 
    step = 1,
    unit = '',
    description = ''
}) => {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <span className="text-sm text-gray-500">{value}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                    e.stopPropagation();
                    onChange(Number(e.target.value));
                }}
                onInput={(e) => {
                    e.stopPropagation();
                    onChange(Number(e.target.value));
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            {description && (
                <p className="text-xs text-gray-500">{description}</p>
            )}
        </div>
    );
};

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
    
    // Bildbearbeitungs-States
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [imageSettings, setImageSettings] = useState({
        brightness: 0,    // -100 bis 100
        contrast: 0,      // -100 bis 100
        highlights: 0,    // -100 bis 100 (Gamma für Lichter)
        midtones: 0,      // -100 bis 100 (Gamma für Mitten)
        shadows: 0,       // -100 bis 100 (Gamma für Tiefen)
        shadowOpacity: 28 // 0 bis 100 (entspricht 0.0 bis 1.0)
    });

    // Debounced Werte NUR für die Filter-Anwendung (250ms Delay)
    const debouncedImageSettings = useDebounce(imageSettings, 250);

    // Debug: Props prüfen
    console.log('🔍 EtikettUploader Props:', {
        isProcessing,
        processingProgress,
        processingMessage,
        isReady
    });

    // Bildfilter auf das aktuelle Etikett anwenden
    const applyImageFilters = (settings = debouncedImageSettings) => {
        if (!fabricRef?.current?.canvas) return;
        
        const canvas = fabricRef.current.canvas;
        const fabric = fabricRef.current.lib;
        const etikett = canvas.getObjects().find(obj => obj.name === 'etikett');
        const schatten = canvas.getObjects().find(obj => obj.name === 'schatten');
        
        if (!etikett) return;

        // Entferne alle bestehenden Filter vom Etikett
        etikett.filters = [];
        
        // Helligkeit Filter
        if (settings.brightness !== 0) {
            const brightnessFilter = new fabric.filters.Brightness({
                brightness: settings.brightness / 100 // Fabric erwartet -1 bis 1
            });
            etikett.filters.push(brightnessFilter);
        }
        
        // Kontrast Filter
        if (settings.contrast !== 0) {
            const contrastFilter = new fabric.filters.Contrast({
                contrast: settings.contrast / 100 // Fabric erwartet -1 bis 1
            });
            etikett.filters.push(contrastFilter);
        }
        
        // Gamma-Filter für Lichter, Mitten, Tiefen (simuliert durch Gamma-Korrektur)
        if (settings.highlights !== 0) {
            const gammaFilter = new fabric.filters.Gamma({
                gamma: [1 + (settings.highlights / 200), 1, 1] // Rot-Kanal für Lichter
            });
            etikett.filters.push(gammaFilter);
        }
        
        if (settings.midtones !== 0) {
            const gammaFilter = new fabric.filters.Gamma({
                gamma: [1, 1 + (settings.midtones / 200), 1] // Grün-Kanal für Mitten
            });
            etikett.filters.push(gammaFilter);
        }
        
        if (settings.shadows !== 0) {
            const gammaFilter = new fabric.filters.Gamma({
                gamma: [1, 1, 1 + (settings.shadows / 200)] // Blau-Kanal für Tiefen
            });
            etikett.filters.push(gammaFilter);
        }
        
        // Filter auf Etikett anwenden
        etikett.applyFilters();
        
        // Schatten-Opacity anpassen
        if (schatten) {
            const newOpacity = settings.shadowOpacity / 100; // Konvertiere 0-100 zu 0.0-1.0
            schatten.set('opacity', newOpacity);
            console.log(`🌓 Schatten-Opacity auf ${newOpacity} (${settings.shadowOpacity}%) gesetzt`);
        }
        
        canvas.renderAll();
        
        console.log('🎨 Debounced Bildfilter angewendet nach 250ms:', settings);
    };

    // Filter NUR bei debounced Werten anwenden (nicht bei sofortigen UI-Updates)
    useEffect(() => {
        if (showImageEditor) {
            applyImageFilters(debouncedImageSettings);
        }
    }, [debouncedImageSettings, showImageEditor]);

    // Reset-Funktion für alle Bildeinstellungen
    const resetImageSettings = () => {
        setImageSettings({
            brightness: 0,
            contrast: 0,
            highlights: 0,
            midtones: 0,
            shadows: 0,
            shadowOpacity: 28 // Zurück zum Standard-Wert
        });
    };

    // Einzelne Einstellung ändern (memoized für stabile Referenz)
    const updateImageSetting = useCallback((key, value) => {
        // Verwende funktionales Update um Race Conditions zu vermeiden
        setImageSettings(prev => {
            const newSettings = {
                ...prev,
                [key]: value
            };
            // Console-Log für sofortige UI-Updates (optional)
            console.log(`🎨 UI Update: ${key} = ${value}`, newSettings);
            return newSettings;
        });
    }, []);

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
            
            // Bildbearbeitung nach Upload anzeigen
            setTimeout(() => {
                setShowImageEditor(true);
            }, 1000);
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
            
            // Bildbearbeitung nach Upload anzeigen
            setTimeout(() => {
                setShowImageEditor(true);
            }, 1000);
        }
    };

    // Prüfen ob ein Etikett auf dem Canvas ist
    const hasEtikettOnCanvas = () => {
        if (!fabricRef?.current?.canvas) return false;
        const canvas = fabricRef.current.canvas;
        return canvas.getObjects().some(obj => obj.name === 'etikett');
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

            {/* Bildbearbeitungs-Panel */}
            {hasEtikettOnCanvas() && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowImageEditor(!showImageEditor)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">🎨 Bildbearbeitung</span>
                            <span className="text-xs text-gray-500">(Helligkeit, Kontrast, Gamma)</span>
                        </div>
                        {showImageEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {showImageEditor && (
                        <div className="p-4 bg-white space-y-4">
                            {/* Reset Button */}
                            <div className="flex justify-end pb-3 border-b border-gray-200">
                                <button
                                    onClick={resetImageSettings}
                                    className="flex items-center gap-2 px-3 py-1 rounded text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                    Zurücksetzen
                                </button>
                            </div>
                            
                            {/* Grundeinstellungen */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">
                                    Grundeinstellungen
                                </h4>
                                
                                <ImageSettingSlider
                                    label="Helligkeit"
                                    value={imageSettings.brightness}
                                    onChange={(value) => updateImageSetting('brightness', value)}
                                    description="Macht das gesamte Bild heller oder dunkler"
                                />
                                
                                <ImageSettingSlider
                                    label="Kontrast"
                                    value={imageSettings.contrast}
                                    onChange={(value) => updateImageSetting('contrast', value)}
                                    description="Verstärkt oder schwächt den Unterschied zwischen hellen und dunklen Bereichen"
                                />
                            </div>
                            
                            {/* Erweiterte Gamma-Einstellungen */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">
                                    Erweiterte Einstellungen
                                </h4>
                                
                                <ImageSettingSlider
                                    label="Lichter (Highlights)"
                                    value={imageSettings.highlights}
                                    onChange={(value) => updateImageSetting('highlights', value)}
                                    description="Beeinflusst nur die hellsten Bereiche des Bildes"
                                />
                                
                                <ImageSettingSlider
                                    label="Mitteltöne (Midtones)"
                                    value={imageSettings.midtones}
                                    onChange={(value) => updateImageSetting('midtones', value)}
                                    description="Beeinflusst die mittleren Grautöne"
                                />
                                
                                <ImageSettingSlider
                                    label="Tiefen (Shadows)"
                                    value={imageSettings.shadows}
                                    onChange={(value) => updateImageSetting('shadows', value)}
                                    description="Beeinflusst nur die dunkelsten Bereiche des Bildes"
                                />
                            </div>
                            
                            {/* Schatten-Einstellungen */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-1">
                                    Schatten-Einstellungen
                                </h4>
                                
                                <ImageSettingSlider
                                    label="Schatten-Opacity"
                                    value={imageSettings.shadowOpacity}
                                    onChange={(value) => updateImageSetting('shadowOpacity', value)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    unit="%"
                                    description="Steuert die Sichtbarkeit des Etikett-Schattens"
                                />
                            </div>
                            
                            {/* Info-Text */}
                            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                                <p><strong>💡 Tipp:</strong> Verwenden Sie die Lichter-, Mitteltöne- und Tiefen-Regler für präzise Anpassungen bestimmter Tonwertbereiche.</p>
                                <p className="mt-1">Die Slider reagieren sofort, Filter werden nach 250ms angewendet für optimale Performance.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                <p>Maximale Dateigröße: 10 MB</p>
                <p>Empfohlene Auflösung: 300 DPI, beliebiges Seitenverhältnis</p>
                <p>Unterstützte Formate: JPG, PNG, PDF</p>
                <p>📄 PDFs werden automatisch in Bilder konvertiert und auf Schnittmarken geprüft</p>
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