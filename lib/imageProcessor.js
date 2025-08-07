// Konstanten, die wir für die Bildverarbeitung benötigen
const EXTRA_TOP_SPACE = 5;
const EXTRA_BOTTOM_SPACE = 10;

// Referenzgröße für die Krümmungsberechnung
// Die Krümmungswerte in bottleData.js sind für diese Referenzgröße optimiert
const REFERENCE_HEIGHT = 400; // Referenzhöhe für die Krümmungsberechnung

// Diese Funktion erstellt den Pfad für die gekrümmte Maske
// Zurück zur alten, perfekten 2D-Rand-Krümmung
export function createClipPathAdvanced(width, height, extraTop, extraBottom) {
    const path = new Path2D();
    const shiftY = extraTop < 0 ? -extraTop : 0;
    const topStart = shiftY + extraTop;
    const topControlY = shiftY - extraTop;
    const cornerShift = Math.abs(extraBottom) * 1.5;
    const bottomEdge = height - cornerShift;
    const bottomControlY = height + Math.abs(extraBottom);

    path.moveTo(0, topStart);
    path.quadraticCurveTo(width / 2, topControlY, width, topStart);
    path.lineTo(width, bottomEdge);
    path.quadraticCurveTo(width / 2, bottomControlY, 0, bottomEdge);
    path.closePath();
    
    return path;
}

