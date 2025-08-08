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
    // URL-Parameter sofort beim ersten Render auslesen (synchron)
    const getInitialStateFromURL = () => {
        if (typeof window === 'undefined' || initialConfig) return {};
        
        const params = new URLSearchParams(window.location.search);
        console.log("🔗 Initiale URL-Parameter:", Object.fromEntries(params.entries()));
        
        // Debug: Etikett-Parameter explizit prüfen
        const etikettSrc = params.get('etikettSrc');
        console.log("🖼️ Etikett-Parameter Debug:", {
            etikettSrc: etikettSrc,
            etikettSrcDecoded: etikettSrc ? decodeURIComponent(etikettSrc) : null,
            hasEtikettSrc: params.has('etikettSrc')
        });
        
        return {
            flasche: params.get('flasche') || null,
            korken: params.get('korken') || null,
            kapsel: params.get('kapsel') || null,
            weinfarbe: params.get('weinfarbe') || null,
            customColor: params.get('customColor') || 
                        (params.get('weinfarbe') && params.get('weinfarbe').startsWith('#') 
                         ? params.get('weinfarbe') 
                         : '#FF6B6B'),
            // Etikett-Parameter (sowohl externe URLs als auch IDs)
            etikettSrc: params.get('etikettSrc') ? decodeURIComponent(params.get('etikettSrc')) : null,
            etikettId: params.get('etikettId') || null,  // Neue Option für Server-gespeicherte Etiketten
            etikettTop: params.get('etikettTop') ? parseFloat(params.get('etikettTop')) : null,
            etikettLeft: params.get('etikettLeft') ? parseFloat(params.get('etikettLeft')) : null,
            etikettScaleX: params.get('etikettScaleX') ? parseFloat(params.get('etikettScaleX')) : null,
            etikettScaleY: params.get('etikettScaleY') ? parseFloat(params.get('etikettScaleY')) : null,
            etikettRotation: params.get('etikettRotation') ? parseFloat(params.get('etikettRotation')) : null,
            filename: params.get('filename') || null
        };
    };
    
    const initialURLState = getInitialStateFromURL();

    // States mit neuen Weinfarben-Eigenschaften
    const [activeFlasche, setActiveFlasche] = useState(initialURLState.flasche);
    const [activeKorken, setActiveKorken] = useState(initialURLState.korken);
    const [activeKapsel, setActiveKapsel] = useState(initialURLState.kapsel);
    const [activeWeinfarbe, setActiveWeinfarbe] = useState(initialURLState.weinfarbe);
    const [customColor, setCustomColor] = useState(initialURLState.customColor);
    const [weinSettings, setWeinSettings] = useState({
        opacity: 1.0,
        contrast: 1.5,
        blendMode: 'multiply'
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingMessage, setProcessingMessage] = useState('');
    const [showDragDropModal, setShowDragDropModal] = useState(false);
    const [isFabricReady, setIsFabricReady] = useState(false);
    const [isEditingEtikett, setIsEditingEtikett] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Neuer State für initiale Ladung
    const [processedEtikettCache, setProcessedEtikettCache] = useState(new Map()); // Cache für verarbeitete Etiketten
    const useEnhancedCurvature = true; // Permanent aktiviert - erweiterte 2D-Krümmung
    const verticalCurveIntensity = 0.08; // Erhöht für bessere Sichtbarkeit bei 600px Zielauflösung
    
    // Hilfsfunktion für Cache-Key Generierung
    const getCacheKey = (originalDataUrl, flaschenConfig) => {
        const krümmungKey = JSON.stringify(flaschenConfig.etikettKrümmung);
        const enhancedKey = useEnhancedCurvature ? '1' : '0';
        const intensityKey = verticalCurveIntensity.toString();
        return `${originalDataUrl.substring(0, 50)}_${activeFlasche}_${krümmungKey}_${enhancedKey}_${intensityKey}`;
    };
    
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

    // Mapping von externen Namen zu internen IDs
    const flaschenNameMapping = {
        'bg75optima': 'flasche2',    // Burgunder Canela
        'bd75optima': 'flasche4',    // Bordeaux 1 Canela
        'bd75prestige': 'flasche6',  // Bordeaux 2 Canela
        'paris75': 'flasche7',       // Paris Transparent
        // Auch direkte interne IDs unterstützen
        'flasche2': 'flasche2',
        'flasche4': 'flasche4', 
        'flasche6': 'flasche6',
        'flasche7': 'flasche7'
    };

    // Mapping von externen Korken-Namen zu internen IDs
    const korkenNameMapping = {
        'natur': 'korkNatur',
        'natur2': 'korkNatur2', 
        'mikro': 'korkMikro',
        'brand': 'korkBrand',
        // Auch direkte interne IDs unterstützen
        'korkNatur': 'korkNatur',
        'korkNatur2': 'korkNatur2',
        'korkMikro': 'korkMikro',
        'korkBrand': 'korkBrand'
    };

    // Mapping von externen Kapsel-Namen zu internen IDs
    const kapselNameMapping = {
        'gold': 'kapselGold',
        'silber': 'kapselSilber',
        'kupfer': 'kapselKupfer',
        'blau': 'kapselBlau',
        'rot': 'kapselRot',
        'schwarz': 'kapselSchwMatt',
        'weiss': 'kapselWeiss',
        'keine': 'noCapsule',
        // Auch direkte interne IDs unterstützen
        'kapselGold': 'kapselGold',
        'kapselSilber': 'kapselSilber', 
        'kapselKupfer': 'kapselKupfer',
        'kapselBlau': 'kapselBlau',
        'kapselRot': 'kapselRot',
        'kapselSchwMatt': 'kapselSchwMatt',
        'kapselWeiss': 'kapselWeiss',
        'keineKapsel': 'noCapsule',
        'noCapsule': 'noCapsule'
    };

    // Mapping von externen Weinfarben-Namen zu internen IDs
    const weinfarbenNameMapping = {
        'weiss': 'blanco',
        'rose': 'rosado', 
        'rot': 'tinto',
        // Auch direkte interne IDs unterstützen
        'blanco': 'blanco',
        'rosado': 'rosado',
        'tinto': 'tinto'
    };

    // Wandle externe Namen in interne IDs um
    const mapExternalToInternal = (externalName, mapping) => {
        // Wenn es ein Hex-Wert ist (#RRGGBB), verwende 'custom' als Weinfarbe
        if (externalName && externalName.startsWith('#')) {
            return 'custom';
        }
        return mapping[externalName] || externalName;
    };

    // Abgeleitete Daten mit Mapping
    const internalFlaschenId = mapExternalToInternal(activeFlasche, flaschenNameMapping);
    const internalKorkenId = mapExternalToInternal(activeKorken, korkenNameMapping);
    const internalKapselId = mapExternalToInternal(activeKapsel, kapselNameMapping);
    const internalWeinfarbe = mapExternalToInternal(activeWeinfarbe, weinfarbenNameMapping);
    
    console.log("🔄 Mapping-Debug:", {
        external: { flasche: activeFlasche, korken: activeKorken, kapsel: activeKapsel, weinfarbe: activeWeinfarbe },
        internal: { flasche: internalFlaschenId, korken: internalKorkenId, kapsel: internalKapselId, weinfarbe: internalWeinfarbe },
        flaschenConfig: internalFlaschenId ? `${BOTTLE_DATA[internalFlaschenId]?.name} (${internalFlaschenId})` : 'null',
        urlParams: typeof window !== 'undefined' ? Object.fromEntries(new URLSearchParams(window.location.search).entries()) : 'server-side'
    });
    
    const aktuelleFlaschenConfig = internalFlaschenId ? BOTTLE_DATA[internalFlaschenId] : null;
    const aktuellerKorken = internalKorkenId ? korkenDaten.find(k => k.id === internalKorkenId) : null;
    const aktuelleKapsel = internalKapselId ? kapselDaten.find(k => k.id === internalKapselId) : null;
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

    // Zusätzlicher useEffect für URL-Parameter Initialisierung
    useEffect(() => {
        // Warte kurz, bis DOM vollständig geladen ist, dann force Skalierung
        if (aktuelleFlaschenConfig && (internalKorkenId || internalKapselId)) {
            const timer = setTimeout(() => {
                console.log("🔄 Force-Skalierung für URL-Parameter...");
                // Trigger resize event um Skalierung zu erzwingen
                window.dispatchEvent(new Event('resize'));
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [aktuelleFlaschenConfig, internalKorkenId, internalKapselId, hasMounted]);

    // Responsive Skalierung für Korken, Kapsel und Etikett-Bereich
    useLayoutEffect(() => {
        console.log("🔧 useLayoutEffect ausgeführt:", {
            aktuelleFlaschenConfig: !!aktuelleFlaschenConfig,
            flaschenContainer: !!flaschenContainerRef.current,
            korkenId: internalKorkenId,
            kapselId: internalKapselId,
            hasMounted
        });
        
        if (!aktuelleFlaschenConfig || !flaschenContainerRef.current) {
            console.log("⏸️ Skalierung übersprungen: Fehlende Voraussetzungen");
            return;
        }
        
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
            scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3),
            korkenVorhanden: !!internalKorkenId,
            kapselVorhanden: !!internalKapselId,
            flaschenConfig: !!aktuelleFlaschenConfig
        });
        
        // Skaliere Korken-Position
        if (korkenRef.current && internalKorkenId && aktuellerKorken) {
            const korken = korkenRef.current;
            korken.style.top = (aktuelleFlaschenConfig.korkenPosition.top * scaleY) + 'px';
            korken.style.left = (aktuelleFlaschenConfig.korkenPosition.left * scaleX) + 'px';
            korken.style.width = '60px'; // Original-Breite
            korken.style.height = 'auto';
            korken.style.transform = `scale(${scaleX.toFixed(3)})`;
            korken.style.transformOrigin = 'top left';
            
            console.log('🔧 Korken skaliert:', {
                position: { top: korken.style.top, left: korken.style.left },
                originalWidth: '60px',
                scale: scaleX.toFixed(3)
            });
        }
        
        // Skaliere Kapsel-Position
        if (kapselRef.current && internalKapselId && aktuelleKapsel) {
            const kapsel = kapselRef.current;
            kapsel.style.top = (aktuelleFlaschenConfig.kapselPosition.top * scaleY) + 'px';
            kapsel.style.left = (aktuelleFlaschenConfig.kapselPosition.left * scaleX) + 'px';
            kapsel.style.width = aktuelleFlaschenConfig.kapselPosition.width + 'px'; // Original-Breite aus config
            kapsel.style.height = 'auto';
            kapsel.style.transform = `scale(${scaleX.toFixed(3)})`;
            kapsel.style.transformOrigin = 'top left';
            
            console.log('🔧 Kapsel skaliert:', {
                position: { top: kapsel.style.top, left: kapsel.style.left },
                originalWidth: aktuelleFlaschenConfig.kapselPosition.width + 'px',
                scale: scaleX.toFixed(3)
            });
        }
        
        // Skaliere Canvas-Container (Etikett-Bereich)
        if (canvasContainerRef.current) {
            const canvasContainer = canvasContainerRef.current;
            canvasContainer.style.top = (aktuelleFlaschenConfig.etikettCanvas.top * scaleY) + 'px';
            canvasContainer.style.left = (aktuelleFlaschenConfig.etikettCanvas.left * scaleX) + 'px';
            canvasContainer.style.width = (aktuelleFlaschenConfig.etikettCanvas.width * scaleX) + 'px';
            canvasContainer.style.height = (aktuelleFlaschenConfig.etikettCanvas.height * scaleY) + 'px';
        }
        
    }, [aktuelleFlaschenConfig, internalKorkenId, internalKapselId, isCurrentlyMobile]);

    // Backup-Skalierung mit Timeout für URL-Parameter
    useEffect(() => {
        if (aktuelleFlaschenConfig && hasMounted && (internalKorkenId || internalKapselId)) {
            // Mehrere Versuche mit zunehmenden Delays
            const timeouts = [50, 200, 500].map(delay => 
                setTimeout(() => {
                    if (flaschenContainerRef.current) {
                        console.log(`🔄 Backup-Skalierung ausgeführt nach ${delay}ms`);
                        const container = flaschenContainerRef.current;
                        const actualWidth = container.offsetWidth;
                        const actualHeight = container.offsetHeight;
                        
                        if (actualWidth > 0 && actualHeight > 0) {
                            const originalWidth = 220;
                            const originalHeight = 700;
                            const scaleX = actualWidth / originalWidth;
                            const scaleY = actualHeight / originalHeight;
                            
                            // Direkte Skalierung anwenden
                            if (korkenRef.current && internalKorkenId && aktuellerKorken) {
                                const korken = korkenRef.current;
                                korken.style.top = (aktuelleFlaschenConfig.korkenPosition.top * scaleY) + 'px';
                                korken.style.left = (aktuelleFlaschenConfig.korkenPosition.left * scaleX) + 'px';
                                korken.style.width = '60px';
                                korken.style.height = 'auto';
                                korken.style.transform = `scale(${scaleX.toFixed(3)})`;
                                korken.style.transformOrigin = 'top left';
                                console.log(`✅ Backup-Korken skaliert: scale(${scaleX.toFixed(3)})`);
                            }
                            
                            if (kapselRef.current && internalKapselId && aktuelleKapsel) {
                                const kapsel = kapselRef.current;
                                kapsel.style.top = (aktuelleFlaschenConfig.kapselPosition.top * scaleY) + 'px';
                                kapsel.style.left = (aktuelleFlaschenConfig.kapselPosition.left * scaleX) + 'px';
                                kapsel.style.width = aktuelleFlaschenConfig.kapselPosition.width + 'px';
                                kapsel.style.height = 'auto';
                                kapsel.style.transform = `scale(${scaleX.toFixed(3)})`;
                                kapsel.style.transformOrigin = 'top left';
                                console.log(`✅ Backup-Kapsel skaliert: scale(${scaleX.toFixed(3)})`);
                            }
                        }
                    }
                }, delay)
            );
            
            return () => timeouts.forEach(clearTimeout);
        }
    }, [aktuelleFlaschenConfig, internalKorkenId, internalKapselId, hasMounted, aktuellerKorken, aktuelleKapsel]);

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
                    if (korkenRef.current && internalKorkenId && aktuellerKorken) {
                        const korken = korkenRef.current;
                        korken.style.top = (aktuelleFlaschenConfig.korkenPosition.top * scaleY) + 'px';
                        korken.style.left = (aktuelleFlaschenConfig.korkenPosition.left * scaleX) + 'px';
                        korken.style.width = '60px';
                        korken.style.height = 'auto';
                        korken.style.transform = `scale(${scaleX.toFixed(3)})`;
                        korken.style.transformOrigin = 'top left';
                    }
                    
                    // Skaliere Kapsel-Position
                    if (kapselRef.current && internalKapselId && aktuelleKapsel) {
                        const kapsel = kapselRef.current;
                        kapsel.style.top = (aktuelleFlaschenConfig.kapselPosition.top * scaleY) + 'px';
                        kapsel.style.left = (aktuelleFlaschenConfig.kapselPosition.left * scaleX) + 'px';
                        kapsel.style.width = aktuelleFlaschenConfig.kapselPosition.width + 'px';
                        kapsel.style.height = 'auto';
                        kapsel.style.transform = `scale(${scaleX.toFixed(3)})`;
                        kapsel.style.transformOrigin = 'top left';
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
    }, [aktuelleFlaschenConfig, internalKorkenId, internalKapselId]);

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

    // Canvas-Element speziell überwachen für DOM-Verfügbarkeit
    useLayoutEffect(() => {
        // Nur ausführen wenn Flasche ausgewählt ist aber Fabric noch nicht initialisiert
        if (activeFlasche && !fabricRef.current && etikettCanvasRef.current) {
            console.log("🔍 useLayoutEffect: Canvas-Element im DOM verfügbar, versuche Fabric-Initialisierung...");
            
            // Kurz warten um sicherzustellen, dass das Element vollständig gerendert ist
            const timer = setTimeout(() => {
                if (etikettCanvasRef.current && !fabricRef.current) {
                    console.log("🚀 Starte verzögerte Fabric-Initialisierung über useLayoutEffect...");
                    // Trigger die Fabric-Initialisierung durch State-Update
                    setIsFabricReady(false); // Force re-render
                }
            }, 10);
            
            return () => clearTimeout(timer);
        }
    }, [activeFlasche, etikettCanvasRef.current]);

    // Fabric.js Initialisierung
    useEffect(() => {
        // Warte bis die Komponente vollständig gemountet ist
        if (!hasMounted) {
            console.log("⏳ Komponente noch nicht gemountet, warte...");
            return;
        }

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

                    // Erweiterte Retry-Logik mit DOM-Check
                    let retryCount = 0;
                    const maxRetries = 20; // Erhöht auf 20 Versuche
                    
                    while (retryCount < maxRetries) {
                        // Check ob Canvas-Ref existiert UND ob es im DOM ist
                        if (etikettCanvasRef.current && 
                            document.contains(etikettCanvasRef.current) &&
                            etikettCanvasRef.current.offsetParent !== null) {
                            console.log(`✅ Canvas-Element gefunden nach ${retryCount + 1} Versuchen!`);
                            break;
                        }
                        
                        console.log(`⏳ Warte auf Canvas-Element... Versuch ${retryCount + 1}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 50)); // Kürzere Wartezeit
                        retryCount++;
                    }

                    if (etikettCanvasRef.current && document.contains(etikettCanvasRef.current)) {
                        console.log("✅ Canvas-Element bestätigt im DOM, erstelle Fabric-Instanz...");
                        
                        // Prüfe, ob bereits eine Fabric-Instanz existiert und dispose sie
                        if (fabricRef.current?.canvas) {
                            console.log("🧹 Dispose alte Fabric-Instanz vor Neuerstellung...");
                            fabricRef.current.canvas.dispose();
                            fabricRef.current = null;
                        }
                        
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
                        console.error("❌ Kritisches Problem: Canvas-Element nicht verfügbar nach", maxRetries, "Versuchen.");
                        console.error("Canvas-Ref:", etikettCanvasRef.current);
                        console.error("Im DOM:", etikettCanvasRef.current ? document.contains(etikettCanvasRef.current) : "Ref ist null");
                        console.error("Sichtbar:", etikettCanvasRef.current ? etikettCanvasRef.current.offsetParent !== null : "Ref ist null");
                        return;
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
            
            // 3D-Krümmung ist permanent aktiviert - kein Neuladen mehr nötig
            
            canvas.renderAll();
        }
    }, [activeFlasche, aktuelleFlaschenConfig, hasMounted]);

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
        
        // Markiere initiale Ladung als abgeschlossen
        setTimeout(() => setInitialLoadComplete(true), 50);
    };

    // URL-Generierung für Sharing und Kundendashboard-Integration
    const generateConfigurationUrl = (baseUrl = window.location.origin + window.location.pathname) => {
        const params = new URLSearchParams();
        
        if (customerId) params.set('customerId', customerId);
        if (activeFlasche) params.set('flasche', activeFlasche);
        if (activeKorken) params.set('korken', activeKorken);
        if (activeKapsel) params.set('kapsel', activeKapsel);
        
        // Intelligente Weinfarben-Behandlung
        if (activeWeinfarbe === 'custom' && customColor && customColor !== '#FF6B6B') {
            // Bei Custom-Farbe: Hex-Wert direkt als weinfarbe setzen
            params.set('weinfarbe', customColor);
        } else if (activeWeinfarbe && activeWeinfarbe !== 'custom') {
            // Standard-Weinfarben normal setzen
            params.set('weinfarbe', activeWeinfarbe);
        }
        
        // Wein-Einstellungen nur wenn sie von Standard abweichen
        const defaultWeinSettings = { opacity: 1.0, contrast: 1.5, blendMode: 'multiply' };
        if (JSON.stringify(weinSettings) !== JSON.stringify(defaultWeinSettings)) {
            params.set('weinSettings', JSON.stringify(weinSettings)); // URLSearchParams encodiert automatisch
        }
        
        // Etikett-Parameter (externe URLs oder Server-IDs, keine Base64-Daten)
        const currentEtikett = getCurrentEtikettState();
        if (currentEtikett?.src) {
            // Externe URLs direkt einbinden
            if (currentEtikett.src.startsWith('http://') || currentEtikett.src.startsWith('https://')) {
                params.set('etikettSrc', encodeURIComponent(currentEtikett.src));
            }
            // Server-gespeicherte Etiketten als ID referenzieren
            else if (currentEtikett.id) {
                params.set('etikettId', currentEtikett.id);
            }
            // Für Base64/lokale Uploads: customerId als Referenz für Email-Workflow
            else if (customerId && currentEtikett.src.startsWith('data:')) {
                // Hinweis für Email-Workflow: Kunde soll Etikett per Email senden
                params.set('etikettUploadRequired', 'true');
                params.set('customerId', customerId);
            }
            
            // Positions- und Skalierungsdaten immer einbinden (unabhängig vom Bild-Typ)
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
            processedSrc: etikett.getSrc(), // Das bereits verarbeitete Etikett speichern
            id: etikett.etikettId || null, // Server-ID falls vorhanden
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
            // Nach dem Laden der initialConfig wird initialLoadComplete bereits in loadConfigurationFromObject gesetzt
            return;
        }

        // Markiere initiale Ladung als abgeschlossen
        // Bei URL-Parametern oder leerem Zustand sofort bereit für URL-Updates
        setTimeout(() => setInitialLoadComplete(true), 3000); // Verlängert auf 3 Sekunden

    }, [initialConfig, customerId]);

    // Separater useEffect für URL-Parameter-Verarbeitung
    useEffect(() => {
        console.log("🔄 URL-Parameter useEffect ausgelöst:", {
            windowUndefined: typeof window === 'undefined',
            initialConfig: !!initialConfig,
            hasMounted: hasMounted
        });
        
        // Sicherstellen, dass der Code nur im Browser läuft
        if (typeof window === 'undefined' || initialConfig || !hasMounted) return;

        const params = new URLSearchParams(window.location.search);
        console.log("🔗 URL-Parameter für komplexe Werte:", Object.fromEntries(params.entries()));
        console.log("🔗 Vollständige URL:", window.location.href);
        console.log("🔗 Parameter-Anzahl:", params.size);
        
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
        console.log("🔍 Etikett-Parameter-Check:", {
            hasEtikettSrc: params.has('etikettSrc'),
            hasEtikettId: params.has('etikettId'),
            etikettSrcValue: params.get('etikettSrc'),
            etikettIdValue: params.get('etikettId')
        });
        
        if (params.has('etikettSrc') || params.has('etikettId')) {
            const etikettFromUrl = {
                src: params.has('etikettSrc') 
                    ? decodeURIComponent(params.get('etikettSrc'))
                    : `/api/etikett/${params.get('etikettId')}`,
                id: params.get('etikettId') || null,
                // Nur setzen wenn explizit in URL vorhanden, sonst undefined lassen für Standard-Werte
                top: params.has('etikettTop') ? parseFloat(params.get('etikettTop')) : undefined,
                left: params.has('etikettLeft') ? parseFloat(params.get('etikettLeft')) : undefined,
                scaleX: params.has('etikettScaleX') ? parseFloat(params.get('etikettScaleX')) : undefined,
                scaleY: params.has('etikettScaleY') ? parseFloat(params.get('etikettScaleY')) : undefined,
                rotation: params.has('etikettRotation') ? parseFloat(params.get('etikettRotation')) : undefined,
            };
            
            console.log("🏷️ Etikett aus URL geladen, speichere für späteren Upload:", etikettFromUrl);
            
            // Speichere das Etikett für den Upload, nachdem der Canvas bereit ist
            setEtikettZuLaden(etikettFromUrl);
            console.log("✅ setEtikettZuLaden wurde aufgerufen");
        } else {
            console.log("❌ Keine Etikett-Parameter gefunden");
        }

        // WICHTIG: Wenn URL-Parameter vorhanden sind, simuliere Flaschenwechsel 
        // um sicherzustellen, dass der korrekte Canvas erstellt wird
        console.log("🔍 Flaschenwechsel-Check:", {
            paramsSize: params.size,
            hasFlasche: params.has('flasche'),
            flascheValue: params.get('flasche'),
            currentActiveFlasche: activeFlasche
        });
        
        if (params.size > 0 && params.has('flasche')) {
            const urlFlasche = params.get('flasche');
            const mappedFlasche = flaschenNameMapping[urlFlasche] || urlFlasche || 'flasche1';
            
            console.log("🔄 Simuliere Flaschenwechsel für URL-Parameter-Initialisierung:", {
                urlFlasche,
                mappedFlasche,
                currentActiveFlasche: activeFlasche
            });
            
            // Force re-trigger der Flaschenwechsel-Pipeline durch kurzzeitiges Zurücksetzen
            setActiveFlasche(null);
            setTimeout(() => {
                console.log("🎯 Setze Flasche auf:", mappedFlasche);
                setActiveFlasche(mappedFlasche);
                console.log("✅ Flaschenwechsel-Pipeline für URL-Parameter ausgelöst");
            }, 50);
        } else {
            console.log("❌ Kein Flaschenwechsel ausgelöst - Bedingungen nicht erfüllt");
        }

    }, [hasMounted]); // Läuft nur einmal, wenn hasMounted true wird

    // Automatische URL-Aktualisierung bei State-Änderungen (ohne Etikett-Parameter zu überschreiben)
    useEffect(() => {
        if (typeof window === 'undefined' || !hasMounted || !initialLoadComplete) return;
        
        const currentUrl = generateConfigurationUrl();
        const currentParams = new URLSearchParams(window.location.search);
        const newParams = new URLSearchParams(currentUrl.split('?')[1] || '');
        
        // Bewahre original Etikett-Parameter wenn noch kein Etikett geladen wurde
        const currentEtikett = getCurrentEtikettState();
        if (!currentEtikett && currentParams.has('etikettSrc')) {
            newParams.set('etikettSrc', currentParams.get('etikettSrc'));
        }
        if (!currentEtikett && currentParams.has('etikettId')) {
            newParams.set('etikettId', currentParams.get('etikettId'));
        }
        
        // Bewahre auch Etikett-Positionsparameter
        if (currentParams.has('etikettTop') && !newParams.has('etikettTop')) {
            newParams.set('etikettTop', currentParams.get('etikettTop'));
        }
        if (currentParams.has('etikettLeft') && !newParams.has('etikettLeft')) {
            newParams.set('etikettLeft', currentParams.get('etikettLeft'));
        }
        if (currentParams.has('etikettScaleX') && !newParams.has('etikettScaleX')) {
            newParams.set('etikettScaleX', currentParams.get('etikettScaleX'));
        }
        if (currentParams.has('etikettScaleY') && !newParams.has('etikettScaleY')) {
            newParams.set('etikettScaleY', currentParams.get('etikettScaleY'));
        }
        if (currentParams.has('etikettRotation') && !newParams.has('etikettRotation')) {
            newParams.set('etikettRotation', currentParams.get('etikettRotation'));
        }
        
        // Nur aktualisieren, wenn sich Parameter geändert haben
        const currentParamString = currentParams.toString();
        const newParamString = newParams.toString();
        
        if (currentParamString !== newParamString) {
            const updatedUrl = `${window.location.origin}${window.location.pathname}?${newParamString}`;
            console.log("🔄 URL wird aktualisiert:", updatedUrl);
            window.history.replaceState({}, '', updatedUrl);
        }
    }, [activeFlasche, activeKorken, activeKapsel, activeWeinfarbe, customColor, weinSettings, hasMounted, initialLoadComplete]);

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
        console.log("🔄 EtikettZuLaden useEffect ausgelöst:", {
            etikettZuLaden: etikettZuLaden,
            isFabricReady: isFabricReady,
            condition: etikettZuLaden && isFabricReady
        });
        
        // Dieser Hook läuft, wenn `etikettZuLaden` gesetzt wurde UND `isFabricReady` true wird
        if (etikettZuLaden && isFabricReady) {
            console.log("✅ Fabric ist bereit, lade das vorgemerkte Etikett über normale Upload-Pipeline:", etikettZuLaden);
            
            // Debug: Welcher Canvas wird verwendet?
            if (fabricRef.current?.canvas) {
                const canvas = fabricRef.current.canvas;
                const canvasElement = canvas.getElement();
                console.log("🔍 Canvas Debug:", {
                    canvasWidth: canvas.getWidth(),
                    canvasHeight: canvas.getHeight(),
                    canvasElementId: canvasElement?.id,
                    canvasElementClass: canvasElement?.className,
                    isEtikettCanvas: canvasElement === etikettCanvasRef.current,
                    etikettCanvasExists: !!etikettCanvasRef.current
                });
            }
            
            // Nutze die gleiche Pipeline wie beim Drag & Drop Upload
            // Das zeigt automatisch den Ladebalken und nutzt den korrekten Canvas
            setShowDragDropModal(true);
            
            // Nutze die URL direkt mit handleEtikettUpload (unterstützt fileOrDataUrl)
            handleEtikettUpload(etikettZuLaden.src, {
                top: etikettZuLaden.top,
                left: etikettZuLaden.left,
                scaleX: etikettZuLaden.scaleX,
                scaleY: etikettZuLaden.scaleY,
            }).then(() => {
                console.log("✅ URL-Etikett erfolgreich über normale Pipeline geladen");
            }).catch((error) => {
                console.error("❌ Fehler beim URL-Etikett Upload:", error);
            }).finally(() => {
                // Modal nach Upload schließen (wie beim normalen Drag & Drop)
                setTimeout(() => {
                    setShowDragDropModal(false);
                }, 500);
            });

            // Wichtig: Setze den temporären State zurück, nachdem das Etikett geladen wurde,
            // um ein erneutes Laden zu verhindern.
            setEtikettZuLaden(null);
        }
    }, [etikettZuLaden, isFabricReady]);
    
    // Erweiterte Krümmung ist jetzt permanent aktiviert - kein useEffect mehr nötig
    
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

    // Neue Upload-Funktion mit Server-ID-Generierung
    const handleEtikettUploadWithId = async (file) => {
        console.log("📤 Upload mit Server-ID gestartet...");
        
        if (!file) {
            alert("Bitte wählen Sie eine Datei aus.");
            return null;
        }

        try {
            const formData = new FormData();
            formData.append('etikett', file);

            const response = await fetch('/api/etikett/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload fehlgeschlagen');
            }

            const data = await response.json();
            console.log("✅ Upload erfolgreich:", data);

            // Jetzt das Etikett mit der Server-URL laden
            await handleEtikettUpload(data.url, { id: data.etikettId });
            
            return data.etikettId;

        } catch (error) {
            console.error("❌ Upload-Fehler:", error);
            alert("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
            return null;
        }
    };

    // Separate Funktion für Drag & Drop auf die Flasche mit Modal
    const handleDragDropEtikettUpload = async (file) => {
        console.log("🚀 handleDragDropEtikettUpload aufgerufen für:", file.name);
        
        if (!isFabricReady || !file || !fabricRef.current?.canvas) {
            console.error("❌ Drag & Drop Upload blockiert.");
            alert("Der Konfigurator ist nicht bereit oder bereits beschäftigt.");
            return;
        }

        setShowDragDropModal(true);
        
        try {
            // Rufe die normale Upload-Funktion auf, die kümmert sich um alle States
            await handleEtikettUpload(file);
        } catch (error) {
            console.error("Fehler beim Drag & Drop Upload:", error);
        } finally {
            // Modal etwas länger anzeigen, damit der Benutzer den Abschluss sieht
            setTimeout(() => {
                setShowDragDropModal(false);
            }, 500);
        }
    };

    const handleEtikettUpload = async (fileOrDataUrl, position = {}) => {
        console.log("🚀 handleEtikettUpload aufgerufen");
    
        if (!fileOrDataUrl || !fabricRef.current?.canvas) {
            console.error("❌ Upload blockiert - fehlende Daten oder Canvas nicht bereit.");
            console.error("Debug:", { 
                hasFileOrDataUrl: !!fileOrDataUrl, 
                hasFabricRef: !!fabricRef.current, 
                hasCanvas: !!fabricRef.current?.canvas,
                isFabricReady: isFabricReady 
            });
            alert("Der Konfigurator ist nicht bereit oder bereits beschäftigt.");
            return;
        }

        const { canvas } = fabricRef.current;
        
        // Zusätzliche Canvas-Überprüfung
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        if (canvasWidth <= 0 || canvasHeight <= 0) {
            console.error("❌ Canvas hat ungültige Dimensionen:", { canvasWidth, canvasHeight });
            alert("Canvas ist nicht korrekt initialisiert. Bitte versuchen Sie es erneut.");
            return;
        }
        
        console.log("✅ Canvas-Bereitschaftscheck bestanden:", { canvasWidth, canvasHeight });

        // Prüfe ob Processing übersprungen werden soll (für bereits verarbeitete Etiketten)
        const skipProcessing = position.skipProcessing || false;
        
        if (!skipProcessing) {
            setIsProcessing(true);
            setProcessingProgress(0);
            setProcessingMessage('Lade Etikett...');
        }
        
        try {
            const { lib: fabric, canvas } = fabricRef.current;
            
            // Debug: Canvas-Überprüfung VOR der Verarbeitung
            console.log('🔍 Canvas-Info VOR PDF-Verarbeitung:', {
                canvasElement: canvas.getElement(),
                canvasParent: canvas.getElement().parentNode,
                canvasId: canvas.getElement().id,
                canvasClass: canvas.getElement().className,
                etikettCanvasRef: etikettCanvasRef.current,
                isEtikettCanvas: canvas.getElement() === etikettCanvasRef.current,
                canvasContainer: canvasContainerRef.current,
                skipProcessing: skipProcessing
            });
            
            let originalDataUrl;
            let processedDataUrl;
            
            // Wenn Processing übersprungen wird, ist fileOrDataUrl bereits das verarbeitete Bild
            if (skipProcessing) {
                console.log("⚡ Überspringe Bildverarbeitung - verwende bereits verarbeitetes Etikett");
                processedDataUrl = fileOrDataUrl;
                originalDataUrl = fileOrDataUrl; // Für Kompatibilität
            } else {
                // PDF-Verarbeitung
                if (typeof fileOrDataUrl !== 'string' && fileOrDataUrl.type === 'application/pdf') {
                    console.log("📄 PDF-Datei erkannt, starte Verarbeitung...");
                    setProcessingMessage('PDF wird verarbeitet...');
                    
                    // Canvas-Validierung VOR PDF-Verarbeitung
                    if (canvas.getElement() !== etikettCanvasRef.current) {
                        console.error("❌ KRITISCHER FEHLER: Canvas-Referenz stimmt nicht überein!");
                        console.error("Canvas-Element:", canvas.getElement());
                        console.error("Erwartet (etikettCanvasRef):", etikettCanvasRef.current);
                        throw new Error("Canvas-Referenz-Konflikt erkannt");
                    }
                    
                    // Dynamischer Import der PDF-Verarbeitung
                    const { processPdfToImage } = await import('../lib/pdfProcessor');
                    
                    // Progress callback für PDF-Verarbeitung
                    const pdfProgressCallback = (percentage, message) => {
                        console.log(`🔄 PDF Progress: ${percentage}% - ${message}`);
                        setProcessingProgress(Math.round(percentage * 0.4)); // PDF nimmt 40% der Gesamtzeit
                        setProcessingMessage(message);
                    };
                    
                    originalDataUrl = await processPdfToImage(fileOrDataUrl, pdfProgressCallback);
                    
                    // Canvas-Validierung NACH PDF-Verarbeitung
                    if (canvas.getElement() !== etikettCanvasRef.current) {
                        console.error("❌ KRITISCHER FEHLER: Canvas-Referenz wurde während PDF-Verarbeitung geändert!");
                        console.error("Canvas-Element:", canvas.getElement());
                        console.error("Erwartet (etikettCanvasRef):", etikettCanvasRef.current);
                        throw new Error("Canvas-Referenz wurde während PDF-Verarbeitung kompromittiert");
                    }
                    
                    // PDF zu globalen Etiketten hinzufügen
                    setGlobalEtiketten(prev => prev.includes(originalDataUrl) ? prev : [originalDataUrl, ...prev]);
                    
                } else if (typeof fileOrDataUrl === 'string') {
                    originalDataUrl = fileOrDataUrl;
                } else {
                    // Normale Bilddatei
                    originalDataUrl = await readFileAsDataURL(fileOrDataUrl);
                    setGlobalEtiketten(prev => prev.includes(originalDataUrl) ? prev : [originalDataUrl, ...prev]);
                }

                // Progress callback für die Bildverarbeitung (ab 40% wenn PDF, sonst ab 0%)
                const progressOffset = typeof fileOrDataUrl !== 'string' && fileOrDataUrl.type === 'application/pdf' ? 40 : 0;
                const progressCallback = (percentage, message) => {
                    console.log(`🔄 Progress: ${percentage}% - ${message}`);
                    const adjustedPercentage = progressOffset + (percentage * (100 - progressOffset) / 100);
                    setProcessingProgress(Math.round(adjustedPercentage));
                    setProcessingMessage(message);
                };

                // Cache-Key für diese Konfiguration
                const cacheKey = getCacheKey(originalDataUrl, aktuelleFlaschenConfig);
                
                // Prüfe Cache zuerst
                if (processedEtikettCache.has(cacheKey)) {
                    console.log("✅ Etikett aus Cache geladen:", cacheKey.substring(0, 30));
                    processedDataUrl = processedEtikettCache.get(cacheKey);
                    setProcessingProgress(100);
                    setProcessingMessage('Aus Cache geladen!');
                } else {
                    console.log("🔄 Etikett wird verarbeitet und gecacht:", cacheKey.substring(0, 30));
                    processedDataUrl = await processEtikettImage(
                        originalDataUrl, 
                        aktuelleFlaschenConfig.etikettKrümmung, 
                        useEnhancedCurvature, 
                        verticalCurveIntensity,
                        progressCallback
                    );
                    
                    // In Cache speichern
                    setProcessedEtikettCache(prev => new Map(prev.set(cacheKey, processedDataUrl)));
                }
            }

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

            // Verwende die TATSÄCHLICHEN Canvas-Dimensionen, nicht die Konfigurationswerte
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            
            // Erweiterte Debug-Informationen
            console.log('🔍 Canvas-Debug NACH Verarbeitung:', {
                fabricCanvasWidth: canvas.getWidth(),
                fabricCanvasHeight: canvas.getHeight(),
                etikettCanvasConfigWidth: aktuelleFlaschenConfig.etikettCanvas.width,
                etikettCanvasConfigHeight: aktuelleFlaschenConfig.etikettCanvas.height,
                etikettCanvasConfig: aktuelleFlaschenConfig.etikettCanvas,
                canvasElement: canvas.getElement(),
                canvasParent: canvas.getElement().parentNode,
                isStillEtikettCanvas: canvas.getElement() === etikettCanvasRef.current,
                canvasContainer: canvasContainerRef.current,
                canvasContainerStyle: canvasContainerRef.current?.style?.cssText,
                finalCanvasPosition: {
                    top: canvasContainerRef.current?.style?.top,
                    left: canvasContainerRef.current?.style?.left,
                    width: canvasContainerRef.current?.style?.width,
                    height: canvasContainerRef.current?.style?.height
                }
            });

            // Etikett auf 90% der Canvas-Breite skalieren (statt 100%)
            const maxWidthScale = (canvasWidth * 0.9) / etikettImg.width; // 90% der Canvas-Breite
            const maxHeightScale = canvasHeight / etikettImg.height; // Volle Canvas-Höhe erlaubt
            const etikettScale = Math.min(maxWidthScale, maxHeightScale, 0.9);
            
            // Debug: Positionierung überprüfen
            const calculatedLeft = (canvasWidth - etikettImg.width * etikettScale) / 2;
            const calculatedTop = (canvasHeight - etikettImg.height * etikettScale) / 2;
            console.log('🔍 Positionierungs-Debug:', {
                canvasWidth,
                canvasHeight,
                etikettWidth: etikettImg.width,
                etikettHeight: etikettImg.height,
                etikettScale,
                calculatedLeft,
                calculatedTop,
                positionParam: position
            });
            
            etikettImg.set({
                left: position.left ?? calculatedLeft,
                top: position.top ?? calculatedTop,
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
            
            // Etikett-ID speichern falls vorhanden
            if (position.id) {
                etikettImg.etikettId = position.id;
            }

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
            
            const rerenderCanvas = () => {
                canvas.renderAll();
                // 3D-Verzerrung ist bereits im Bild integriert, keine zusätzlichen Updates nötig
            };
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

            // 3D-Verzerrung ist bereits beim Bildprocessing integriert
            console.log("✅ Etikett mit integrierter erweiterter Krümmung geladen:", useEnhancedCurvature);

            // Korken/Kapsel werden als HTML-Elemente gerendert, nicht auf Canvas
            
            // WICHTIG: Nach PDF-Upload die Canvas-Container-Positionierung neu berechnen
            if (typeof fileOrDataUrl !== 'string' && fileOrDataUrl.type === 'application/pdf') {
                console.log("🔄 Neuberechnung der Canvas-Position nach PDF-Upload...");
                
                // Trigger die responsive Skalierung neu
                if (flaschenContainerRef.current && canvasContainerRef.current) {
                    const container = flaschenContainerRef.current;
                    const actualWidth = container.offsetWidth;
                    const actualHeight = container.offsetHeight;
                    const originalWidth = 220;
                    const originalHeight = 700;
                    const scaleX = actualWidth / originalWidth;
                    const scaleY = actualHeight / originalHeight;
                    
                    const canvasContainer = canvasContainerRef.current;
                    canvasContainer.style.top = (aktuelleFlaschenConfig.etikettCanvas.top * scaleY) + 'px';
                    canvasContainer.style.left = (aktuelleFlaschenConfig.etikettCanvas.left * scaleX) + 'px';
                    canvasContainer.style.width = (aktuelleFlaschenConfig.etikettCanvas.width * scaleX) + 'px';
                    canvasContainer.style.height = (aktuelleFlaschenConfig.etikettCanvas.height * scaleY) + 'px';
                    
                    console.log("✅ Canvas-Container nach PDF-Upload neu positioniert:", {
                        top: canvasContainer.style.top,
                        left: canvasContainer.style.left,
                        width: canvasContainer.style.width,
                        height: canvasContainer.style.height,
                        scaleFactors: { scaleX, scaleY }
                    });
                }
            }

        } catch (error) {
            console.error("Fehler im Upload-Prozess:", error);
            alert("Das Etikett konnte nicht geladen werden.");
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
            setProcessingMessage('');
        }
    };

    // Funktion entfernt - Korken und Kapsel werden als HTML-Elemente gerendert
    // const updateKorkenKapselOnCanvas = async () => { ... };

    // Erweiterte Krümmung ist jetzt permanent aktiviert - reloadEtikettWith3DSetting Funktion nicht mehr benötigt

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
        console.log("🚀 handleThumbnailClick aufgerufen - delegiert an handleEtikettUpload");
        
        // Einfach an handleEtikettUpload delegieren - das stellt sicher,
        // dass die Positionierung identisch ist und der Cache funktioniert
        await handleEtikettUpload(dataUrl, {});
    };
        
    const handleFlaschenWahl = (id) => {
        if (id === activeFlasche) return;

        // 1. Zuerst den Zustand des Etikett
        speichereAktuellenEtikettZustand();
        
        // 2. Prüfe, ob die aktuelle Weinfarbe für die neue Flasche erlaubt ist
        const neueFlaschenConfig = BOTTLE_DATA[id];
        if (neueFlaschenConfig && internalWeinfarbe) {
            const istErlaubt = isWeinfarbeAllowed(internalWeinfarbe, neueFlaschenConfig.allowedWines);
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
    const handleEntwurfLaden = async (entwurf) => {
        console.log("🔄 Lade Entwurf:", entwurf.name);

        // Ladebalken anzeigen
        setIsProcessing(true);
        setProcessingProgress(10);
        setProcessingMessage(`Lade Entwurf "${entwurf.name}"...`);

        try {
            // Setze alle einfachen States sofort
            setActiveFlasche(entwurf.flasche);
            setActiveKorken(entwurf.korken);
            setActiveKapsel(entwurf.kapsel);
            setActiveWeinfarbe(entwurf.weinfarbe);
            setCustomColor(entwurf.customColor);
            setWeinSettings(entwurf.weinSettings);
            
            setProcessingProgress(30);
            setProcessingMessage('Konfiguration wird geladen...');

            if (entwurf.etikett?.src) {
                console.log("-> Lade Etikett direkt ohne erneute Verarbeitung");
                setProcessingProgress(50);
                setProcessingMessage('Etikett wird geladen...');
                
                // **WICHTIG**: Prüfe ob das Etikett bereits verarbeitet wurde
                // Falls ja, lade es direkt ohne erneute Verarbeitung
                if (entwurf.etikett.processedSrc) {
                    console.log("✅ Verwende bereits verarbeitetes Etikett aus Entwurf");
                    setProcessingProgress(80);
                    setProcessingMessage('Etikett aus Cache...');
                    
                    // Lade das bereits verarbeitete Etikett direkt
                    await handleEtikettUpload(entwurf.etikett.processedSrc, {
                        top: entwurf.etikett.top || 0,
                        left: entwurf.etikett.left || 0,
                        scaleX: entwurf.etikett.scaleX || 1,
                        scaleY: entwurf.etikett.scaleY || 1,
                        rotation: entwurf.etikett.rotation || 0,
                        skipProcessing: true // Verhindere erneute Verarbeitung
                    });
                } else {
                    console.log("-> Etikett-Daten zum Laden vorgemerkt (wird verarbeitet)");
                    setEtikettZuLaden(entwurf.etikett);
                }
            } else {
                setEtikettZuLaden(null);
                fabricRef.current?.canvas.clear();
            }
            
            setProcessingProgress(100);
            setProcessingMessage('Entwurf geladen!');
            
            // Kurz warten, dann Ladebalken ausblenden
            setTimeout(() => {
                setIsProcessing(false);
                setProcessingProgress(0);
                setProcessingMessage('');
            }, 500);
            
        } catch (error) {
            console.error("❌ Fehler beim Laden des Entwurfs:", error);
            setIsProcessing(false);
            setProcessingProgress(0);
            setProcessingMessage('');
            alert(`Fehler beim Laden des Entwurfs: ${error.message}`);
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
                    processingProgress={processingProgress}
                    processingMessage={processingMessage}
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
                        const shouldUseDarkBottle = aktuelleFlaschenConfig.darkWineThreshold?.includes(internalWeinfarbe);
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
                                    if (file) {
                                        // Erweiterte Validierung für Bilder und PDFs
                                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                                        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
                                        const fileName = file.name.toLowerCase();
                                        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
                                        
                                        if (allowedTypes.includes(file.type) || hasValidExtension) {
                                            console.log("Etikett auf Flasche gedroppt:", file.name, file.type);
                                            handleDragDropEtikettUpload(file);
                                        } else {
                                            alert("Bitte nur Bilddateien (JPG, PNG) oder PDF-Dateien hierher ziehen.");
                                        }
                                    } else {
                                        alert("Bitte nur Bilddateien (JPG, PNG) oder PDF-Dateien hierher ziehen.");
                                    }
                                }}
                            >
                                <KonfiguratorAnsicht
                                    flascheSrc={flaschenSrc}
                                    inhalt={aktuelleFlaschenConfig.inhalt}
                                    weinfarbe={internalWeinfarbe}
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
                                
                                {/* Erweiterte Krümmung ist jetzt permanent aktiviert - UI-Elemente entfernt */}
                                
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
                                {internalKorkenId && aktuellerKorken && (
                                    <img 
                                        ref={korkenRef}
                                        src={aktuellerKorken.src} 
                                        alt="Korken" 
                                        style={{ 
                                            position: 'absolute',
                                            mixBlendMode: 'multiply'
                                        }}
                                        className="z-30" 
                                    />
                                )}
                                {internalKapselId && aktuelleKapsel && (
                                    <img 
                                        ref={kapselRef}
                                        src={aktuelleKapsel.src} 
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

                                {/* Drag & Drop Progress Modal */}
                                {showDragDropModal && (
                                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
                                        <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
                                            <div className="text-center">
                                                <div className="text-blue-600 mb-3">
                                                    <div className="animate-spin inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                                                    <p className="font-medium text-lg">{processingMessage || 'Etikett wird verarbeitet...'}</p>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                                    <div 
                                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" 
                                                        style={{ width: `${Math.max(5, processingProgress)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-sm text-gray-600">{processingProgress}% abgeschlossen</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
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