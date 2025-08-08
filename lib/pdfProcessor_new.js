import * as pdfjsLib from 'pdfjs-dist';

// PDF.js Worker konfigurieren
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs';

/**
 * Verarbeitet eine PDF-Datei zu einem Bild und erkennt Schnittmarken
 * @param {File} pdfFile - Die PDF-Datei
 * @param {Function} onProgress - Fortschritts-Callback
 * @returns {Promise<string>} DataURL des verarbeiteten Bildes
 */
export async function processPdfToImage(pdfFile, onProgress = () => {}) {
    console.log("🔄 PDF-Verarbeitung gestartet:", pdfFile.name);
    
    try {
        // PDF laden
        onProgress(10, 'PDF wird geladen...');
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        onProgress(20, 'PDF-Seite wird verarbeitet...');
        const page = await pdf.getPage(1);
        
        // Viewport erstellen
        const viewport = page.getViewport({ scale: 2.0 });
        console.log("📄 PDF-Seiten-Info:", {
            width: viewport.width,
            height: viewport.height,
            mediaBox: page._pageInfo.view,
            hasAnnotations: page._pageInfo.annotations?.length > 0
        });
        
        // Canvas erstellen
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // PDF auf Canvas rendern
        onProgress(30, 'Schnittmarken werden erkannt...');
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        console.log("✅ PDF erfolgreich auf Canvas gerendert:", canvas.width + "x" + canvas.height);
        
        // Schnittmarken erkennen und beschneiden
        const croppedCanvas = detectAndCropRegistrationMarks(canvas);
        
        // Als DataURL zurückgeben
        onProgress(100, 'PDF-Verarbeitung abgeschlossen');
        return croppedCanvas.toDataURL('image/png');
        
    } catch (error) {
        console.error("❌ PDF-Verarbeitungsfehler:", error);
        throw new Error(`PDF konnte nicht verarbeitet werden: ${error.message}`);
    }
}

/**
 * Erkennt Schnittmarken und beschneidet das Canvas entsprechend
 * @param {HTMLCanvasElement} canvas - Original Canvas
 * @returns {HTMLCanvasElement} Beschnittenes Canvas
 */
function detectAndCropRegistrationMarks(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    
    console.log("🔍 Neue Schnittmarken-Erkennung in " + width + "x" + height + "px");
    
    // Canvas-Daten abrufen
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Schnittmarken suchen
    const cropMargins = findSymmetricCropMargins(data, width, height);
    
    if (cropMargins.detected && cropMargins.confidence > 0.7) {
        console.log("✅ Schnittmarken erkannt:", cropMargins);
        return cropCanvas(canvas, cropMargins);
    } else {
        console.log("📄 Keine Schnittmarken erkannt, verwende Original");
        return canvas;
    }
}

/**
 * Neue symmetrische Schnittmarken-Erkennung
 * @param {Uint8ClampedArray} data - Bilddaten
 * @param {number} width - Bildbreite
 * @param {number} height - Bildhöhe
 * @returns {Object} Crop-Ränder mit Konfidenz-Wert
 */