// Diese Funktion nimmt ein Bild, erweitert es oben/unten und wendet die Krümmung an
// Die Krümmung wird proportional zur Bildgröße skaliert, um das Seitenverhältnis zu erhalten
// Optional: 3D-Zylindrische Verzerrung für realistische Bildverzerrung
export function processEtikettImage(dataURL, curvature, apply3D = false, verticalCurve = 0.05) {
    console.log("-> Starte processEtikettImage", { apply3D, verticalCurve });
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = async function() {
            console.log("-> img.onload wurde ausgelöst. Bild ist geladen.");
            console.log(`-> Original-Bildgröße: ${img.width}x${img.height}`);
            try {
            
            // SCHRITT 1: Berechne proportionale Krümmung basierend auf der Bildhöhe
            const heightScale = img.height / REFERENCE_HEIGHT;
            const scaledCurvature = {
                topCurve: curvature.topCurve * heightScale,
                bottomCurve: curvature.bottomCurve * heightScale
            };
            
            console.log(`-> Höhen-Skalierungsfaktor: ${heightScale.toFixed(2)}`);
            console.log(`-> Original-Krümmung: top=${curvature.topCurve}, bottom=${curvature.bottomCurve}`);
            console.log(`-> Skalierte Krümmung: top=${scaledCurvature.topCurve.toFixed(1)}, bottom=${scaledCurvature.bottomCurve.toFixed(1)}`);
            
            // SCHRITT 2: Verarbeitung mit der skalierten Krümmung (Original-Bildgröße beibehalten)
            const originalWidth = img.width;
            const originalHeight = img.height;
            
            const newWidth = originalWidth;
            const newHeight = originalHeight + EXTRA_TOP_SPACE + EXTRA_BOTTOM_SPACE;
    
            let processedImage = img;
            
                        // SCHRITT 2.5: Erweiterte 2D-Bildverzerrung für realistische Krümmung
            if (apply3D) {
                console.log("-> Wende erweiterte 2D-Bildverzerrung an");
                
                try {
                    // Erweiterte 2D-Canvas-Verzerrung (kein Three.js mehr)
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = originalWidth;
                    tempCanvas.height = originalHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(img, 0, 0);
                    
                    // Erweiterte Etikett-Krümmung mit positionsabhängiger Intensität
                    applyEnhancedBarrelDistortion(tempCanvas, scaledCurvature, verticalCurve);
                    
                    const enhancedImg = new Image();
                    enhancedImg.crossOrigin = 'Anonymous';
                    await new Promise((resolveEnhanced, rejectEnhanced) => {
                        enhancedImg.onload = () => resolveEnhanced();
                        enhancedImg.onerror = rejectEnhanced;
                        enhancedImg.src = tempCanvas.toDataURL();
                    });
                    
                    processedImage = enhancedImg;
                    console.log("-> Erweiterte 2D-Verzerrung erfolgreich");
                    
                } catch (error) {
                    console.warn("-> Erweiterte 2D-Verzerrung fehlgeschlagen, verwende Original:", error);
                    processedImage = img;
                }
            }
    
            // Erweitertes Canvas mit mehr Platz oben und unten
            const extendedCanvas = document.createElement('canvas');
            extendedCanvas.width = newWidth;
            extendedCanvas.height = newHeight;
            const extCtx = extendedCanvas.getContext('2d', { willReadFrequently: true });
    
            // Kopiere die oberste Pixelreihe
            const topRowData = extCtx.createImageData(originalWidth, 1);
            for (let x = 0; x < originalWidth; x++) {
                const pixel = getPixelFromImage(processedImage, x, 0);
                const index = x * 4;
                topRowData.data[index] = pixel.r;
                topRowData.data[index + 1] = pixel.g;
                topRowData.data[index + 2] = pixel.b;
                topRowData.data[index + 3] = pixel.a;
            }
            for (let i = 0; i < EXTRA_TOP_SPACE; i++) {
              extCtx.putImageData(topRowData, 0, i);
            }
            
            // Zeichne das (möglicherweise 3D-verzerrte) Bild in die Mitte
            extCtx.drawImage(processedImage, 0, EXTRA_TOP_SPACE);
            
            // Kopiere die unterste Pixelreihe
            const bottomRowData = extCtx.createImageData(originalWidth, 1);
            for (let x = 0; x < originalWidth; x++) {
                const pixel = getPixelFromImage(processedImage, x, originalHeight - 1);
                const index = x * 4;
                bottomRowData.data[index] = pixel.r;
                bottomRowData.data[index + 1] = pixel.g;
                bottomRowData.data[index + 2] = pixel.b;
                bottomRowData.data[index + 3] = pixel.a;
            }
            for (let i = 0; i < EXTRA_BOTTOM_SPACE; i++) {
              extCtx.putImageData(bottomRowData, 0, EXTRA_TOP_SPACE + originalHeight + i);
            }
    
            // Finales Canvas - KOMBINATION: Erweiterte 2D-Bildverzerrung + 2D-Rand-Krümmung
            if (apply3D) {
                // Bei erweitertem Modus: Erst das 2D-verzerrte Bild, dann ZUSÄTZLICH die 2D-Rand-Krümmung
                console.log("-> Erweiterter Modus: Wende zusätzlich 2D-Rand-Krümmung an");
                
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = newWidth;
                finalCanvas.height = newHeight;
                const finalCtx = finalCanvas.getContext('2d');

                // Verwende die skalierte Krümmung für das Rand-Clipping
                const clipPath = createClipPathAdvanced(newWidth, newHeight, scaledCurvature.topCurve, scaledCurvature.bottomCurve);

                finalCtx.save();
                finalCtx.clip(clipPath); // WICHTIG: Rand-Krümmung bleibt!
                finalCtx.drawImage(extendedCanvas, 0, 0);
                finalCtx.restore();
                
                console.log("-> Erweiterte 2D + 2D-Rand-Kombination erfolgreich");
                resolve(finalCanvas.toDataURL());
                return;
            }
            
            // Finales Canvas für die 2D-Krümmung (nur wenn 3D deaktiviert)
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = newWidth;
            finalCanvas.height = newHeight;
            const finalCtx = finalCanvas.getContext('2d');

            // Verwende die skalierte Krümmung für das Clipping (nur bei 2D-Modus)
            const clipPath = createClipPathAdvanced(newWidth, newHeight, scaledCurvature.topCurve, scaledCurvature.bottomCurve);

            finalCtx.save();
            finalCtx.clip(clipPath);
            finalCtx.drawImage(extendedCanvas, 0, 0);
            finalCtx.restore();            // Gib das gekrümmte Bild als DataURL zurück (2D-Modus)
            console.log("-> 2D-Bildverarbeitung erfolgreich. Rufe resolve() auf.");
            resolve(finalCanvas.toDataURL());
            
            } catch (e) {
                console.error("-> Fehler innerhalb von img.onload:", e);
                reject(e);
            }
        };
        img.onerror = function(err) {
            console.error("-> img.onerror wurde ausgelöst. Bild konnte nicht geladen werden.", err);
            reject(new Error("Bild konnte nicht geladen werden. Überprüfen Sie die dataURL."));
        };
        
        console.log("-> Setze img.src. Die dataURL beginnt mit:", dataURL.substring(0, 30));
        img.src = dataURL;
    });
}

/**
 * Korrekte Etikett-Krümmung: Ränder nach unten gewölbt (konkav)
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element
 * @param {Object} curvature - Krümmungswerte {topCurve, bottomCurve}
 * @param {number} verticalCurve - Stärke der vertikalen Biegung
 */
