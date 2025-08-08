// PDF-Verarbeitung und Schnittmarken-Erkennung
// Benötigt: npm install pdf-lib pdfjs-dist

/**
 * Konvertiert PDF zu Bild und erkennt automatisch Schnittmarken
 * @param {File} pdfFile - Die PDF-Datei
 * @param {function} onProgress - Progress-Callback
 * @returns {Promise<string>} DataURL des verarbeiteten Bildes
 */
export async function processPdfToImage(pdfFile, onProgress = () => {}) {
    console.log("🔄 PDF-Verarbeitung gestartet:", pdfFile.name);
    
    try {
        onProgress?.(10, 'PDF wird geladen...');
        
        // Dynamischer Import von PDF.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Worker-Pfad setzen (Next.js) - für moderne PDF.js Version
        if (typeof window !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        }
        
        // PDF als ArrayBuffer laden
        const arrayBuffer = await pdfFile.arrayBuffer();
        
        onProgress?.(25, 'PDF wird analysiert...');
        
        // PDF-Dokument laden
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (pdf.numPages === 0) {
            throw new Error('PDF enthält keine Seiten');
        }
        
        // Erste Seite rendern (Etiketten sind meist auf der ersten Seite)
        const page = await pdf.getPage(1);
        
        onProgress?.(50, 'PDF-Seite wird gerendert...');
        
        // Viewport für hohe Qualität (300 DPI)
        const scale = 3.0; // Entspricht etwa 300 DPI
        const viewport = page.getViewport({ scale });
        
        // Canvas für Rendering erstellen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // PDF-Seite auf Canvas rendern
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        
        onProgress?.(75, 'Schnittmarken werden erkannt...');
        
        // SCHRITT 1: Versuche PDF-Metadaten und Clipbox zu finden
        let pdfCropInfo = null;
        try {
            pdfCropInfo = await extractPdfCropInfo(pdf, page);
            if (pdfCropInfo) {
                console.log("📋 PDF-Clipbox gefunden:", pdfCropInfo);
            }
        } catch {
            console.log("ℹ️ Keine PDF-Clipbox gefunden, versuche Bildanalyse...");
        }
        
        // SCHRITT 2: Schnittmarken-Erkennung mit verbessertem Algorithmus
        const croppedCanvas = await detectAndCropRegistrationMarks(canvas, ctx, pdfCropInfo);
        
        onProgress?.(90, 'Bild wird optimiert...');
        
        // Als hochqualitatives PNG exportieren
        const dataUrl = croppedCanvas.toDataURL('image/png', 1.0);
        
        onProgress?.(100, 'PDF-Verarbeitung abgeschlossen!');
        
        console.log("✅ PDF erfolgreich zu Bild konvertiert");
        return dataUrl;
        
    } catch (error) {
        console.error("❌ PDF-Verarbeitungsfehler:", error);
        throw new Error(`PDF-Verarbeitung fehlgeschlagen: ${error.message}`);
    }
}

/**
 * Versucht PDF-Clipbox oder Bleed-Box Informationen zu extrahieren
 * @param {PDFDocumentProxy} pdf - PDF-Dokument
 * @param {PDFPageProxy} page - PDF-Seite
 * @returns {Object|null} Crop-Informationen oder null
 */
async function extractPdfCropInfo(pdf, page) {
    try {
        // Versuche verschiedene PDF-Boxen zu lesen
        const annotations = await page.getAnnotations();
        
        // PDF-Seiten-Dimensionen
        const viewport = page.getViewport({ scale: 1.0 });
        const mediaBox = [0, 0, viewport.width, viewport.height];
        
        // Versuche CropBox, BleedBox, TrimBox zu finden (typisch für Druckdateien)
        // Diese Information ist nicht direkt über PDF.js verfügbar,
        // aber wir können nach typischen Druckrändern suchen
        
        console.log("📄 PDF-Seiten-Info:", {
            width: viewport.width,
            height: viewport.height,
            mediaBox,
            hasAnnotations: annotations.length > 0
        });
        
        // Wenn das PDF sehr große Ränder hat (typisch für Druckdateien),
        // können wir Standard-Schnittränder vermuten
        const aspectRatio = viewport.width / viewport.height;
        
        // Typische Druckformat-Erkennung
        if (isDruckFormat(viewport.width, viewport.height, aspectRatio)) {
            return {
                type: 'druckformat',
                suggestedMargins: {
                    left: viewport.width * 0.05,   // 5% Rand
                    right: viewport.width * 0.95,
                    top: viewport.height * 0.05,
                    bottom: viewport.height * 0.95
                }
            };
        }
        
        return null;
        
    } catch (error) {
        console.log("ℹ️ PDF-Metadaten-Extraktion fehlgeschlagen:", error);
        return null;
    }
}

