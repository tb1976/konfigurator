// /lib/bottleData.js

export const BOTTLE_DATA = {
    'flasche1': {
        name: 'Burgunder Transparent',
        info: 'Unsere klassische Burgunderflasche',
        src: '/images/bg75optimaTrn.png',
        korkenPosition: { top: 12, left: 79 },
        kapselPosition: { top: 9, left: 76, width: 68 },
        inhalt: {
            src: '/images/bg75optimaInhalt.png',
            position: { top: 0, left: 0, width: 220, height: 100 }
        },
        etikettCanvas: { width: 177, height: 250, top: 390, left: 22 },
        etikettKrümmung: { topCurve: -5, bottomCurve: 10 }, // Verstärkt von 8 auf 11
        shadowWidthAdjustment: 1.0,
        shadowSrc: '/images/shadow2.png',
        blendMode: 'hard-light',
        allowedWines: ['blanco', 'rosado']
    },
    'flasche2': {
        name: 'Burgunder Canela',
        info: 'Unsere klassische Burgunderflasche',
        src: '/images/bg75optimaCan.png',
        srcWithDarkWine: '/images/bg75optimaDark.png',
        darkWineThreshold: ['tinto'],
        korkenPosition: { top: 12, left: 79 },
        kapselPosition: { top: 9, left: 76, width: 68 },
        inhalt: {
            src: '/images/bg75optimaInhalt.png',
            position: { top: 5, left: 2, width: 215, height: 99 }
        },
        etikettCanvas: { width: 177, height: 250, top: 390, left: 22 },
        etikettKrümmung: { topCurve: -5, bottomCurve: 10 }, // Verstärkt von 8 auf 11
        shadowWidthAdjustment: 1.0,
        shadowSrc: '/images/shadow3.png',
        blendMode: 'soft-light',
        allowedWines: ['blanco', 'rosado', 'tinto']
    },
    'flasche3': {
        name: 'Bordeaux 1 Transparent',
        info: 'Unsere klassische Bordeauxflasche',
        src: '/images/bd75optimaTrn.png',
        korkenPosition: { top: 15, left: 79 },
        kapselPosition: { top: 14, left: 76, width: 67 },
        inhalt: {
            src: '/images/bd75optimaInhalt.png',
            position: { top: 5, left: 2, width: 215, height: 99 }
        },
        etikettCanvas: { width: 164, height: 330, top: 300, left: 28 },
        etikettKrümmung: { topCurve: -5, bottomCurve: 12 }, // Verstärkt von 10 auf 13
        shadowWidthAdjustment: 1.0,
        shadowSrc: '/images/shadow.png',
        blendMode: 'hard-light',
        allowedWines: ['blanco', 'rosado']
    },
    'flasche4': {
        name: 'Bordeaux 1 Canela',
        info: 'Unsere klassische Bordeauxflasche',
        src: '/images/bd75optimaCan.png',
        srcWithDarkWine: '/images/bd75optimaDark.png',
        darkWineThreshold: ['tinto'],
        korkenPosition: { top: 15, left: 79 },
        kapselPosition: { top: 14, left: 76, width: 67 },
        inhalt: {
            src: '/images/bd75optimaInhalt.png',
            position: { top: 5, left: 2, width: 215, height: 99 }
        },
        etikettCanvas: { width: 166, height: 330, top: 300, left: 27 },
        etikettKrümmung: { topCurve: -5, bottomCurve: 12 }, // Verstärkt von 10 auf 12
        shadowWidthAdjustment: 1.01,
        shadowSrc: '/images/shadow.png',
        blendMode: 'soft-light',
        allowedWines: ['blanco', 'rosado', 'tinto']
    },
    'flasche5': {
        name: 'Bordeaux 2 Transparent',
        info: 'Unsere elegante Bordeauxflasche, schmaler, mit längerem Hals',
        src: '/images/bd75prestigeTrn.png',
        korkenPosition: { top: 0, left: 80 },
        kapselPosition: { top: 0, left: 81, width: 60 },
        inhalt: {
            src: '/images/bd75prestigeInhalt.png',
            position: { top: 5, left: 10, width: 204, height: 99 }
        },
        etikettCanvas: { width: 148, height: 350, top: 280, left: 37 },
        etikettKrümmung: { topCurve: -5, bottomCurve: 12 }, // Verstärkt von 10 auf 12
        shadowWidthAdjustment: 1.0,
        shadowSrc: '/images/shadow.png',
        blendMode: 'hard-light',
        allowedWines: ['blanco', 'rosado']
    },
    'flasche6': {
        name: 'Bordeaux 2 Canela',
        info: 'Unsere elegante Bordeauxflasche, schmaler, mit längerem Hals',
        src: '/images/bd75prestigeCan.png',
        srcWithDarkWine: '/images/bd75prestigeDark.png',
        darkWineThreshold: ['tinto'],
        korkenPosition: { top: 0, left: 80 },
        kapselPosition: { top: 0, left: 81, width: 60 },
        inhalt: {
            src: '/images/bd75prestigeInhalt.png',
            position: { top: 5, left: 10, width: 201, height: 99 }
        },
        etikettCanvas: { width: 147, height: 350, top: 280, left: 37 },
        etikettKrümmung: { topCurve: -5, bottomCurve: 12 }, // Verstärkt von 10 auf 12
        shadowWidthAdjustment: 1.0,
        shadowSrc: '/images/shadow.png',
        blendMode: 'soft-light',
        allowedWines: ['blanco', 'rosado', 'tinto']
    },
    'flasche7': {
        name: 'Paris Transparent',
        info: 'Unsere extravagante Flasche, kleiner und bauchiger',
        src: '/images/paris75Trn.png',
        korkenPosition: { top: '117px', left: '79px' },
        kapselPosition: { top: '116px', left: '76px', width: '65px' },
        inhalt: {
            src: '/images/paris75Inhalt.png',
            position: { top: '5px', left: '0px', width: '220px', height: '97%' }
        },
        etikettCanvas: { width: 202, height: 190, top: '440px', left: '8px' },
        etikettKrümmung: { topCurve: -5, bottomCurve: 8 }, // Verstärkt von 5 auf 8
        shadowWidthAdjustment: 1.01,
        shadowSrc: '/images/shadow.png',
        blendMode: 'hard-light',
        allowedWines: ['blanco', 'rosado']
    }
};