function applyEnhancedBarrelDistortion(canvas, curvature, verticalCurve = 0.05) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Berechne Krümmungsintensitäten (oben schwächer, unten WENIGER stark)
    const topIntensity = Math.abs(curvature.topCurve) * 0.002; // Schwächer oben
    const bottomIntensity = Math.abs(curvature.bottomCurve) * 0.003; // Weniger stark unten (war 0.005)
    
    console.log(`-> Korrekte Etikett-Krümmung: Oben=${topIntensity.toFixed(4)}, Unten=${bottomIntensity.toFixed(4)}`);
    
    // Hole das ursprüngliche Bild
    const originalImageData = ctx.getImageData(0, 0, width, height);
    const originalData = originalImageData.data;
    
    // Erstelle neues ImageData für das verzerrte Bild
    const distortedImageData = ctx.createImageData(width, height);
    const distortedData = distortedImageData.data;
    
    // Für jeden Pixel im Zielbild
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Berechne relative Positionen (0 = Mitte, -1/+1 = Ränder)
            const relativeX = (x - width / 2) / (width / 2); // -1 bis +1
            const relativeY = (y - height / 2) / (height / 2); // -1 bis +1
            
            // KORREKTE Krümmung: Ränder nach unten gewölbt (konkav)
            // Oben: relativeY = -1, Unten: relativeY = +1
            let intensity;
            if (relativeY < 0) {
                // Obere Hälfte: topIntensity verwenden
                intensity = topIntensity * Math.abs(relativeY);
            } else {
                // Untere Hälfte: bottomIntensity verwenden  
                intensity = bottomIntensity * relativeY;
            }
            
            // KORRIGIERT: Konkave Krümmung (nach innen gewölbt)
            const curvature_offset = intensity * relativeX * relativeX;
            
            // RICHTUNG UMGEKEHRT: Nach unten verschieben für konkave Form
            const sourceX = x;
            const sourceY = y + curvature_offset * height; // PLUS statt MINUS für richtige Richtung
            
            // Pixel-Verlängerung: Wiederhole Randpixel wenn außerhalb
            let finalSourceY = sourceY;
            if (finalSourceY < 0) {
                finalSourceY = 0; // Wiederhole oberste Pixelreihe
            } else if (finalSourceY >= height) {
                finalSourceY = height - 1; // Wiederhole unterste Pixelreihe
            }
            
            if (sourceX >= 0 && sourceX < width) {
                // Bilineare Interpolation für smooth Ergebnis
                const color = getInterpolatedPixel(originalData, width, height, sourceX, finalSourceY);
                
                const targetIndex = (y * width + x) * 4;
                distortedData[targetIndex] = color.r;
                distortedData[targetIndex + 1] = color.g;
                distortedData[targetIndex + 2] = color.b;
                distortedData[targetIndex + 3] = color.a;
            }
        }
    }
    
    // Setze das verzerrte Bild zurück
    ctx.putImageData(distortedImageData, 0, 0);
}

/**
 * Wendet zylindrische Verzerrung auf ein Canvas an (Legacy-Funktion)
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element
 * @param {Object} curvature - Krümmungswerte {topCurve, bottomCurve}
 * @param {number} verticalCurve - Stärke der vertikalen Biegung (0 = keine, 0.1 = stark)
 */
function applyCylindricalDistortionToCanvas(canvas, curvature, verticalCurve = 0.05) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Berechne Krümmungsintensität basierend auf den Curvature-Werten
    const curveRange = Math.abs(curvature.topCurve) + Math.abs(curvature.bottomCurve);
    const maxIntensity = 0.1; // Reduzierte maximale Verzerrungsintensität
    const intensity = Math.min(maxIntensity, curveRange / 50); // Schwächere Normalisierung
    
    console.log(`-> 3D-Verzerrung: Intensität=${intensity.toFixed(3)}, Bereich=${curveRange}`);
    
    // Hole das ursprüngliche Bild
    const originalImageData = ctx.getImageData(0, 0, width, height);
    const originalData = originalImageData.data;
    
    // Erstelle neues ImageData für das verzerrte Bild
    const distortedImageData = ctx.createImageData(width, height);
    const distortedData = distortedImageData.data;
    
    // Für jeden Pixel im Zielbild
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Berechne die ursprüngliche Position vor der zylindrischen Verzerrung
            const sourcePos = mapCylindricalPixel(x, y, width, height, intensity, verticalCurve);
            
            if (sourcePos && sourcePos.x >= 0 && sourcePos.x < width && 
                sourcePos.y >= 0 && sourcePos.y < height) {
                
                // Bilineare Interpolation für smooth Ergebnis
                const color = getInterpolatedPixel(originalData, width, height, sourcePos.x, sourcePos.y);
                
                const targetIndex = (y * width + x) * 4;
                distortedData[targetIndex] = color.r;
                distortedData[targetIndex + 1] = color.g;
                distortedData[targetIndex + 2] = color.b;
                distortedData[targetIndex + 3] = color.a;
            }
        }
    }
    
    // Setze das verzerrte Bild zurück
    ctx.putImageData(distortedImageData, 0, 0);
}