/**
 * Prüft ob es sich um ein typisches Druckformat handelt
 * @param {number} width - Breite
 * @param {number} height - Höhe  
 * @param {number} aspectRatio - Seitenverhältnis
 * @returns {boolean} True wenn Druckformat erkannt
 */
function isDruckFormat(width, height, aspectRatio) {
    // Typische Druckformate (DIN A4, A3, etc.) haben meist größere Dimensionen
    const isLargeFormat = width > 2000 || height > 2000;
    
    // Typische Druckformat-Seitenverhältnisse
    const commonPrintRatios = [
        1.414, // DIN A-Format (√2)
        1.5,   // 3:2
        1.333, // 4:3
        0.707  // Querformat DIN A
    ];
    
    const ratioMatch = commonPrintRatios.some(ratio => 
        Math.abs(aspectRatio - ratio) < 0.1 || Math.abs(aspectRatio - (1/ratio)) < 0.1
    );
    
    return isLargeFormat && ratioMatch;
}

/**
 * Erkennt Schnittmarken und beschneidet das Bild automatisch
 * @param {HTMLCanvasElement} canvas - Original-Canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas-Kontext  
 * @param {Object|null} pdfCropInfo - PDF-Cropbox-Informationen
 * @returns {HTMLCanvasElement} Beschnittenes Canvas
 */