export const getFlaschenAuswahl = () => {
    return Object.keys(BOTTLE_DATA).map(id => ({
        id: id,
        name: BOTTLE_DATA[id].name,
        info: BOTTLE_DATA[id].info,
        src: BOTTLE_DATA[id].src,
    }));
};

// ====================================================================================
//  DATEN FÜR KORKEN
// ====================================================================================
export const korkenDaten = [
    { id: 'korkMikro', name: 'Korken Mikrogranuliert', info: 'Homogene Optik, klassisch', src: '/images/korkMikro.png' },
    { id: 'korkNatur', name: 'Korken Natur', info: 'Wertige Optik, elastisch', src: '/images/korkNatur.png' },
    { id: 'korkNatur2', name: 'Korken Natur 2', info: 'Feinporig, lange Lagerdauer, optimale Nachreifung', src: '/images/korkNatur2.png' },
    { id: 'korkBrand', name: 'Korken mit eigenem Branding', info: 'Ihr ganz individueller Korken', src: '/images/korkBrand.png' },
];

// ====================================================================================
//  DATEN FÜR KAPSELN
// ====================================================================================
export const kapselDaten = [
    { id: 'noCapsule', name: 'Keine Kapsel', src: '/images/transPix.png' },
    { id: 'kapselSchwMatt', name: 'Schwarz Matt', src: '/images/kapselSchwMatt.png' },
    { id: 'kapselWeiss', name: 'Weiß', src: '/images/kapselWeiss.png' },
    { id: 'kapselSilber', name: 'Silber', src: '/images/kapselSilber.png' },
    { id: 'kapselGold', name: 'Gold', src: '/images/kapselGold.png' },
    { id: 'kapselKupfer', name: 'Kupfer', src: '/images/kapselKupfer.png' },
    { id: 'kapselRot', name: 'Rot', src: '/images/kapselRot.png' },
    { id: 'kapselBlau', name: 'Blau', src: '/images/kapselBlau.png' },
];

// ====================================================================================
// NEUE DATENSTRUKTUR FÜR DIE WEINFARBEN
// ====================================================================================
export const weinfarbenDaten = [
  { id: 'blanco', name: 'Blanco', colorClass: 'bg-yellow-100', hex: '#EEDEA5' },
  { id: 'rosado1', name: 'Rosado 1', colorClass: 'bg-pink-200', hex: '#FFBCBC' },
  { id: 'rosado2', name: 'Rosado 2', colorClass: 'bg-pink-300', hex: '#FF9E9E' },
  { id: 'rosado3', name: 'Rosado 3', colorClass: 'bg-orange-200', hex: '#FF8929' },
  { id: 'tinto',   name: 'Tinto',   colorClass: 'bg-red-900',   hex: '#460A14' },
];

// Hilfsfunktion: Prüft, ob eine Weinfarbe für eine Flasche erlaubt ist
export const isWeinfarbeAllowed = (weinfarbeId, allowedWines) => {
    if (!weinfarbeId || !allowedWines) {
        return false;
    }
    // Eine individuelle Farbe ist immer erlaubt.
    if (weinfarbeId === 'custom') {
        return true;
    }
    // Direkte Übereinstimmung (unverändert)
    if (allowedWines.includes(weinfarbeId)) {
        return true;
    }
    // Für Rosado-Varianten (unverändert)
    if (weinfarbeId.includes('rosado') && allowedWines.includes('rosado')) {
        return true;
    }
    return false;
};