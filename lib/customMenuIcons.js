// Optimiertes Icon-System für Ihre eigenen PNG-Icons
import React from 'react';

// Icon Component mit Error Handling und Loading
function CustomIconImage({ src, alt, className = "w-4 h-4 menu-icon", fallback = null }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
        console.warn(`Icon konnte nicht geladen werden: ${src}`);
    };

    if (error && fallback) {
        return fallback;
    }

    return (
        <div className="icon-container">
            {loading && <div className="icon-loading w-4 h-4"></div>}
            <img 
                src={src} 
                alt={alt} 
                className={`${className} ${loading ? 'hidden' : ''}`}
                onLoad={handleLoad}
                onError={handleError}
                style={{ 
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges' // Für scharfe PNG-Icons
                }}
            />
        </div>
    );
}

// Ihre benutzerdefinierten Icons
export const CustomMenuIcons = {
    flaschen: (
        <CustomIconImage 
            src="/icons/bottle.png" 
            alt="Flasche"
            fallback={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 2v2H6a1 1 0 000 2h1v1.5c0 1.5-1 2.5-1 4.5v8a2 2 0 002 2h8a2 2 0 002-2v-8c0-2-1-3-1-4.5V6h1a1 1 0 000-2h-2V2a1 1 0 00-2 0v2h-4V2a1 1 0 00-2 0z"/>
                </svg>
            }
        />
    ),
    korken: (
        <CustomIconImage 
            src="/icons/cork.png" 
            alt="Korken"
            fallback={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="4" width="6" height="16" rx="3" ry="3"/>
                </svg>
            }
        />
    ),
    kapseln: (
        <CustomIconImage 
            src="/icons/capsule.png" 
            alt="Kapsel"
            fallback={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <ellipse cx="12" cy="8" rx="4" ry="2"/>
                </svg>
            }
        />
    ),
    etikett: (
        <CustomIconImage 
            src="/icons/label.png" 
            alt="Etikett"
            fallback={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="6" width="16" height="12" rx="2" ry="2"/>
                </svg>
            }
        />
    ),
    
    // Für Icons ohne PNG-Versionen verwenden wir SVG
    weinfarbe: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 2v6.5C8 11.43 10.57 14 13.5 14H14v5h-2v2h6v-2h-2v-5h0.5C19.43 14 22 11.43 22 8.5V2H8zm2 2h10v4.5C20 9.88 18.88 11 17.5 11H13.5C12.12 11 11 9.88 11 8.5V4z"/>
        </svg>
    ),
    entwuerfe: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
            <path d="M14 2v6h6" fill="none" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    export: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
            <path d="M12 18l-4-4h3V9h2v5h3l-4 4z" fill="white"/>
        </svg>
    ),
    hilfe: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" fill="none" stroke="white" strokeWidth="2"/>
            <circle cx="12" cy="17" r="1" fill="white"/>
        </svg>
    )
};

export default CustomIconImage;