async function detectAndCropRegistrationMarks(canvas, ctx, pdfCropInfo = null) {
    const width = canvas.width;
    const height = canvas.height;
    
    console.log("🔍 Mehrstufige Schnittmarken-Erkennung in", `${width}x${height}px`);
    
    // Zusätzliche Canvas-Analyse für besseres Debugging
    const debugImageData = ctx.getImageData(0, 0, width, height);
    const debugData = debugImageData.data;
    
    console.log("🔍 Canvas-Analyse:");
    console.log(`📊 Canvas Dimensionen: ${width}x${height}`);
    
    // Analysiere verschiedene Bereiche der PDF
    const samplePositions = [
        { x: 0, y: 0, name: "Ecke oben-links" },
        { x: width - 1, y: 0, name: "Ecke oben-rechts" },
        { x: 0, y: height - 1, name: "Ecke unten-links" },
        { x: width - 1, y: height - 1, name: "Ecke unten-rechts" },
        { x: Math.floor(width / 2), y: Math.floor(height / 2), name: "Bildmitte" }
    ];
    
    samplePositions.forEach(pos => {
        const index = (pos.y * width + pos.x) * 4;
        const r = debugData[index];
        const g = debugData[index + 1];
        const b = debugData[index + 2];
        const a = debugData[index + 3];
        const brightness = (r + g + b) / 3;
        console.log(`🎨 ${pos.name} (${pos.x},${pos.y}): RGB(${r},${g},${b}) Alpha:${a} Helligkeit:${brightness.toFixed(1)}`);
    });
    
    // Suche nach nicht-weißen Pixeln
    let nonWhitePixels = 0;
    let darkPixels = 0;
    let minBrightness = 255;
    let maxBrightness = 0;
    
    for (let i = 0; i < debugData.length; i += 4) {
        const r = debugData[i];
        const g = debugData[i + 1];
        const b = debugData[i + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < 255) nonWhitePixels++;
        if (brightness < 200) darkPixels++;
        
        minBrightness = Math.min(minBrightness, brightness);
        maxBrightness = Math.max(maxBrightness, brightness);
    }
    
    const totalPixels = debugData.length / 4;
    console.log("📈 Pixel-Statistik:", {
        totalPixels,
        nonWhitePixels,
        darkPixels,
        nonWhiteRatio: (nonWhitePixels / totalPixels * 100).toFixed(2) + "%",
        darkRatio: (darkPixels / totalPixels * 100).toFixed(2) + "%",
        minBrightness,
        maxBrightness
    });
    
        // SCHRITT 1: Verwende PDF-Metadaten falls verfügbar
    if (pdfCropInfo && pdfCropInfo.type === 'druckformat') {
        console.log("📋 Verwende PDF-Metadaten für Beschneidung:", pdfCropInfo);
        
        const cropMargins = {
            left: Math.round(pdfCropInfo.cropMargins.left * width),
            right: Math.round(width - (pdfCropInfo.cropMargins.right * width)),
            top: Math.round(pdfCropInfo.cropMargins.top * height),
            bottom: Math.round(height - (pdfCropInfo.cropMargins.bottom * height)),
            detected: true,
            confidence: 1.0,
            method: 'pdf-metadaten'
        };
        
        return cropCanvas(canvas, cropMargins);
    }
    
    // SCHRITT 2: MediaBox-basierte Beschneidung (für Standard-Druckformate)
    console.log("📏 Prüfe MediaBox-basierte Beschneidung...");
    
    // Analysiere MediaBox-Verhältnis zur Canvas-Größe
    if (pdfCropInfo && pdfCropInfo.mediaBox) {
        const mediaWidth = pdfCropInfo.mediaBox[2] - pdfCropInfo.mediaBox[0];
        const mediaHeight = pdfCropInfo.mediaBox[3] - pdfCropInfo.mediaBox[1];
        const mediaRatio = mediaWidth / mediaHeight;
        const canvasRatio = width / height;
        
        console.log("📐 MediaBox-Analyse:", {
            mediaBox: pdfCropInfo.mediaBox,
            mediaSize: `${mediaWidth.toFixed(1)}x${mediaHeight.toFixed(1)}`,
            mediaRatio: mediaRatio.toFixed(3),
            canvasSize: `${width}x${height}`,
            canvasRatio: canvasRatio.toFixed(3),
            ratioDiff: Math.abs(mediaRatio - canvasRatio).toFixed(3)
        });
        
        // Wenn PDF deutlich größer als MediaBox → wahrscheinlich mit Schnittmarken
        const oversizeX = width / (mediaWidth * 3); // 3 = ungefährer DPI-Skalierungsfaktor
        const oversizeY = height / (mediaHeight * 3);
        
        if (oversizeX > 1.1 || oversizeY > 1.1) { // 10% größer als erwartet
            console.log("🎯 PDF scheint Schnittmarken zu haben - automatische Beschneidung");
            
            // Berechne 3mm Schnittmarken-Rand (bei ca. 300 DPI)
            const dpiEstimate = Math.max(width / mediaWidth, height / mediaHeight);
            const cropMarginPx = Math.round((3 / 25.4) * dpiEstimate); // 3mm in Pixel
            
            console.log(`📏 Geschätzte DPI: ${dpiEstimate.toFixed(1)}, Schnittrand: ${cropMarginPx}px`);
            
            const cropMargins = {
                left: cropMarginPx,
                right: width - cropMarginPx,
                top: cropMarginPx,
                bottom: height - cropMarginPx,
                detected: true,
                confidence: 0.8,
                method: 'mediabox-automatik'
            };
            
            // Validierung: Nicht zu viel beschneiden
            const retainedRatio = Math.min(
                (cropMargins.right - cropMargins.left) / width,
                (cropMargins.bottom - cropMargins.top) / height
            );
            
            if (retainedRatio > 0.6) { // Mindestens 60% behalten
                console.log(`✅ MediaBox-Beschneidung angewendet (behält ${(retainedRatio * 100).toFixed(1)}%)`);
                return cropCanvas(canvas, cropMargins);
            } else {
                console.log(`⚠️ MediaBox-Beschneidung zu aggressiv (nur ${(retainedRatio * 100).toFixed(1)}% behalten)`);
            }
        }
    }
    
    // SCHRITT 2: Bild-Daten für Analyse holen
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // SCHRITT 3: Verbesserter Algorithmus mit Konfidenz-Bewertung
    const cropMargins = findCropMarginsAdvanced(data, width, height);
    
    if (cropMargins.detected && cropMargins.confidence > 0.7) {
        console.log("✅ Hochkonfidente Schnittmarken erkannt:", cropMargins);
        return cropCanvas(canvas, cropMargins);
    } else if (cropMargins.detected && cropMargins.confidence > 0.4) {
        console.log("⚠️ Mögliche Schnittmarken erkannt, aber niedrige Konfidenz:", cropMargins);
        console.log("🤔 Prüfe, ob Beschneidung sinnvoll ist...");
        
        // Zusätzliche Validierung: Prüfe ob beschnittener Bereich noch sinnvoll ist
        const cropWidth = cropMargins.right - cropMargins.left;
        const cropHeight = cropMargins.bottom - cropMargins.top;
        const cropRatio = Math.min(cropWidth / width, cropHeight / height);
        
        if (cropRatio > 0.6) { // Mindestens 60% des Originals behalten
            console.log("✅ Beschneidung akzeptiert (", Math.round(cropRatio * 100), "% der Originalgröße)");
            return cropCanvas(canvas, cropMargins);
        } else {
            console.log("❌ Beschneidung verworfen - würde zu viel entfernen");
        }
    } else {
        console.log("ℹ️ Keine verlässlichen Schnittmarken erkannt");
    }
    
    console.log("📄 Verwende Original-PDF ohne Beschneidung");
    return canvas;
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
    
    console.log(`✂️ Bild beschnitten von ${canvas.width}x${canvas.height} auf ${cropWidth}x${cropHeight} (${margins.method || 'bildanalyse'})`);
    return croppedCanvas;
}

