// Konstanten, die wir für die Bildverarbeitung benötigen
const EXTRA_TOP_SPACE = 5;
const EXTRA_BOTTOM_SPACE = 10;

// Diese Funktion erstellt den Pfad für die gekrümmte Maske
// (Logik direkt aus Ihrem Originalprojekt übernommen)
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
// (Logik direkt aus Ihrem Originalprojekt übernommen)
export function processEtikettImage(dataURL, curvature) {
    console.log("-> Starte processEtikettImage");
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            console.log("-> img.onload wurde ausgelöst. Bild ist geladen.");
            try {
            const originalWidth = img.width;
            const originalHeight = img.height;
            
            const newWidth = originalWidth;
            const newHeight = originalHeight + EXTRA_TOP_SPACE + EXTRA_BOTTOM_SPACE;
    
            // Temporäres Canvas, um das Originalbild zu zeichnen
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = originalWidth;
            tempCanvas.height = originalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);
    
            // Erweitertes Canvas mit mehr Platz oben und unten
            const extendedCanvas = document.createElement('canvas');
            extendedCanvas.width = newWidth;
            extendedCanvas.height = newHeight;
            const extCtx = extendedCanvas.getContext('2d', { willReadFrequently: true });
    
            // Kopiere die oberste Pixelreihe
            const topRowData = tempCtx.getImageData(0, 0, originalWidth, 1);
            for (let i = 0; i < EXTRA_TOP_SPACE; i++) {
              extCtx.putImageData(topRowData, 0, i);
            }
            
            // Zeichne das Originalbild in die Mitte
            extCtx.drawImage(img, 0, EXTRA_TOP_SPACE);
            
            // Kopiere die unterste Pixelreihe
            const bottomRowData = tempCtx.getImageData(0, originalHeight - 1, originalWidth, 1);
            for (let i = 0; i < EXTRA_BOTTOM_SPACE; i++) {
              extCtx.putImageData(bottomRowData, 0, EXTRA_TOP_SPACE + originalHeight + i);
            }
    
            // Finales Canvas für die Krümmung
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = newWidth;
            finalCanvas.height = newHeight;
            const finalCtx = finalCanvas.getContext('2d');
    
            const { topCurve, bottomCurve } = curvature;
            const clipPath = createClipPathAdvanced(newWidth, newHeight, topCurve, bottomCurve);
    
            finalCtx.save();
            finalCtx.clip(clipPath);
            finalCtx.drawImage(extendedCanvas, 0, 0);
            finalCtx.restore();
    
            // Gib das gekrümmte Bild als DataURL zurück
            console.log("-> Bildverarbeitung erfolgreich. Rufe resolve() auf.");
            resolve(finalCanvas.toDataURL());
            } catch (e) {
                console.error("-> Fehler innerhalb von img.onload:", e); // DEBUG
                reject(e);
            }
        };
        img.onerror = function(err) {
            console.error("-> img.onerror wurde ausgelöst. Bild konnte nicht geladen werden.", err); // DEBUG
            reject(new Error("Bild konnte nicht geladen werden. Überprüfen Sie die dataURL."));
        };
        
        console.log("-> Setze img.src. Die dataURL beginnt mit:", dataURL.substring(0, 30)); // DEBUG
        img.src = dataURL;
    });
}