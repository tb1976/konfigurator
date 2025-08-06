// components/KonfiguratorAnsicht.jsx

"use client";

import { useEffect, useRef } from 'react';
import { weinfarbenDaten } from '../lib/bottleData';

// Ihre bewährten Hilfsfunktionen
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export default function KonfiguratorAnsicht({
    flascheSrc,
    inhalt,
    weinfarbe,
    customColor,
    weinSettings,
    onCanvasReady,
    isDarkWineBottle = false,
    bottleData = null // Bottle data for dark wine offset
}) {
    const canvasRef = useRef(null);
    const imagesRef = useRef({}); // Speichert die geladenen Bild-Objekte

    // DEBUG: Prüfe inhalt-Prop
    console.log('🔧 Empfangene Props:', {
        flascheSrc,
        inhalt: inhalt,
        inhaltsPosition: inhalt?.position,
        weinfarbe,
        isDarkWineBottle
    });

    // ZUSÄTZLICHER DEBUG: Detaillierte Inhalt-Analyse
    console.log('🔍 Detaillierte Inhalt-Analyse:', {
        'inhalt vorhanden': !!inhalt,
        'inhalt.src': inhalt?.src,
        'inhalt.position vorhanden': !!inhalt?.position,
        'inhalt.position': inhalt?.position,
        'position.top': inhalt?.position?.top,
        'position.left': inhalt?.position?.left,
        'position.width': inhalt?.position?.width,
        'position.height': inhalt?.position?.height
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (onCanvasReady) {
            onCanvasReady(canvas);
        }

        const imageUrls = {
            flasche: flascheSrc,
            inhalt: inhalt.src,
        };

        const loadImage = (key, src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    imagesRef.current[key] = img;
                    resolve();
                };
                img.onerror = reject;
                img.src = src;
            });
        };

        Promise.all(Object.entries(imageUrls).map(([key, src]) => loadImage(key, src)))
            .then(() => {
                drawCanvas(canvas, ctx);
            })
            .catch(err => console.error("Fehler beim Laden der Bilder für den Canvas:", err));

    }, [flascheSrc, inhalt, weinfarbe, customColor, weinSettings, onCanvasReady, isDarkWineBottle]);

    function drawCanvas(canvas, ctx) {
        const { flasche, inhalt: inhaltsImage } = imagesRef.current;
        if (!flasche || !inhaltsImage) return;

        // Verwende feste Canvas-Größe statt natürliche Bildgröße
        const fixedWidth = 956;   // Feste Referenzbreite
        const fixedHeight = 3000; // Feste Referenzhöhe

        // Debug: Ausgabe aller relevanten Eigenschaften
        console.log('🖼️ Flaschenbild-Debug:', {
            src: flasche.src,
            naturalWidth: flasche.naturalWidth,
            naturalHeight: flasche.naturalHeight,
            isDarkWineBottle: isDarkWineBottle,
            bottleDataExists: !!bottleData,
            darkWineOffsetX: bottleData?.darkWineOffsetX || 'undefined',
            canvasWidth: fixedWidth,
            canvasHeight: fixedHeight
        });
        
        canvas.width = fixedWidth;
        canvas.height = fixedHeight;

        // DEBUG: Prüfe Alpha-Channel und sichtbare Bereiche
        if (isDarkWineBottle) {
            console.log("🔍 Analysiere Dark-Bild für Transparenz-Probleme...");
            
            // Zeichne das Bild temporär um die Pixel zu analysieren
            ctx.drawImage(flasche, 0, 0, fixedWidth, fixedHeight);
            
            // Analysiere eine horizontale Linie in der Mitte
            const midY = Math.floor(fixedHeight / 2);
            const imageData = ctx.getImageData(0, midY, fixedWidth, 1);
            const data = imageData.data;
            
            let leftMostPixel = -1;
            let rightMostPixel = -1;
            
            // Finde den äußersten linken sichtbaren Pixel
            for (let x = 0; x < fixedWidth; x++) {
                const alpha = data[x * 4 + 3]; // Alpha-Kanal
                if (alpha > 10) { // Pixel ist sichtbar
                    leftMostPixel = x;
                    break;
                }
            }
            
            // Finde den äußersten rechten sichtbaren Pixel
            for (let x = fixedWidth - 1; x >= 0; x--) {
                const alpha = data[x * 4 + 3]; // Alpha-Kanal
                if (alpha > 10) { // Pixel ist sichtbar
                    rightMostPixel = x;
                    break;
                }
            }
            
            console.log("📏 Sichtbare Bereiche:", {
                leftMost: leftMostPixel,
                rightMost: rightMostPixel,
                width: rightMostPixel - leftMostPixel,
                totalWidth: fixedWidth,
                centerOffset: (fixedWidth / 2) - ((leftMostPixel + rightMostPixel) / 2),
                imageSrc: flasche.src,
                expectsIdenticalTo: flasche.src.replace('Dark', 'Can')
            });
        }

        // Zeichne das Flaschenbild auf die feste Canvas-Größe
        // DEBUGGING: Entferne den Offset erstmal komplett
        console.log('🎯 Canvas Draw Debug:', {
            isDarkWineBottle,
            bottleData: bottleData ? 'exists' : 'null',
            darkWineOffsetX: bottleData?.darkWineOffsetX,
            drawX: 0,
            drawY: 0,
            drawWidth: fixedWidth,
            drawHeight: fixedHeight
        });
        ctx.drawImage(flasche, 0, 0, fixedWidth, fixedHeight);

        if (!weinfarbe) {
            // Wenn keine Farbe gewählt ist, sind wir hier fertig. Es wird nur die Flasche angezeigt.
            return; 
        }

        // Calculate target dimensions first
        const scaleFactor = canvas.width / 220; // 956/220 ≈ 4.35
        
        // CRITICAL DEBUG: Prüfe inhalt.position nochmal hier oben
        console.log('🚨 CRITICAL DEBUG vor Berechnung:', {
            'inhalt existiert': !!inhalt,
            'inhalt.position existiert': !!inhalt.position,
            'inhalt.position Wert': inhalt.position,
            'Type von inhalt.position': typeof inhalt.position
        });
        
        // Unterstützung für sowohl reine Zahlen als auch "160px" Strings
        const displayWidth = inhalt.position ? 
            (typeof inhalt.position.width === 'number' ? 
                inhalt.position.width : 
                parseInt(inhalt.position.width, 10)) : 220;
        const drawWidth = Math.round(displayWidth * scaleFactor);
        
        // Parse die Positionswerte auch hier
        const displayXPos = inhalt.position ? 
            (typeof inhalt.position.left === 'number' ? 
                inhalt.position.left : 
                parseInt(inhalt.position.left, 10)) : 0;
        const displayYPos = inhalt.position ? 
            (typeof inhalt.position.top === 'number' ? 
                inhalt.position.top : 
                parseInt(inhalt.position.top, 10)) : 0;
        
        const xPos = Math.round(displayXPos * scaleFactor);
        const yPos = Math.round(displayYPos * scaleFactor);
        
        // Handle percentage values for height and pure numbers
        let drawHeight = canvas.height;
        if (inhalt.position && inhalt.position.height !== undefined) {
            if (typeof inhalt.position.height === 'string' && inhalt.position.height.includes('%')) {
                // Alte Prozent-Syntax: "98%"
                const percentage = parseInt(inhalt.position.height, 10);
                drawHeight = Math.round(canvas.height * percentage / 100);
            } else if (typeof inhalt.position.height === 'number' && inhalt.position.height <= 100) {
                // Neue Prozent-Syntax: 98 (als reine Zahl für Prozent)
                drawHeight = Math.round(canvas.height * inhalt.position.height / 100);
            } else {
                // Absolute Pixel-Werte (alte "700px" oder neue 700)
                const displayHeight = typeof inhalt.position.height === 'number' ? 
                    inhalt.position.height : 
                    parseInt(inhalt.position.height, 10);
                drawHeight = Math.round(displayHeight * scaleFactor);
            }
        }

        // 1. Temporären Canvas für den gefärbten Inhalt erstellen - MIT KORREKTEN ZIELDIMENSIONEN
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawWidth;
        tempCanvas.height = drawHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        // Draw original image scaled to target dimensions
        tempCtx.drawImage(inhaltsImage, 0, 0, drawWidth, drawHeight);

        const colorToUse = weinfarbe === 'custom' ? customColor : (weinfarbenDaten.find(color => color.id === weinfarbe)?.hex || '#FF6B6B');

        const rgb = hexToRgb(colorToUse);
        if (!rgb) return;

        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const { opacity, contrast, blendMode } = weinSettings;

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i]; // Grauwert
        const alpha = data[i + 3]; // Alpha-Kanal
        
        if (alpha > 0) { // Nur sichtbare Pixel bearbeiten
          let r, g, b;
          
          // Normalisierte Werte für Berechnungen
          const grayNorm = gray / 255;
          const rNorm = rgb.r / 255;
          const gNorm = rgb.g / 255;
          const bNorm = rgb.b / 255;
          
          // Blend-Mode anwenden
          switch (blendMode) {
            case 'multiply':
              r = grayNorm * rNorm;
              g = grayNorm * gNorm;
              b = grayNorm * bNorm;
              break;
              
            case 'overlay':
              r = grayNorm < 0.5 ? 2 * grayNorm * rNorm : 1 - 2 * (1 - grayNorm) * (1 - rNorm);
              g = grayNorm < 0.5 ? 2 * grayNorm * gNorm : 1 - 2 * (1 - grayNorm) * (1 - gNorm);
              b = grayNorm < 0.5 ? 2 * grayNorm * bNorm : 1 - 2 * (1 - grayNorm) * (1 - bNorm);
              break;
              
            case 'soft-light':
              r = rNorm < 0.5 ? grayNorm - (1 - 2 * rNorm) * grayNorm * (1 - grayNorm) : grayNorm + (2 * rNorm - 1) * (Math.sqrt(grayNorm) - grayNorm);
              g = gNorm < 0.5 ? grayNorm - (1 - 2 * gNorm) * grayNorm * (1 - grayNorm) : grayNorm + (2 * gNorm - 1) * (Math.sqrt(grayNorm) - grayNorm);
              b = bNorm < 0.5 ? grayNorm - (1 - 2 * bNorm) * grayNorm * (1 - grayNorm) : grayNorm + (2 * bNorm - 1) * (Math.sqrt(grayNorm) - grayNorm);
              break;
              
            case 'hard-light':
              r = rNorm < 0.5 ? 2 * grayNorm * rNorm : 1 - 2 * (1 - grayNorm) * (1 - rNorm);
              g = gNorm < 0.5 ? 2 * grayNorm * gNorm : 1 - 2 * (1 - grayNorm) * (1 - gNorm);
              b = bNorm < 0.5 ? 2 * grayNorm * bNorm : 1 - 2 * (1 - grayNorm) * (1 - bNorm);
              break;
              
            case 'color-burn':
              r = rNorm === 0 ? 0 : 1 - (1 - grayNorm) / rNorm;
              g = gNorm === 0 ? 0 : 1 - (1 - grayNorm) / gNorm;
              b = bNorm === 0 ? 0 : 1 - (1 - grayNorm) / bNorm;
              r = Math.max(0, r);
              g = Math.max(0, g);
              b = Math.max(0, b);
              break;
              
            case 'color-dodge':
              r = rNorm === 1 ? 1 : grayNorm / (1 - rNorm);
              g = gNorm === 1 ? 1 : grayNorm / (1 - gNorm);
              b = bNorm === 1 ? 1 : grayNorm / (1 - bNorm);
              r = Math.min(1, r);
              g = Math.min(1, g);
              b = Math.min(1, b);
              break;
              
            case 'darken':
              r = Math.min(grayNorm, rNorm);
              g = Math.min(grayNorm, gNorm);
              b = Math.min(grayNorm, bNorm);
              break;
              
            case 'lighten':
              r = Math.max(grayNorm, rNorm);
              g = Math.max(grayNorm, gNorm);
              b = Math.max(grayNorm, bNorm);
              break;
              
            case 'normal':
            default:
              r = rNorm;
              g = gNorm;
              b = bNorm;
              break;
          }
          
          // Kontrast anwenden
          r = (r - 0.5) * contrast + 0.5;
          g = (g - 0.5) * contrast + 0.5;
          b = (b - 0.5) * contrast + 0.5;
          
          // Clamp Werte zwischen 0 und 1
          r = Math.max(0, Math.min(1, r));
          g = Math.max(0, Math.min(1, g));
          b = Math.max(0, Math.min(1, b));
          
          // Zurück zu 255-Skala und Opacity anwenden
          const finalR = grayNorm * (1 - opacity) + r * opacity;
          const finalG = grayNorm * (1 - opacity) + g * opacity;
          const finalB = grayNorm * (1 - opacity) + b * opacity;
          
          data[i] = Math.round(finalR * 255);
          data[i + 1] = Math.round(finalG * 255);
          data[i + 2] = Math.round(finalB * 255);
        }
      }
        tempCtx.putImageData(imageData, 0, 0);
        // -------------------------------------------------------------------

        // 2. Jetzt die Ebenen auf dem Haupt-Canvas zusammensetzen
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Alten Inhalt löschen
        ctx.drawImage(flasche, 0, 0); // Flasche als unterste Ebene
        
        // Weininhalt nur zeichnen, wenn es nicht die dunkle Flaschenvariante ist
        if (!isDarkWineBottle) {
            ctx.globalCompositeOperation = weinSettings.blendMode;

            console.log('🍷 Inhalt-Debug (Option B - Display-basiert):', {
                'Flasche': flasche.src.split('/').pop(),
                'Display-Werte': { displayXPos, displayYPos, displayWidth },
                'Canvas-Werte': { xPos, yPos, drawWidth, drawHeight },
                'Rohdaten aus bottleData': inhalt.position,
                'Parsed Werte': {
                    leftValue: inhalt.position?.left,
                    leftType: typeof inhalt.position?.left,
                    parsedLeft: displayXPos,
                    widthValue: inhalt.position?.width,
                    widthType: typeof inhalt.position?.width,
                    parsedWidth: displayWidth,
                    heightValue: inhalt.position?.height,
                    heightType: typeof inhalt.position?.height
                },
                scaleFactor: scaleFactor.toFixed(2),
                originalHeight: inhalt.position?.height,
                canvasSize: `${canvas.width}x${canvas.height}`,
                displaySize: '220x700',
                tempCanvasSize: `${tempCanvas.width}x${tempCanvas.height}`,
                finalDrawSize: `${drawWidth}x${drawHeight}`
            });

            // Zeichne das eingefärbte temporäre Canvas direkt - bereits in korrekter Größe
            ctx.drawImage(tempCanvas, xPos, yPos);

            ctx.globalCompositeOperation = 'source-over';
        }
    }

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '220px', height: '700px' }}
            className="absolute z-10" // Liegt unter dem Etikett
        />
    );
}