/**
 * Hilfsfunktionen zum Finden des Marken-Endes
 */
function findVerticalMarkEnd(startX, y, hasVerticalDarkLine) {
    // Suche das Ende der vertikalen Marke (von links nach rechts)
    for (let x = startX; x < startX + 20; x++) { // Max. 20px weitersuchen
        if (!hasVerticalDarkLine(x, y, 4)) { // Wenn keine dunkle Linie mehr
            return x; // Ende der Marke gefunden
        }
    }
    return startX + 5; // Fallback: 5px nach Markenbeginn
}

function findHorizontalMarkEnd(x, startY, hasHorizontalDarkLine) {
    // Suche das Ende der horizontalen Marke (von oben nach unten)
    for (let y = startY; y < startY + 20; y++) { // Max. 20px weitersuchen
        if (!hasHorizontalDarkLine(x, y, 4)) { // Wenn keine dunkle Linie mehr
            return y; // Ende der Marke gefunden
        }
    }
    return startY + 5; // Fallback: 5px nach Markenbeginn
}

/**
 * Verbesserter Algorithmus zur Schnittmarken-Erkennung mit Konfidenz-Bewertung
 * @param {Uint8ClampedArray} data - Bilddaten
 * @param {number} width - Bildbreite
 * @param {number} height - Bildhöhe
 * @returns {Object} Crop-Ränder mit Konfidenz-Wert
 */