function findSymmetricCropMargins(data, width, height) {
    // Parameter
    const SCAN_DEPTH = 80; // Wie weit vom Rand scannen
    const DARK_THRESHOLD = 250; // Empfindlichkeit für Marken
    const MIN_LINE_LENGTH = 6; // Mindestlänge einer Marke
    const DIAGONAL_OFFSET_PX = 20; // Diagonaler Sprung nach erster Marke
    const SEARCH_RANGE_PX = 60; // Suchbereich für weitere Marken
    
    console.log("🔧 Symmetrische Schnittmarken-Suche:", {
        scanDepth: SCAN_DEPTH,
        darkThreshold: DARK_THRESHOLD,
        diagonalOffset: DIAGONAL_OFFSET_PX,
        searchRange: SEARCH_RANGE_PX
    });

    let margins = {
        left: 0,
        right: width,
        top: 0,
        bottom: height,
        detected: false,
        confidence: 0,
        method: 'symmetrisch'
    };
    
    // Hilfsfunktionen
    const isInBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;
    
    const getPixelBrightness = (x, y) => {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        return (r + g + b) / 3;
    };
    
    const hasHorizontalDarkLine = (startX, y, length) => {
        let darkPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < length; i += 2) {
            const x = startX + i;
            if (isInBounds(x, y)) {
                totalPixels++;
                const brightness = getPixelBrightness(x, y);
                if (brightness < DARK_THRESHOLD) {
                    darkPixels++;
                }
            }
        }
        
        const darkRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
        return darkRatio >= 0.25; // 25% der Linie dunkel
    };
    
    const hasVerticalDarkLine = (x, startY, length) => {
        let darkPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < length; i += 2) {
            const y = startY + i;
            if (isInBounds(x, y)) {
                totalPixels++;
                const brightness = getPixelBrightness(x, y);
                if (brightness < DARK_THRESHOLD) {
                    darkPixels++;
                }
            }
        }
        
        const darkRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
        return darkRatio >= 0.25; // 25% der Linie dunkel
    };
    
    // NEUE LOGIK: Suche äußerste Schnittmarke
    let finalCutMargin = null;
    
    console.log("🔍 Schritt 1: Horizontaler Scan von links (y=0)...");
    
    // Von links nach rechts bei y=0 scannen
    for (let x = 0; x < Math.min(SCAN_DEPTH, width / 2); x += 2) {
        if (hasHorizontalDarkLine(x, 0, MIN_LINE_LENGTH)) {
            console.log(`🎉 Erste horizontale Marke gefunden bei x=${x}, y=0`);
            
            // Diagonaler Sprung und Suche nach letzter Marke
            const jumpX = x + DIAGONAL_OFFSET_PX;
            const jumpY = DIAGONAL_OFFSET_PX;
            
            console.log(`📍 Springe diagonal zu x=${jumpX}, y=${jumpY} und suche weitere Marken...`);
            
            let lastMarkX = x; // Erste Marke als Fallback
            
            // Suche weitere Marken horizontal nach rechts
            for (let searchX = jumpX; searchX < Math.min(jumpX + SEARCH_RANGE_PX, width); searchX += 2) {
                if (hasHorizontalDarkLine(searchX, jumpY, MIN_LINE_LENGTH)) {
                    lastMarkX = searchX;
                    console.log(`📍 Weitere horizontale Marke gefunden bei x=${searchX}, y=${jumpY}`);
                }
            }
            
            finalCutMargin = lastMarkX;
            console.log(`✂️ Finale Schnittposition: ${finalCutMargin}px`);
            break;
        }
        
        if (x % 20 === 0) {
            console.log(`⏳ Horizontaler Scan... bei x=${x}`);
        }
    }
    
    // Falls keine horizontalen Marken gefunden, versuche vertikale
    if (finalCutMargin === null) {
        console.log("🔍 Schritt 2: Vertikaler Scan von oben (x=0)...");
        
        for (let y = 0; y < Math.min(SCAN_DEPTH, height / 2); y += 2) {
            if (hasVerticalDarkLine(0, y, MIN_LINE_LENGTH)) {
                console.log(`🎉 Erste vertikale Marke gefunden bei x=0, y=${y}`);
                finalCutMargin = y;
                break;
            }
            
            if (y % 20 === 0) {
                console.log(`⏳ Vertikaler Scan... bei y=${y}`);
            }
        }
    }
    
    // Symmetrische Beschneidung anwenden
    if (finalCutMargin !== null && finalCutMargin > 0) {
        console.log(`🎯 Symmetrische Beschneidung mit Margin: ${finalCutMargin}px`);
        
        margins.left = finalCutMargin;
        margins.right = width - finalCutMargin;
        margins.top = finalCutMargin;
        margins.bottom = height - finalCutMargin;
        margins.detected = true;
        margins.confidence = 0.9;
        
        // Validierung: Mindestens 50% des Bildes behalten
        const retainedRatio = Math.min(
            (margins.right - margins.left) / width,
            (margins.bottom - margins.top) / height
        );
        
        if (retainedRatio < 0.5) {
            console.log("⚠️ Zu viel Beschneidung, deaktiviere");
            margins.detected = false;
            margins.confidence = 0;
            margins.left = 0;
            margins.right = width;
            margins.top = 0;
            margins.bottom = height;
        } else {
            console.log(`🔧 Finale Beschneidung: ${finalCutMargin}px auf allen Seiten`);
            console.log(`📏 Resultat: ${width}x${height} → ${width - 2*finalCutMargin}x${height - 2*finalCutMargin}`);
        }
    } else {
        console.log("❌ Keine Schnittmarken erkannt");
        margins.detected = false;
        margins.confidence = 0;
    }
    
    return margins;
}

/**
 * Hilfsfunktion zum Beschneiden des Canvas
 * @param {HTMLCanvasElement} canvas - Original Canvas
 * @param {Object} margins - Beschneidungsränder
 * @returns {HTMLCanvasElement} Beschnittenes Canvas
 */
function cropCanvas(canvas, margins) {
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    
    const cropWidth = margins.right - margins.left;
    const cropHeight = margins.bottom - margins.top;
    
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    
    // Beschnittenen Bereich kopieren
    croppedCtx.drawImage(
        canvas,
        margins.left, margins.top, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    
    console.log(`✂️ Bild beschnitten von ${canvas.width}x${canvas.height} auf ${cropWidth}x${cropHeight} (${margins.method})`);
    return croppedCanvas;
}

/**
 * Prüft, ob eine Datei eine PDF ist
 * @param {File} file - Die zu prüfende Datei
 * @returns {boolean} True wenn PDF
 */
export function isPdfFile(file) {
    return file && (
        file.type === 'application/pdf' || 
        file.name.toLowerCase().endsWith('.pdf')
    );
}
