// components/Konfigurator.jsx
"use client";

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { BOTTLE_DATA, getFlaschenAuswahl, korkenDaten, kapselDaten, weinfarbenDaten } from '../lib/bottleData';
import { processEtikettImage } from '../lib/imageProcessor';
import AuswahlPanel from './AuswahlPanel';
import KonfiguratorAnsicht from './KonfiguratorAnsicht';
import SaveDraftModal from './SaveDraftModal';
import SuccessModal from './SuccessModal';
import { useDebounce } from '../hooks/useDebounce';
import { isWeinfarbeAllowed } from '../lib/bottleData';

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

export default function Konfigurator({ 
    initialConfig = null, 
    mode = 'standalone', 
    customerId = null, 
    onSaveCallback = null,
    onCanvasReady = null
}) {
    // States mit neuen Weinfarben-Eigenschaften
    const [activeFlasche, setActiveFlasche] = useState(null);
    const [activeKorken, setActiveKorken] = useState(null);
    const [activeKapsel, setActiveKapsel] = useState(null);
    const [activeWeinfarbe, setActiveWeinfarbe] = useState(null);
    const [customColor, setCustomColor] = useState('#FF6B6B');
    const [weinSettings, setWeinSettings] = useState({
        opacity: 1.0,
        contrast: 1.5,
        blendMode: 'multiply'
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFabricReady, setIsFabricReady] = useState(false);
    const [isEditingEtikett, setIsEditingEtikett] = useState(false);
    
    // Modal states
    const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedDraftName, setSavedDraftName] = useState('');

    useEffect(() => {
    console.log("🔧 isFabricReady Status geändert:", isFabricReady);
    }, [isFabricReady]);

    const [hasMounted, setHasMounted] = useState(false);
    const [exportableCanvas, setExportableCanvas] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const debouncedCustomColor = useDebounce(customColor, 150);
    const debouncedWeinSettings = useDebounce(weinSettings, 150);
    
    // Refs
    const fabricRef = useRef(null);
    const etikettCanvasRef = useRef(null);
    const mainRef = useRef(null);
    const sidebarRef = useRef(null);
    const korkenRef = useRef(null);
    const kapselRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const flaschenContainerRef = useRef(null);

    // Abgeleitete Daten
    const aktuelleFlaschenConfig = activeFlasche ? BOTTLE_DATA[activeFlasche] : null;
    const aktuellerKorken = activeKorken ? korkenDaten.find(k => k.id === activeKorken) : null;
    const aktuelleKapsel = activeKapsel ? kapselDaten.find(k => k.id === activeKapsel) : null;
    const flaschenAuswahlListe = getFlaschenAuswahl();
    const [globalEtiketten, setGlobalEtiketten] = useState([]);
    const [etikettenZustand, setEtikettenZustand] = useState({});
    const [entwuerfe, setEntwuerfe] = useState([]);
    const [etikettZuLaden, setEtikettZuLaden] = useState(null);

    const shadowOpacity = 0.28;

    useEffect(() => {
        setHasMounted(true);
        
        // Android-Erkennung
        const isAndroidDevice = typeof window !== 'undefined' && 
            /Android/i.test(navigator.userAgent);
        setIsAndroid(isAndroidDevice);
        
        // Funktion zur Überprüfung der Bildschirmgröße
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // Initiale Überprüfung
        checkMobile();
        
        // Event Listener für Größenänderungen
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Zusätzlicher Layout-Effect für kontinuierliche Mobile-Erkennung
    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            const currentIsMobile = window.innerWidth < 768;
            if (currentIsMobile !== isMobile) {
                setIsMobile(currentIsMobile);
            }
        }
    });

    // Berechne Mobile-Status direkt bei jeder Render
    const isCurrentlyMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Force Update für Android-Kompatibilität
    const [, forceUpdate] = useState({});
    useLayoutEffect(() => {
        if (isMenuOpen || activeMenuId) {
            forceUpdate({});
        }
    }, [isMenuOpen, activeMenuId]);

    // Android-spezifische Transform-Handhabung für beide Elemente
    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            const isMobileDevice = window.innerWidth < 768;
            const shouldTransform = isMenuOpen && isMobileDevice;
            
            const applyStyles = () => {
                // Main-Element Transform und Layout-Anpassung
                if (mainRef.current) {
                    if (shouldTransform) {
                        // Positioniere das Main-Element so, dass es bei 60% beginnt
                        const viewportWidth = window.innerWidth;
                        const sidebarWidth = Math.floor(viewportWidth * 0.6); // 60% der Viewport-Breite
                        
                        // Setze das Main-Element auf die volle Breite und positioniere es
                        mainRef.current.style.position = 'fixed';
                        mainRef.current.style.left = `${sidebarWidth}px`;
                        mainRef.current.style.right = '0';
                        mainRef.current.style.top = '0';
                        mainRef.current.style.bottom = '0';
                        mainRef.current.style.transform = 'none';
                        mainRef.current.style.width = 'auto';
                        
                        // Entferne die Zentrierung und setze auf links-ausgerichtet
                        mainRef.current.style.justifyContent = 'flex-start';
                        mainRef.current.style.paddingLeft = '10px'; // Kleiner Abstand vom Sidebar-Rand
                    } else {
                        // Zurücksetzen auf ursprüngliche Styles - immer wenn shouldTransform false ist
                        mainRef.current.style.position = '';
                        mainRef.current.style.left = '';
                        mainRef.current.style.right = '';
                        mainRef.current.style.top = '';
                        mainRef.current.style.bottom = '';
                        mainRef.current.style.transform = '';
                        mainRef.current.style.width = '';
                        mainRef.current.style.justifyContent = '';
                        mainRef.current.style.paddingLeft = '';
                    }
                }
                
                // Android-spezifische Sidebar-Breiten-Kontrolle
                if (isAndroid && sidebarRef.current && isMobileDevice) {
                    if (shouldTransform) {
                        // Explizite Breite auf Android setzen
                        const viewportWidth = window.innerWidth;
                        const sidebarWidth = Math.floor(viewportWidth * 0.6); // 60% der Viewport-Breite
                        sidebarRef.current.style.width = `${sidebarWidth}px`;
                        sidebarRef.current.style.maxWidth = `${sidebarWidth}px`;
                        console.log('🔧 Android Sidebar Breite gesetzt:', sidebarWidth + 'px');
                    } else {
                        // Breite zurücksetzen
                        sidebarRef.current.style.width = '';
                        sidebarRef.current.style.maxWidth = '';
                    }
                }
            };
            
            // Sofort anwenden
            applyStyles();
            
            // Zusätzlich nach kurzer Verzögerung für Android
            if (isAndroid) {
                setTimeout(applyStyles, 10);
            }
        }
    }, [isMenuOpen, isCurrentlyMobile, activeMenuId, isAndroid]);

    // Responsive Skalierung für Korken, Kapsel und Etikett-Bereich
    useLayoutEffect(() => {
        if (!aktuelleFlaschenConfig || !flaschenContainerRef.current) return;
        
        const container = flaschenContainerRef.current;
        const actualWidth = container.offsetWidth;
        const actualHeight = container.offsetHeight;
        
        // Original-Design-Größen - bottleData ist für 220x700px definiert
        const originalWidth = 220;
        const originalHeight = 700; // bottleData-Referenzgröße
        
        // Skalierungsfaktoren
        const scaleX = actualWidth / originalWidth;
        const scaleY = actualHeight / originalHeight;
        
        console.log('🎯 Responsive Skalierung:', {
            actualWidth, actualHeight,
            originalWidth, originalHeight,
            scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3)
        });
        
        // Skaliere Korken-Position
        if (korkenRef.current && activeKorken) {
            const korken = korkenRef.current;
            korken.style.top = (aktuelleFlaschenConfig.korkenPosition.top * scaleY) + 'px';
            korken.style.left = (aktuelleFlaschenConfig.korkenPosition.left * scaleX) + 'px';
            korken.style.width = (60 * scaleX) + 'px';
        }
        
        // Skaliere Kapsel-Position
        if (kapselRef.current && activeKapsel) {
            const kapsel = kapselRef.current;
            kapsel.style.top = (aktuelleFlaschenConfig.kapselPosition.top * scaleY) + 'px';
            kapsel.style.left = (aktuelleFlaschenConfig.kapselPosition.left * scaleX) + 'px';
            kapsel.style.width = (aktuelleFlaschenConfig.kapselPosition.width * scaleX) + 'px';
        }
        
        // Skaliere Canvas-Container (Etikett-Bereich)
        if (canvasContainerRef.current) {
            const canvasContainer = canvasContainerRef.current;
            canvasContainer.style.top = (aktuelleFlaschenConfig.etikettCanvas.top * scaleY) + 'px';
            canvasContainer.style.left = (aktuelleFlaschenConfig.etikettCanvas.left * scaleX) + 'px';
            canvasContainer.style.width = (aktuelleFlaschenConfig.etikettCanvas.width * scaleX) + 'px';
            canvasContainer.style.height = (aktuelleFlaschenConfig.etikettCanvas.height * scaleY) + 'px';
        }
        
    }, [aktuelleFlaschenConfig, activeKorken, activeKapsel, isCurrentlyMobile]);

    // ResizeObserver für kontinuierliche Anpassung
    useLayoutEffect(() => {
        if (!flaschenContainerRef.current) return;
        
        const resizeObserver = new ResizeObserver(() => {
            // Trigger re-scaling when container size changes
            if (aktuelleFlaschenConfig) {
                // Force re-run of the scaling effect above by updating a dependency
                setTimeout(() => {
                    // Force update by triggering the scaling effect directly
                    const container = flaschenContainerRef.current;
                    if (!container) return;
                    
                    const actualWidth = container.offsetWidth;
                    const actualHeight = container.offsetHeight;
                    
                    // Original-Design-Größen - bottleData ist für 220x700px definiert
                    const originalWidth = 220;
                    const originalHeight = 700; // bottleData-Referenzgröße
                    
                    const scaleX = actualWidth / originalWidth;
                    const scaleY = actualHeight / originalHeight;
                    
                    console.log('🔄 ResizeObserver Skalierung:', {
                        actualWidth, actualHeight, originalWidth, originalHeight,
                        scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3)
                    });
                    
                    // Skaliere Korken-Position
                    if (korkenRef.current && activeKorken) {
                        const korken = korkenRef.current;
                        korken.style.top = (aktuelleFlaschenConfig.korkenPosition.top * scaleY) + 'px';
                        korken.style.left = (aktuelleFlaschenConfig.korkenPosition.left * scaleX) + 'px';
                        korken.style.width = (60 * scaleX) + 'px';
                    }
                    
                    // Skaliere Kapsel-Position
                    if (kapselRef.current && activeKapsel) {
                        const kapsel = kapselRef.current;
                        kapsel.style.top = (aktuelleFlaschenConfig.kapselPosition.top * scaleY) + 'px';
                        kapsel.style.left = (aktuelleFlaschenConfig.kapselPosition.left * scaleX) + 'px';
                        kapsel.style.width = (aktuelleFlaschenConfig.kapselPosition.width * scaleX) + 'px';
                    }
                    
                    // Skaliere Canvas-Container (Etikett-Bereich)
                    if (canvasContainerRef.current) {
                        const canvasContainer = canvasContainerRef.current;
                        canvasContainer.style.top = (aktuelleFlaschenConfig.etikettCanvas.top * scaleY) + 'px';
                        canvasContainer.style.left = (aktuelleFlaschenConfig.etikettCanvas.left * scaleX) + 'px';
                        canvasContainer.style.width = (aktuelleFlaschenConfig.etikettCanvas.width * scaleX) + 'px';
                        canvasContainer.style.height = (aktuelleFlaschenConfig.etikettCanvas.height * scaleY) + 'px';
                    }
                }, 10);
            }
        });
        
        resizeObserver.observe(flaschenContainerRef.current);
        
        return () => resizeObserver.disconnect();
    }, [aktuelleFlaschenConfig, activeKorken, activeKapsel]);

    useEffect(() => {
        // Lade Entwürfe basierend auf Modus und Kunden-ID
        const storageKey = customerId 
            ? `flaschenkonfigurator_entwuerfe_${customerId}` 
            : 'flaschenkonfigurator_entwuerfe';
            
        const gespeicherteEntwuerfe = localStorage.getItem(storageKey);
        if (gespeicherteEntwuerfe) {
            try {
                const entwuerfeData = JSON.parse(gespeicherteEntwuerfe);
                setEntwuerfe(entwuerfeData);
                console.log(`📚 Entwürfe geladen (${storageKey}):`, entwuerfeData.length);
            } catch (error) {
                console.error("Fehler beim Laden der Entwürfe:", error);
            }
        }
    }, [customerId]);

    // Fabric.js Initialisierung
    useEffect(() => {
        // ---- Fall 1: Keine Flasche ausgewählt (bleibt unverändert) ----
        if (!activeFlasche) {
            console.log("⏸️ Fabric-Init übersprungen - keine Flasche ausgewählt.");
            return;
        }

        // ---- Fall 2: Erste Flasche wird ausgewählt -> Fabric initialisieren & Größe setzen ----
        if (activeFlasche && !fabricRef.current) {
            console.log("🚀 Erste Flasche ausgewählt! Starte Fabric.js Initialisierung...");
            
            const initFabric = async () => {
                try {
                    const fabricModule = await import('fabric');
                    const fabric = fabricModule.default || fabricModule;

                    await new Promise(resolve => setTimeout(resolve, 50));

                    if (etikettCanvasRef.current) {
                        const canvas = new fabric.Canvas(etikettCanvasRef.current);
                        fabricRef.current = { lib: fabric, canvas: canvas };

                        if (aktuelleFlaschenConfig?.etikettCanvas) {
                            // Berechne die korrekte Canvas-Größe basierend auf der aktuellen Container-Skalierung
                            const container = flaschenContainerRef.current;
                            if (container) {
                                const actualWidth = container.offsetWidth;
                                const actualHeight = container.offsetHeight;
                                const originalWidth = 220;
                                const originalHeight = 700;
                                const scaleX = actualWidth / originalWidth;
                                const scaleY = actualHeight / originalHeight;
                                
                                const scaledCanvasWidth = aktuelleFlaschenConfig.etikettCanvas.width * scaleX;
                                const scaledCanvasHeight = aktuelleFlaschenConfig.etikettCanvas.height * scaleY;
                                
                                canvas.setWidth(scaledCanvasWidth);
                                canvas.setHeight(scaledCanvasHeight);
                                canvas.renderAll();
                                console.log(`✅ Canvas initiale Größe auf ${scaledCanvasWidth}x${scaledCanvasHeight} gesetzt (skaliert).`);
                            } else {
                                // Fallback: Verwende Original-Größe
                                const { width, height } = aktuelleFlaschenConfig.etikettCanvas;
                                canvas.setWidth(width);
                                canvas.setHeight(height);
                                canvas.renderAll();
                                console.log(`✅ Canvas initiale Größe auf ${width}x${height} gesetzt (Original).`);
                            }
                        } else {
                            console.warn("WARNUNG: Konnte initiale Canvas-Größe nicht setzen, da aktuelleFlaschenConfig fehlt.");
                        }

                        canvas.on('selection:created', (e) => {
                            // Wenn das ausgewählte Objekt das Etikett ist
                            if (e.selected && e.selected[0] && e.selected[0].name === 'etikett') {
                                setIsEditingEtikett(true);
                                console.log("-> Bearbeitungsmodus gestartet");
                            }
                        });

                        canvas.on('selection:cleared', () => {
                            // Wenn die Auswahl aufgehoben wird (z.B. durch Klick daneben)
                            setIsEditingEtikett(false);
                            console.log("-> Bearbeitungsmodus beendet");
                        });

                        setIsFabricReady(true);
                        console.log("✅ Fabric-Instanz erfolgreich erstellt, isFabricReady ist jetzt true.");

                        // Canvas Ready Callback aufrufen
                        if (onCanvasReady && canvas.getElement) {
                            const canvasElement = canvas.getElement();
                            onCanvasReady(canvasElement);
                        }

                    } else {
                        console.error("❌ Kritisches Problem: Canvas-Ref nicht gefunden.");
                    }
                } catch (error) {
                    console.error("❌ Fehler beim Laden von Fabric:", error);
                }
            };

            initFabric();
        }
    
        // ---- Fall 3: Flasche wird gewechselt, Fabric existiert bereits -> Nur Größe anpassen ----
        if (fabricRef.current?.canvas && aktuelleFlaschenConfig) {
            console.log("📐 Passe Canvas-Größe für Flaschenwechsel an:", activeFlasche);
            
            const canvas = fabricRef.current.canvas;
            const { width, height } = aktuelleFlaschenConfig.etikettCanvas;
            
            // Hole das aktuelle Etikett vor der Canvas-Größen-Änderung
            const etikett = canvas.getObjects().find(obj => obj.name === 'etikett');
            let etikettState = null;
            
            if (etikett) {
                // Speichere relative Position und Größe (als Prozent der Canvas-Größe)
                const currentWidth = canvas.getWidth();
                const currentHeight = canvas.getHeight();
                
                etikettState = {
                    relativeLeft: etikett.left / currentWidth,
                    relativeTop: etikett.top / currentHeight,
                    relativeScaleX: etikett.scaleX,
                    relativeScaleY: etikett.scaleY,
                    originalSrc: etikett.originalSrc
                };
                
                console.log("🔄 Etikett-Position gespeichert:", etikettState);
            }
            
            canvas.setWidth(width);
            canvas.setHeight(height);

            // Positioniere das Etikett nach der Größenänderung neu
            if (etikett && etikettState) {
                // Setze das Etikett immer in die Bildmitte der neuen Canvas
                const newCenterLeft = (width - etikett.width * etikett.scaleX) / 2;
                const newCenterTop = (height - etikett.height * etikett.scaleY) / 2;
                
                etikett.set({
                    left: newCenterLeft,
                    top: newCenterTop
                });
                
                etikett.setCoords();
                console.log("✅ Etikett nach Flaschenwechsel in Bildmitte zentriert.");
            }
            
            // Schatten für neuen Flaschentyp aktualisieren
            updateShadowForCurrentLabel();
            
            canvas.renderAll();
        }
    }, [activeFlasche, aktuelleFlaschenConfig]);

    // Hilfsfunktion zum Laden einer Konfiguration aus einem Objekt
    const loadConfigurationFromObject = (config) => {
        console.log("🔄 Lade Konfiguration:", config);
        
        if (config.flasche) setActiveFlasche(config.flasche);
        if (config.korken) setActiveKorken(config.korken);
        if (config.kapsel) setActiveKapsel(config.kapsel);
        if (config.weinfarbe) setActiveWeinfarbe(config.weinfarbe);
        if (config.customColor) setCustomColor(config.customColor);
        if (config.weinSettings) setWeinSettings(config.weinSettings);
        
        // Etikett laden, falls vorhanden
        if (config.etikett?.src) {
            setTimeout(() => {
                handleEtikettUpload(config.etikett.src, {
                    top: config.etikett.top || 0,
                    left: config.etikett.left || 0,
                    scaleX: config.etikett.scaleX || 1,
                    scaleY: config.etikett.scaleY || 1,
                    rotation: config.etikett.rotation || 0,
                });
            }, 500);
        }
    };

    // URL-Generierung für Sharing und Kundendashboard-Integration
    const generateConfigurationUrl = (baseUrl = window.location.origin + window.location.pathname) => {
        const params = new URLSearchParams();
        
        if (customerId) params.set('customerId', customerId);
        if (activeFlasche) params.set('flasche', activeFlasche);
        if (activeKorken) params.set('korken', activeKorken);
        if (activeKapsel) params.set('kapsel', activeKapsel);
        if (activeWeinfarbe) params.set('weinfarbe', activeWeinfarbe);
        if (customColor && customColor !== '#FF6B6B') params.set('customColor', customColor);
        
        // Wein-Einstellungen nur wenn sie von Standard abweichen
        const defaultWeinSettings = { opacity: 1.0, contrast: 1.5, blendMode: 'multiply' };
        if (JSON.stringify(weinSettings) !== JSON.stringify(defaultWeinSettings)) {
            params.set('weinSettings', encodeURIComponent(JSON.stringify(weinSettings)));
        }
        
        // Etikett-Parameter
        const currentEtikett = getCurrentEtikettState();
        if (currentEtikett?.src) {
            params.set('etikettSrc', encodeURIComponent(currentEtikett.src));
            if (currentEtikett.top !== 0) params.set('etikettTop', currentEtikett.top);
            if (currentEtikett.left !== 0) params.set('etikettLeft', currentEtikett.left);
            if (currentEtikett.scaleX !== 1) params.set('etikettScaleX', currentEtikett.scaleX);
            if (currentEtikett.scaleY !== 1) params.set('etikettScaleY', currentEtikett.scaleY);
            if (currentEtikett.rotation !== 0) params.set('etikettRotation', currentEtikett.rotation);
        }
        
        return `${baseUrl}?${params.toString()}`;
    };

    // Aktuelle Etikett-Zustand abrufen
    const getCurrentEtikettState = () => {
        if (!fabricRef.current?.canvas) return null;
        
        const canvas = fabricRef.current.canvas;
        const etikett = canvas.getObjects().find(obj => obj.name === 'etikett');
        
        if (!etikett) return null;
        
        return {
            src: etikett.originalSrc || etikett.getSrc(),
            top: etikett.top || 0,
            left: etikett.left || 0,
            scaleX: etikett.scaleX || 1,
            scaleY: etikett.scaleY || 1,
            rotation: etikett.angle || 0,
        };
    };

    useEffect(() => {
        return () => {
            if (fabricRef.current?.canvas) {
                console.log("🧹 Komponente wird verlassen. Räume Fabric-Instanz auf.");
                fabricRef.current.canvas.dispose();
                fabricRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Sicherstellen, dass der Code nur im Browser läuft
        if (typeof window === 'undefined') return;

        // Priorisierung: initialConfig > URL-Parameter
        if (initialConfig) {
            console.log("📦 Lade Konfiguration aus initialConfig:", initialConfig);
            loadConfigurationFromObject(initialConfig);
            return;
        }

        const params = new URLSearchParams(window.location.search);
        console.log("🔗 URL-Parameter gefunden:", Object.fromEntries(params.entries()));
        
        // Hilfsfunktion, um nicht leere Parameter zu setzen
        const setzeStateWennParamExistiert = (paramName, setStateFunction) => {
            if (params.has(paramName)) {
                const value = params.get(paramName);
                console.log(`🔧 Setze ${paramName} auf:`, value);
                setStateFunction(value);
            }
        };

        // Kundendashboard-spezifische Parameter
        if (params.has('customerId') && !customerId) {
            console.log("👤 Kunden-ID aus URL:", params.get('customerId'));
        }

        setzeStateWennParamExistiert('flasche', setActiveFlasche);
        setzeStateWennParamExistiert('korken', setActiveKorken);
        setzeStateWennParamExistiert('kapsel', setActiveKapsel);
        setzeStateWennParamExistiert('weinfarbe', setActiveWeinfarbe);
        setzeStateWennParamExistiert('customColor', setCustomColor);
        
        // Für weinSettings (komplexeres Objekt)
        if (params.has('weinSettings')) {
            try {
                const settings = JSON.parse(decodeURIComponent(params.get('weinSettings')));
                console.log("🍷 Wein-Einstellungen geladen:", settings);
                setWeinSettings(settings);
            } catch (e) { 
                console.error("❌ Fehler beim Parsen der weinSettings URL-Parameter:", e);
            }
        }

        // Etikett laden - mit verbesserter Parameter-Unterstützung
        if (params.has('etikettSrc')) {
            const etikett = {
                src: decodeURIComponent(params.get('etikettSrc')),
                top: parseFloat(params.get('etikettTop')) || 0,
                left: parseFloat(params.get('etikettLeft')) || 0,
                scaleX: parseFloat(params.get('etikettScaleX')) || 1,
                scaleY: parseFloat(params.get('etikettScaleY')) || 1,
                rotation: parseFloat(params.get('etikettRotation')) || 0,
            };
            console.log("🏷️ Etikett aus URL geladen:", etikett);
            // Wir brauchen eine kurze Verzögerung, damit Fabric initialisiert ist
            setTimeout(() => {
                handleEtikettUpload(etikett.src, { ...etikett });
            }, 500);
        }

    }, [initialConfig, customerId]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            // Prüfen, ob der Canvas existiert und ob der Klick außerhalb davon war
            if (fabricRef.current?.canvas) {
                const canvasContainer = fabricRef.current.canvas.getElement().parentNode;
                if (canvasContainer && !canvasContainer.contains(event.target)) {
                    // Wenn außerhalb geklickt wurde, hebe die Auswahl auf
                    fabricRef.current.canvas.discardActiveObject();
                    fabricRef.current.canvas.renderAll();
                    // Das 'selection:cleared'-Event wird dadurch automatisch ausgelöst,
                    // was setIsEditingEtikett(false) aufruft.
                }
            }
        };

        // Füge den Listener zum document hinzu
        document.addEventListener('mousedown', handleOutsideClick);

        // Wichtig: Räume den Listener auf, wenn die Komponente verlassen wird
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // Ein useEffect-Hook, der auf das Laden eines Etiketts wartet
    useEffect(() => {
        // Dieser Hook läuft, wenn `etikettZuLaden` gesetzt wurde UND `isFabricReady` true wird
        if (etikettZuLaden && isFabricReady) {
            console.log("✅ Fabric ist bereit, lade das vorgemerkte Etikett.");
            
            handleEtikettUpload(etikettZuLaden.src, {
                top: etikettZuLaden.top,
                left: etikettZuLaden.left,
                scaleX: etikettZuLaden.scaleX,
                scaleY: etikettZuLaden.scaleY,
            });

            // Wichtig: Setze den temporären State zurück, nachdem das Etikett geladen wurde,
            // um ein erneutes Laden zu verhindern.
            setEtikettZuLaden(null);
        }
    }, [etikettZuLaden, isFabricReady]);

    // useEffect für Korken-Updates - Entfernt, da HTML-Elemente verwendet werden
    // useEffect(() => {
    //     if (isFabricReady && fabricRef.current?.canvas) {
    //         updateKorkenKapselOnCanvas();
    //     }
    // }, [activeKorken, activeKapsel, isFabricReady, aktuelleFlaschenConfig]);

    const handleCustomColorUpdate = (newColor) => {
        setCustomColor(newColor);
        setActiveWeinfarbe('custom');
    };

    // Upload Handler
    // Hilfsfunktion: Schatten für vorhandenes Etikett aktualisieren
    const updateShadowForCurrentLabel = async () => {
        if (!fabricRef.current?.canvas || !aktuelleFlaschenConfig) return;
        
        const { lib: fabric, canvas } = fabricRef.current;
        const etikettImg = canvas.getObjects().find(obj => obj.name === 'etikett');
        
        if (!etikettImg) return;
        
        console.log("🌓 Aktualisiere Schatten für Flaschenwechsel...");
        
        // Entferne alten Schatten
        const oldShadow = canvas.getObjects().find(obj => obj.name === 'schatten');
        if (oldShadow) {
            canvas.remove(oldShadow);
        }
        
        // Lade und erstelle neuen Schatten
        const shadowSrc = aktuelleFlaschenConfig.shadowSrc || '/images/shadow.png';
        const schattenImg = await fabric.Image.fromURL(shadowSrc);
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        const canvasRatio = canvasWidth / canvasHeight;
        const schattenRatio = schattenImg.width / schattenImg.height;
        const schattenScale = canvasRatio > schattenRatio 
            ? canvasWidth / schattenImg.width 
            : canvasHeight / schattenImg.height;
        
        // Verwende die flaschenspezifische Schatten-Breitenanpassung
        const shadowAdjustment = aktuelleFlaschenConfig.shadowWidthAdjustment || 1.0;
        const adjustedScaleX = schattenScale * shadowAdjustment;
        
        schattenImg.set({
            name: 'schatten',
            scaleX: adjustedScaleX,
            scaleY: schattenScale,
            left: (canvasWidth - schattenImg.width * adjustedScaleX) / 2,
            top: (canvasHeight - schattenImg.height * schattenScale) / 2,
            clipPath: etikettImg,
            selectable: false,
            evented: false,
            opacity: shadowOpacity,
            blendMode: 'screen',
        });
        
        const festerKontrastWert = 0.1;
        const contrastFilter = new fabric.filters.Contrast({
            contrast: festerKontrastWert
        });
        schattenImg.filters = [contrastFilter];
        schattenImg.applyFilters();
        
        canvas.add(schattenImg);
        canvas.renderAll();
        
        console.log("✅ Schatten für Flaschenwechsel aktualisiert");
    };

    const handleEtikettUpload = async (fileOrDataUrl, position = {}) => {
        console.log("🚀 handleEtikettUpload aufgerufen");
    
        if (!isFabricReady || !fileOrDataUrl || !fabricRef.current?.canvas) {
            console.error("❌ Upload blockiert.");
            alert("Der Konfigurator ist nicht bereit oder bereits beschäftigt.");
            return;
        }

        setIsProcessing(true);
        try {
            const { lib: fabric, canvas } = fabricRef.current;
            
            let originalDataUrl;
            if (typeof fileOrDataUrl === 'string') {
                originalDataUrl = fileOrDataUrl;
            } else {
                originalDataUrl = await readFileAsDataURL(fileOrDataUrl);
                setGlobalEtiketten(prev => prev.includes(originalDataUrl) ? prev : [originalDataUrl, ...prev]);
            }

            const processedDataUrl = await processEtikettImage(originalDataUrl, aktuelleFlaschenConfig.etikettKrümmung);

            const shadowSrc = aktuelleFlaschenConfig.shadowSrc || '/images/shadow.png';
            const [etikettImg, schattenImg] = await Promise.all([
                fabric.Image.fromURL(processedDataUrl),
                fabric.Image.fromURL(shadowSrc)
            ]);
            
            canvas.getObjects().forEach(obj => {
                if (obj.name === 'etikett' || obj.name === 'schatten') {
                    canvas.remove(obj);
                }
            });

            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();

            const etikettScale = Math.min(canvasWidth / etikettImg.width, canvasHeight / etikettImg.height, 0.9);
            etikettImg.set({
                left: position.left ?? (canvasWidth - etikettImg.width * etikettScale) / 2,
                top: position.top ?? (canvasHeight - etikettImg.height * etikettScale) / 2,
                scaleX: position.scaleX ?? etikettScale,
                scaleY: position.scaleY ?? etikettScale,
                name: 'etikett',
                originX: 'left',
                originY: 'top',
                absolutePositioned: true,
                hoverCursor: 'move',
                moveCursor: 'move'
            });

            etikettImg.originalSrc = originalDataUrl;

            const canvasRatio = canvasWidth / canvasHeight;
            const schattenRatio = schattenImg.width / schattenImg.height;
            const schattenScale = canvasRatio > schattenRatio 
                ? canvasWidth / schattenImg.width 
                : canvasHeight / schattenImg.height;
            
            // Verwende die flaschenspezifische Schatten-Breitenanpassung
            // 1.0 = normale Canvasbreite, 0.98 = 2% schmaler, 1.01 = 1% breiter
            const shadowAdjustment = aktuelleFlaschenConfig.shadowWidthAdjustment || 1.0;
            const adjustedScaleX = schattenScale * shadowAdjustment;
            
            schattenImg.set({
                name: 'schatten',
                scaleX: adjustedScaleX,
                scaleY: schattenScale,
                left: (canvasWidth - schattenImg.width * adjustedScaleX) / 2,
                top: (canvasHeight - schattenImg.height * schattenScale) / 2,
                clipPath: etikettImg,
                selectable: false,
                evented: false,
                opacity: shadowOpacity,
                blendMode: 'screen',
            });
            const festerKontrastWert = 0.1;
            const contrastFilter = new fabric.filters.Contrast({
                contrast: festerKontrastWert
            });
            schattenImg.filters = [contrastFilter];
            schattenImg.applyFilters();

            canvas.add(etikettImg, schattenImg);
            
            const rerenderCanvas = () => canvas.renderAll();
            etikettImg.on('moving', rerenderCanvas);
            etikettImg.on('scaling', rerenderCanvas);
            etikettImg.on('rotating', rerenderCanvas);

            // Hover-Effekt für das Etikett
            etikettImg.on('mouseover', function() {
                this.set({
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    strokeDashArray: [5, 5]
                });
                canvas.renderAll();
            });

            etikettImg.on('mouseout', function() {
                this.set({
                    stroke: null,
                    strokeWidth: 0,
                    strokeDashArray: null
                });
                canvas.renderAll();
            });

            canvas.renderAll();

            // Korken/Kapsel werden als HTML-Elemente gerendert, nicht auf Canvas

        } catch (error) {
            console.error("Fehler im Upload-Prozess:", error);
            alert("Das Etikett konnte nicht geladen werden.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Funktion entfernt - Korken und Kapsel werden als HTML-Elemente gerendert
    // const updateKorkenKapselOnCanvas = async () => { ... };

    // Hilfsfunktion zum Speichern des aktuellen Etikett-Zustands
    const speichereAktuellenEtikettZustand = () => {
        if (!fabricRef.current?.canvas || !activeFlasche) return;
        
        const canvas = fabricRef.current.canvas;
        const etikett = canvas.getObjects().find(obj => obj.name === 'etikett');
        const gruppe = canvas.getObjects().find(obj => obj.name === 'etikett-gruppe');

        if (gruppe) {
        // Holen Sie sich das Etikett (das erste Objekt in der Gruppe) für die dataUrl
        const etikettInGruppe = gruppe.getObjects('image')[0];

        setEtikettenZustand(prev => ({
            ...prev,
            [activeFlasche]: {
                top: gruppe.top,
                left: gruppe.left,
                scale: gruppe.scaleX,
                dataUrl: etikettInGruppe.getSrc(),
            }
        }));
    } else {
             // Wenn kein Etikett da ist, den Eintrag für die Flasche löschen
             const { [activeFlasche]: _, ...rest } = etikettenZustand;
             setEtikettenZustand(rest);
        }
    };   

    // Funktion zum Löschen aus der Historie
    const handleEtikettDelete = (indexToDelete) => {
        setGlobalEtiketten(prev => prev.filter((_, index) => index !== indexToDelete));
    };

    // Funktion, die aufgerufen wird, wenn ein Thumbnail geklickt wird
    const handleThumbnailClick = async (dataUrl) => {
    await handleEtikettUpload(dataUrl);
};

    const handleFlaschenWahl = (id) => {
        if (id === activeFlasche) return;

        // 1. Zuerst den Zustand des Etikett
        speichereAktuellenEtikettZustand();
        
        // 2. Prüfe, ob die aktuelle Weinfarbe für die neue Flasche erlaubt ist
        const neueFlaschenConfig = BOTTLE_DATA[id];
        if (neueFlaschenConfig && activeWeinfarbe) {
            const istErlaubt = isWeinfarbeAllowed(activeWeinfarbe, neueFlaschenConfig.allowedWines);
            if (!istErlaubt) {
                // Setze auf erste erlaubte Weinfarbe (meist 'blanco')
                const ersteErlaubteWeinfarbe = neueFlaschenConfig.allowedWines[0] || 'blanco';
                setActiveWeinfarbe(ersteErlaubteWeinfarbe);
                console.log(`🍷 Weinfarbe von ${activeWeinfarbe} auf ${ersteErlaubteWeinfarbe} geändert (nicht erlaubt für ${neueFlaschenConfig.name})`);
            }
        }
        
        // 3. Dann die aktive Flasche wechseln
        setActiveFlasche(id);
    };

    const handleKorkenWahl = (id) => {
        setActiveKorken(id);
    };

    const handleKapselWahl = (id) => {
        setActiveKapsel(id);
    };
    
    const handleWeinfarbeSelect = (id) => {
        setActiveWeinfarbe(id);
    };

    const handleMenuChange = (menuId) => {
        console.log('🔧 Menü-Änderung erkannt:', menuId, 'Android:', isAndroid);
        setActiveMenuId(menuId);
    };

    const handleEntwurfSpeichern = async () => {
        setShowSaveDraftModal(true);
    };

    const handleSaveDraft = async (name) => {
        const generateThumbnail = async () => {
            try {
                const { domToPng } = await import('modern-screenshot');
                const flaschenContainer = document.querySelector('[data-konfigurator-flasche]');
                if (!flaschenContainer) return null;

                return await domToPng(flaschenContainer, {
                    quality: 0.9,
                    pixelRatio: 0.5, // Kleinere Auflösung für Thumbnails
                });
            } catch (error) {
                console.error("Fehler beim Erstellen des Thumbnails:", error);
                return null;
            }
        };

        const thumbnail = await generateThumbnail();
        const aktuellesEtikett = getCurrentEtikettState();
        
        const entwurf = {
            id: Date.now(), // Eindeutige ID
            name: name,
            thumbnail: thumbnail,
            flasche: activeFlasche,
            korken: activeKorken,
            kapsel: activeKapsel,
            weinfarbe: activeWeinfarbe,
            customColor: customColor,
            weinSettings: weinSettings,
            etikett: aktuellesEtikett,
            customerId: customerId, // Für Kundendashboard
            createdAt: new Date().toISOString(),
            shareUrl: generateConfigurationUrl(), // URL zum Teilen
        };

        // Wenn im Kundendashboard-Modus und Callback vorhanden, verwende den Callback
        if (mode === 'dashboard' && onSaveCallback) {
            try {
                await onSaveCallback(entwurf);
                setSavedDraftName(name);
                setShowSuccessModal(true);
                return;
            } catch (error) {
                console.error("Fehler beim Speichern über Callback:", error);
                alert("Fehler beim Speichern des Entwurfs. Bitte versuchen Sie es erneut.");
                return;
            }
        }

        // Standard-Verhalten: localStorage (für standalone Modus)
        const storageKey = customerId 
            ? `flaschenkonfigurator_entwuerfe_${customerId}` 
            : 'flaschenkonfigurator_entwuerfe';
            
        const neueEntwuerfe = [...entwuerfe, entwurf];
        setEntwuerfe(neueEntwuerfe);
        localStorage.setItem(storageKey, JSON.stringify(neueEntwuerfe));
        
        setSavedDraftName(name);
        setShowSuccessModal(true);
    };

    // NEU: Lädt einen Entwurf
    const handleEntwurfLaden = (entwurf) => {
        console.log("Lade Entwurf:", entwurf.name);

        // Setze alle einfachen States sofort
        setActiveFlasche(entwurf.flasche);
        setActiveKorken(entwurf.korken);
        setActiveKapsel(entwurf.kapsel);
        setActiveWeinfarbe(entwurf.weinfarbe);
        setCustomColor(entwurf.customColor);
        setWeinSettings(entwurf.weinSettings);

        if (entwurf.etikett?.src) {
            console.log("-> Etikett-Daten zum Laden vorgemerkt.");
            setEtikettZuLaden(entwurf.etikett);
        } else {
            setEtikettZuLaden(null);
            fabricRef.current?.canvas.clear();
        }
    };
    
    // NEU: Löscht einen Entwurf
    const handleEntwurfLoeschen = (entwurfId) => {
        const neueEntwuerfe = entwuerfe.filter(e => e.id !== entwurfId);
        setEntwuerfe(neueEntwuerfe);
        localStorage.setItem('flaschenkonfigurator_entwuerfe', JSON.stringify(neueEntwuerfe));
    };

    if (!hasMounted) {
        return <div className="min-h-screen flex items-center justify-center">Lade Konfigurator...</div>;
    }

    return (
        <div className="relative min-h-screen w-full bg-gray-100 md:flex">
            {/* Hamburger Button - nur auf Mobile sichtbar mit Animation */}
            <button 
                onClick={() => setIsMenuOpen(true)}
                className={`fixed top-4 left-4 z-[60] p-2 bg-white rounded-md shadow-lg md:hidden 
                           animate-pulse hover:animate-none active:animate-none
                           transition-all duration-200 hover:bg-blue-50 hover:shadow-xl
                           ${isMenuOpen ? 'hidden' : 'block'}`}
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                
                {/* Zusätzlicher Puls-Ring für bessere Sichtbarkeit */}
                <div className="absolute inset-0 rounded-md bg-blue-500 opacity-20 animate-ping pointer-events-none"></div>
            </button>

            {/* Sidebar */}
            <aside 
                ref={sidebarRef}
                className={`
                    fixed top-0 left-0 z-50 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out
                    transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-3/5 md:relative md:w-2/5 lg:w-1/4 md:translate-x-0 md:flex-shrink-0
                `}
            >
                {/* Close Button - nur auf Mobile sichtbar */}
                <button 
                    onClick={() => setIsMenuOpen(false)}
                    className={`absolute top-3 right-2 z-[60] p-2 md:hidden ${
                        isMenuOpen ? 'block' : 'hidden'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <AuswahlPanel 
                    flaschen={flaschenAuswahlListe}
                    korken={korkenDaten}
                    kapseln={kapselDaten}
                    weinfarben={weinfarbenDaten}
                    onFlascheSelect={handleFlaschenWahl}
                    onKorkenSelect={handleKorkenWahl}
                    onKapselSelect={handleKapselWahl}
                    onWeinfarbeSelect={handleWeinfarbeSelect}
                    customColor={customColor}
                    onCustomColorChange={handleCustomColorUpdate}
                    weinSettings={weinSettings}
                    onWeinSettingsChange={setWeinSettings}
                    activeFlasche={activeFlasche}
                    activeKorken={activeKorken}
                    activeKapsel={activeKapsel}
                    activeWeinfarbe={activeWeinfarbe}
                    onEtikettUpload={handleEtikettUpload}
                    isProcessingEtikett={isProcessing}
                    isFabricReady={isFabricReady}
                    exportableCanvas={exportableCanvas}
                    fabricRef={fabricRef}
                    flaschenConfig={aktuelleFlaschenConfig}
                    korkenDaten={korkenDaten}
                    kapselDaten={kapselDaten}
                    globalEtiketten={globalEtiketten}
                    onThumbnailClick={handleThumbnailClick}
                    onEtikettDelete={handleEtikettDelete}
                    entwuerfe={entwuerfe}
                    onEntwurfLaden={handleEntwurfLaden}
                    onEntwurfLoeschen={handleEntwurfLoeschen}
                    onEntwurfSpeichern={handleEntwurfSpeichern}
                    onMenuChange={handleMenuChange}
                />
            </aside>

            {/* Hauptansicht */}
            <main 
                ref={mainRef}
                className="flex-grow flex justify-center items-center p-4 transition-transform duration-300 ease-in-out min-h-screen md:min-h-0"
            >
                {!aktuelleFlaschenConfig ? (
                    <div className="text-center text-gray-500">
                        <h2 className="text-2xl font-semibold mb-2">Willkommen</h2>
                        <p>Bitte wählen Sie eine Flasche aus, um zu beginnen.</p>
                    </div>
                ) : (
                    // Wir sind sicher, dass `aktuelleFlaschenConfig` hier existiert
                    (() => {
                        // Bestimme die richtige Flaschenbild-URL basierend auf der Weinfarbe
                        const shouldUseDarkBottle = aktuelleFlaschenConfig.darkWineThreshold?.includes(activeWeinfarbe);
                        const flaschenSrc = shouldUseDarkBottle && aktuelleFlaschenConfig.srcWithDarkWine 
                            ? aktuelleFlaschenConfig.srcWithDarkWine 
                            : aktuelleFlaschenConfig.src;

                        return (
                            <div 
                                ref={flaschenContainerRef}
                                className="relative w-[220px] h-[700px] md:w-[220px] md:h-[700px] 
                                           max-md:w-auto max-md:h-[90vh] max-md:aspect-[220/700]
                                           transition-all duration-200 hover:bg-blue-50/20 border-2 border-transparent hover:border-blue-300/50 rounded-lg" 
                                data-konfigurator-flasche
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-200/80');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-200/80');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-200/80');

                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type.startsWith('image/')) {
                                        console.log("Etikett auf Flasche gedroppt:", file.name);
                                        handleEtikettUpload(file);
                                    } else {
                                        alert("Bitte nur Bilddateien (JPG, PNG) hierher ziehen.");
                                    }
                                }}
                            >
                                <KonfiguratorAnsicht
                                    flascheSrc={flaschenSrc}
                                    inhalt={aktuelleFlaschenConfig.inhalt}
                                    weinfarbe={activeWeinfarbe}
                                    customColor={debouncedCustomColor}
                                    weinSettings={debouncedWeinSettings}
                                    onCanvasReady={setExportableCanvas}
                                    isDarkWineBottle={shouldUseDarkBottle}
                                    bottleData={aktuelleFlaschenConfig}
                                />
                                <div 
                                    ref={canvasContainerRef}
                                    style={{ position: 'absolute' }}
                                    className="z-20">
                                    <canvas ref={etikettCanvasRef} />
                                    {isEditingEtikett && (
                                    <div 
                                        className="absolute top-0 left-0 w-full h-full bg-blue-500 bg-opacity-20 pointer-events-none"
                                        aria-hidden="true"
                                    />
                                )}
                                </div>
                                
                                {/* Bearbeitungsinfo außerhalb der Canvas */}
                                {isEditingEtikett && (
                                    <div className="absolute top-0 center-full ml-4 z-40 whitespace-nowrap">
                                        <div className="bg-white text-gray-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="font-medium text-sm">Etikett wird bearbeitet</span>
                                            </div>
                                            <div className="text-gray-600 text-xs space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span>↔️ Ziehen</span>
                                                    <span className="text-gray-400">·</span>
                                                    <span>📐 Ecken</span>
                                                    <span className="text-gray-400">·</span>
                                                    <span>✖️ Klick außerhalb</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Korken und Kapsel als HTML-Elemente mit höherem Z-Index */}
                                {activeKorken && (
                                    <img 
                                        ref={korkenRef}
                                        src={korkenDaten.find(k=>k.id===activeKorken).src} 
                                        alt="Korken" 
                                        style={{ 
                                            position: 'absolute',
                                            mixBlendMode: 'multiply'
                                        }}
                                        className="z-30" 
                                    />
                                )}
                                {activeKapsel && (
                                    <img 
                                        ref={kapselRef}
                                        src={kapselDaten.find(k=>k.id===activeKapsel).src} 
                                        alt="Kapsel" 
                                        style={{ position: 'absolute' }}
                                        className="z-30" 
                                    />
                                )}
                                
                                {/* Drag & Drop Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <div className="bg-blue-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                                        Etikett hierher ziehen
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </main>

            {/* Modals */}
            <SaveDraftModal
                isOpen={showSaveDraftModal}
                onClose={() => setShowSaveDraftModal(false)}
                onSave={handleSaveDraft}
            />
            
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                draftName={savedDraftName}
            />
        </div>
    );
}