function findCropMarginsAdvanced(data, width, height) {
    // NEUE LOGIK: Finde die äußerste (letzte) Schnittmarke und schneide symmetrisch
    const DPI_ASSUMPTION = 300;
    const DIAGONAL_OFFSET_MM = 5; // Diagonaler Sprung nach erster Marke
    const SEARCH_RANGE_MM = 5; // Suchbereich für weitere Marken
    const DIAGONAL_OFFSET_PX = Math.round((DIAGONAL_OFFSET_MM / 25.4) * DPI_ASSUMPTION); // ca. 59px
    const SEARCH_RANGE_PX = Math.round((SEARCH_RANGE_MM / 25.4) * DPI_ASSUMPTION); // ca. 59px
    
    const SCAN_DEPTH = 80; // Wie weit vom Rand scannen
    const DARK_THRESHOLD = 250; // Empfindlichkeit für dünne Marken
    const MIN_LINE_LENGTH = 6; // Mindestlänge einer Schnittmarke
    
    console.log("🔧 Neue Schnittmarken-Logik:", {
        scanDepth: SCAN_DEPTH,
        darkThreshold: DARK_THRESHOLD,
        diagonalOffsetPx: DIAGONAL_OFFSET_PX,
        searchRangePx: SEARCH_RANGE_PX
    });
    
    let margins = {
        left: 0,
        right: width,
        top: 0,
        bottom: height,
        detected: false,
        confidence: 0,
        method: 'L-förmige-marken'
    };
    
    // Hilfsfunktionen
    const getPixelBrightness = (x, y) => {
        const index = (y * width + x) * 4;
        return (data[index] + data[index + 1] + data[index + 2]) / 3;
    };
    
    const isInBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;
    
    // Prüfe vertikale Linie (für linke Schnittmarke)
    const hasVerticalDarkLine = (x, startY, length) => {
        let darkPixels = 0;
        let totalPixels = 0;
        let brightnessValues = [];
        
        for (let i = 0; i < length; i += 2) {
            const y = startY + i;
            if (isInBounds(x, y)) {
                totalPixels++;
                const brightness = getPixelBrightness(x, y);
                brightnessValues.push(brightness);
                if (brightness < DARK_THRESHOLD) {
                    darkPixels++;
                }
            }
        }
        
        const darkRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
        const avgBrightness = brightnessValues.reduce((a, b) => a + b, 0) / brightnessValues.length;
        
        // Debug-Ausgabe für jeden Scan
        if (x % 10 === 0) { // Nur jeden 10. Pixel loggen
            console.log(`🔍 Vertikaler Scan x=${x}, y=${startY}: ${darkPixels}/${totalPixels} dunkel (${(darkRatio * 100).toFixed(1)}%), Ø Helligkeit: ${avgBrightness.toFixed(1)}`);
        }
        
        return darkRatio >= 0.25; // 25% der Linie dunkel
    };
    
    // Prüfe horizontale Linie (für obere Schnittmarke)  
    const hasHorizontalDarkLine = (startX, y, length) => {
        let darkPixels = 0;
        let totalPixels = 0;
        let brightnessValues = [];
        
        for (let i = 0; i < length; i += 2) {
            const x = startX + i;
            if (isInBounds(x, y)) {
                totalPixels++;
                const brightness = getPixelBrightness(x, y);
                brightnessValues.push(brightness);
                if (brightness < DARK_THRESHOLD) {
                    darkPixels++;
                }
            }
        }
        
        const darkRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
        const avgBrightness = brightnessValues.reduce((a, b) => a + b, 0) / brightnessValues.length;
        
        // Debug-Ausgabe für jeden Scan
        if (y % 10 === 0) { // Nur jeden 10. Pixel loggen
            console.log(`🔍 Horizontaler Scan y=${y}, x=${startX}: ${darkPixels}/${totalPixels} dunkel (${(darkRatio * 100).toFixed(1)}%), Ø Helligkeit: ${avgBrightness.toFixed(1)}`);
        }
        
        return darkRatio >= 0.25; // 25% der Linie dunkel
    };
    
    console.log("🔍 Starte L-förmige Marken-Suche...");
    console.log(`📊 Bild-Dimensionen: ${width}x${height}px`);
    console.log(`🎯 Such-Parameter: SCAN_DEPTH=${SCAN_DEPTH}, DARK_THRESHOLD=${DARK_THRESHOLD}, MIN_LINE_LENGTH=${MIN_LINE_LENGTH}`);
    
    let verticalCutPosition = null;
    let horizontalCutPosition = null;
    
    // NEUE SYMMETRISCHE SCHNITTMARKEN-LOGIK
    let finalCutMargin = null;
    
    console.log("🔍 Starte neue Schnittmarken-Suche...");
    
    // SCHRITT 1: Von links nach rechts scannen (0,0 → rechts)
    console.log("� Schritt 1: Suche erste horizontale Marke von links...");
    let firstHorizontalMark = null;
    
    for (let x = 0; x < Math.min(SCAN_DEPTH, width / 2); x += 2) {
        // Scanne horizontal bei y=0 nach rechts
        if (hasHorizontalDarkLine(x, 0, MIN_LINE_LENGTH)) {
            firstHorizontalMark = { x: x, y: 0 };
            console.log(`🎉 Erste horizontale Marke gefunden bei x=${x}, y=0`);
            break;
        }
        
        if (x % 10 === 0) {
            console.log(`⏳ Horizontaler Scan... aktuell bei x=${x}`);
        }
    }
    
    // SCHRITT 2: Diagonaler Sprung und Suche nach letzter Marke
    if (firstHorizontalMark !== null) {
        const jumpX = firstHorizontalMark.x + DIAGONAL_OFFSET_PX;
        const jumpY = DIAGONAL_OFFSET_PX;
        
        console.log(`📍 Schritt 2: Springe diagonal zu x=${jumpX}, y=${jumpY} und suche letzte Marke...`);
        
        let lastHorizontalMark = firstHorizontalMark;
        
        // Suche weitere Marken in Scan-Richtung (horizontal nach rechts)
        for (let x = jumpX; x < Math.min(jumpX + SEARCH_RANGE_PX, width); x += 2) {
            if (hasHorizontalDarkLine(x, jumpY, MIN_LINE_LENGTH)) {
                lastHorizontalMark = { x: x, y: jumpY };
                console.log(`📍 Weitere horizontale Marke gefunden bei x=${x}, y=${jumpY}`);
            }
        }
        
        finalCutMargin = lastHorizontalMark.x;
        console.log(`✂️ Finale Schnittposition: ${finalCutMargin}px (von letzter Marke bei x=${lastHorizontalMark.x})`);
    }
    
    // SCHRITT 3: Von oben nach unten scannen (0,0 → unten) - zur Bestätigung
    console.log("📍 Schritt 3: Bestätige mit vertikalem Scan von oben...");
    let firstVerticalMark = null;
    
    for (let y = 0; y < Math.min(SCAN_DEPTH, height / 2); y += 2) {
        // Scanne vertikal bei x=0 nach unten
        if (hasVerticalDarkLine(0, y, MIN_LINE_LENGTH)) {
            firstVerticalMark = { x: 0, y: y };
            console.log(`🎉 Erste vertikale Marke gefunden bei x=0, y=${y}`);
            
            // Wenn kein finalCutMargin aus horizontalem Scan, verwende vertikalen
            if (finalCutMargin === null) {
                finalCutMargin = y;
                console.log(`✂️ Finale Schnittposition (vertikal): ${finalCutMargin}px`);
            }
            break;
        }
        
        if (y % 10 === 0) {
            console.log(`⏳ Vertikaler Scan... aktuell bei y=${y}`);
        }
    }
    
    // SCHRITT 4: Symmetrische Beschneidung anwenden
    if (finalCutMargin !== null) {
        console.log(`🎯 Symmetrische Beschneidung mit Margin: ${finalCutMargin}px`);
        
        margins.left = finalCutMargin;
        margins.right = width - finalCutMargin;
        margins.top = finalCutMargin;
        margins.bottom = height - finalCutMargin;
        margins.detected = true;
        margins.confidence = 0.9;
        
        console.log(`🔧 Finale Beschneidung: ${finalCutMargin}px auf allen Seiten`);
        console.log(`📏 Resultat: ${width}x${height} → ${width - 2*finalCutMargin}x${height - 2*finalCutMargin}`);
    } else {
        console.log("❌ Keine Schnittmarken erkannt");
        margins.detected = false;
        margins.confidence = 0;
    }
    
    // Rückgabe der Margins
    return margins;

    // === HILFSFUNKTIONEN ===
    
    // Boundary-Prüfung
    const isInBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;
    
    // Pixelhelligkeit abrufen
    const getPixelBrightness = (x, y) => {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        return (r + g + b) / 3;
    };
    
    // Prüfe vertikale Linie (für linke Schnittmarke)
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
    
    // Prüfe horizontale Linie (für obere Schnittmarke)  
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