/**
 * Mappt einen Pixel von zylindrisch zu flach für realistische Krümmung
 * @param {number} x - X-Koordinate
 * @param {number} y - Y-Koordinate  
 * @param {number} width - Bildbreite
 * @param {number} height - Bildhöhe
 * @param {number} intensity - Verzerrungsintensität
 * @param {number} verticalCurve - Stärke der vertikalen Biegung
 * @returns {Object} Original-Koordinaten {x, y}
 */
function mapCylindricalPixel(x, y, width, height, intensity, verticalCurve = 0.05) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Normalisierte Koordinaten (-1 bis 1)
    const normalizedX = (x - centerX) / centerX;
    const normalizedY = (y - centerY) / centerY;
    
    // KORRIGIERTE zylindrische Verzerrung für echte Bildinhalt-Krümmung:
    // Wir müssen das UMGEKEHRTE Mapping machen - vom verzerrten zurück zum Original
    
    // Berechne die horizontale Entfernung vom Zentrum
    const horizontalDistance = Math.abs(normalizedX);
    
    // Zylindrische Transformation: Je weiter außen, desto mehr Krümmung
    const cylindricalCurve = horizontalDistance * horizontalDistance;
    
    // Y-Faktor: unten stärker als oben
    const yFactor = 0.5 + 0.5 * normalizedY; // 0 oben, 1 unten
    
    // UMGEKEHRTE Transformation: Füge Krümmung zum Originalbild hinzu
    // Dadurch wird der Bildinhalt tatsächlich gekrümmt
    const verticalShift = cylindricalCurve * intensity * verticalCurve * height * yFactor * 0.3;
    
    // Horizontale Streckung (umgekehrt)
    const horizontalStretch = 1 - cylindricalCurve * intensity * 0.1;
    
    // VORWÄRTS-Mapping: Berechne wo dieser Pixel im Original-Bild HINGEHÖRT
    const sourceX = centerX + normalizedX * centerX * horizontalStretch;
    const sourceY = y + verticalShift; // Nach oben verschieben (umgekehrt)
    
    return { x: sourceX, y: sourceY };
}

/**
 * Holt einen Pixel aus einem Image-Element
 * @param {HTMLImageElement} image - Das Bild
 * @param {number} x - X-Koordinate
 * @param {number} y - Y-Koordinate
 * @returns {Object} Farbe {r, g, b, a}
 */
function getPixelFromImage(image, x, y) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    
    return {
        r: data[0] || 0,
        g: data[1] || 0,
        b: data[2] || 0,
        a: data[3] || 255
    };
}

/**
 * Bilineare Interpolation für glatte Pixelübergänge
 * @param {Uint8ClampedArray} data - Bilddaten
 * @param {number} width - Bildbreite
 * @param {number} height - Bildhöhe  
 * @param {number} x - X-Koordinate (kann Dezimalzahl sein)
 * @param {number} y - Y-Koordinate (kann Dezimalzahl sein)
 * @returns {Object} Interpolierte Farbe {r, g, b, a}
 */
function getInterpolatedPixel(data, width, height, x, y) {
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, width - 1);
    const y2 = Math.min(y1 + 1, height - 1);
    
    const fx = x - x1;
    const fy = y - y1;
    
    // Hole die 4 umliegenden Pixel
    const getPixel = (px, py) => {
        const index = (py * width + px) * 4;
        return {
            r: data[index] || 0,
            g: data[index + 1] || 0,
            b: data[index + 2] || 0,
            a: data[index + 3] || 0
        };
    };
    
    const c1 = getPixel(x1, y1);
    const c2 = getPixel(x2, y1);
    const c3 = getPixel(x1, y2);
    const c4 = getPixel(x2, y2);
    
    // Bilineare Interpolation
    const interpolate = (c1, c2, c3, c4, fx, fy) => {
        const top = c1 * (1 - fx) + c2 * fx;
        const bottom = c3 * (1 - fx) + c4 * fx;
        return top * (1 - fy) + bottom * fy;
    };
    
    return {
        r: Math.round(interpolate(c1.r, c2.r, c3.r, c4.r, fx, fy)),
        g: Math.round(interpolate(c1.g, c2.g, c3.g, c4.g, fx, fy)),
        b: Math.round(interpolate(c1.b, c2.b, c3.b, c4.b, fx, fy)),
        a: Math.round(interpolate(c1.a, c2.a, c3.a, c4.a, fx, fy))
    };
}