// lib/urlParams.js
// Utility-Funktionen für URL-Parameter-Management im Flaschen-Konfigurator

/**
 * Generiert eine URL mit allen aktuellen Konfigurations-Parametern
 * @param {Object} config - Die aktuelle Konfiguration
 * @param {string} baseUrl - Die Basis-URL (optional)
 * @returns {string} - Die vollständige URL mit Parametern
 */
export function generateConfigurationUrl(config, baseUrl = '') {
    if (typeof window !== 'undefined' && !baseUrl) {
        baseUrl = window.location.origin + window.location.pathname;
    }
    
    const params = new URLSearchParams();
    
    // Basis-Parameter
    if (config.customerId) params.set('customerId', config.customerId);
    if (config.flasche) params.set('flasche', config.flasche);
    if (config.korken) params.set('korken', config.korken);
    if (config.kapsel) params.set('kapsel', config.kapsel);
    if (config.weinfarbe) params.set('weinfarbe', config.weinfarbe);
    if (config.customColor && config.customColor !== '#FF6B6B') {
        params.set('customColor', config.customColor);
    }
    
    // Wein-Einstellungen (nur wenn sie von Standard abweichen)
    const defaultWeinSettings = { opacity: 1.0, contrast: 1.5, blendMode: 'multiply' };
    if (config.weinSettings && JSON.stringify(config.weinSettings) !== JSON.stringify(defaultWeinSettings)) {
        params.set('weinSettings', encodeURIComponent(JSON.stringify(config.weinSettings)));
    }
    
    // Etikett-Parameter
    if (config.etikett?.src) {
        params.set('etikettSrc', encodeURIComponent(config.etikett.src));
        if (config.etikett.top !== 0) params.set('etikettTop', config.etikett.top);
        if (config.etikett.left !== 0) params.set('etikettLeft', config.etikett.left);
        if (config.etikett.scaleX !== 1) params.set('etikettScaleX', config.etikett.scaleX);
        if (config.etikett.scaleY !== 1) params.set('etikettScaleY', config.etikett.scaleY);
        if (config.etikett.rotation !== 0) params.set('etikettRotation', config.etikett.rotation);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Parst URL-Parameter zu einer Konfigurations-Objekt
 * @param {string|URLSearchParams} searchParams - Die URL-Parameter
 * @returns {Object} - Das Konfigurations-Objekt
 */
export function parseConfigurationFromUrl(searchParams) {
    let params;
    if (typeof searchParams === 'string') {
        params = new URLSearchParams(searchParams);
    } else if (searchParams instanceof URLSearchParams) {
        params = searchParams;
    } else if (typeof window !== 'undefined') {
        params = new URLSearchParams(window.location.search);
    } else {
        return {};
    }
    
    const config = {};
    
    // Basis-Parameter
    if (params.has('customerId')) config.customerId = params.get('customerId');
    if (params.has('flasche')) config.flasche = params.get('flasche');
    if (params.has('korken')) config.korken = params.get('korken');
    if (params.has('kapsel')) config.kapsel = params.get('kapsel');
    if (params.has('weinfarbe')) config.weinfarbe = params.get('weinfarbe');
    if (params.has('customColor')) config.customColor = params.get('customColor');
    
    // Wein-Einstellungen
    if (params.has('weinSettings')) {
        try {
            config.weinSettings = JSON.parse(decodeURIComponent(params.get('weinSettings')));
        } catch (error) {
            console.error('Fehler beim Parsen der weinSettings:', error);
        }
    }
    
    // Etikett-Parameter
    if (params.has('etikettSrc')) {
        config.etikett = {
            src: decodeURIComponent(params.get('etikettSrc')),
            top: parseFloat(params.get('etikettTop')) || 0,
            left: parseFloat(params.get('etikettLeft')) || 0,
            scaleX: parseFloat(params.get('etikettScaleX')) || 1,
            scaleY: parseFloat(params.get('etikettScaleY')) || 1,
            rotation: parseFloat(params.get('etikettRotation')) || 0,
        };
    }
    
    return config;
}

/**
 * Erstellt eine Kurz-URL für das Teilen (kann später durch einen URL-Shortener erweitert werden)
 * @param {Object} config - Die Konfiguration
 * @returns {string} - Die Share-URL
 */
export function generateShareUrl(config) {
    const fullUrl = generateConfigurationUrl(config);
    
    // Hier könnte später ein URL-Shortener integriert werden
    // Für jetzt geben wir die vollständige URL zurück
    return fullUrl;
}

/**
 * Validiert eine Konfiguration aus URL-Parametern
 * @param {Object} config - Die zu validierende Konfiguration
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateConfiguration(config) {
    const errors = [];
    
    // Validiere Flasche
    if (config.flasche && !['bd75optima', 'bd75prestige', 'bg75optima', 'paris75'].includes(config.flasche)) {
        errors.push(`Ungültige Flasche: ${config.flasche}`);
    }
    
    // Validiere Korken
    if (config.korken && !['natur', 'natur2', 'mikro', 'brand'].includes(config.korken)) {
        errors.push(`Ungültiger Korken: ${config.korken}`);
    }
    
    // Validiere Kapsel
    if (config.kapsel && !['keine', 'silber', 'gold', 'kupfer', 'schwMatt', 'blau', 'rot', 'weiss'].includes(config.kapsel)) {
        errors.push(`Ungültige Kapsel: ${config.kapsel}`);
    }
    
    // Validiere Weinfarbe
    if (config.weinfarbe && !['weiss', 'rose', 'rotHell', 'rotDunkel', 'custom'].includes(config.weinfarbe)) {
        errors.push(`Ungültige Weinfarbe: ${config.weinfarbe}`);
    }
    
    // Validiere Custom Color Format
    if (config.customColor && !/^#[0-9A-Fa-f]{6}$/.test(config.customColor)) {
        errors.push(`Ungültiges Farbformat: ${config.customColor}`);
    }
    
    // Validiere Etikett URL
    if (config.etikett?.src) {
        try {
            new URL(config.etikett.src);
        } catch {
            // Falls es keine gültige URL ist, prüfe ob es eine Data-URL ist
            if (!config.etikett.src.startsWith('data:image/')) {
                errors.push(`Ungültige Etikett-URL: ${config.etikett.src}`);
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Erstellt ein minimales Konfigurations-Objekt mit nur den gesetzten Werten
 * @param {Object} config - Die vollständige Konfiguration
 * @returns {Object} - Die bereinigte Konfiguration
 */
export function cleanConfiguration(config) {
    const cleaned = {};
    
    if (config.customerId) cleaned.customerId = config.customerId;
    if (config.flasche) cleaned.flasche = config.flasche;
    if (config.korken) cleaned.korken = config.korken;
    if (config.kapsel) cleaned.kapsel = config.kapsel;
    if (config.weinfarbe) cleaned.weinfarbe = config.weinfarbe;
    if (config.customColor && config.customColor !== '#FF6B6B') cleaned.customColor = config.customColor;
    if (config.weinSettings) cleaned.weinSettings = config.weinSettings;
    if (config.etikett) cleaned.etikett = config.etikett;
    
    return cleaned;
}
