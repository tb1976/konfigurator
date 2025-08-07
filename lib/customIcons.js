// Beispiele für eigene SVG-Icons

export const CustomMenuIcons = {
    // Flasche - Eigenes Design
    flaschen: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 2v2H6a1 1 0 000 2h1v1.5c0 1.5-1 2.5-1 4.5v8a2 2 0 002 2h8a2 2 0 002-2v-8c0-2-1-3-1-4.5V6h1a1 1 0 000-2h-2V2a1 1 0 00-2 0v2h-4V2a1 1 0 00-2 0z"/>
        </svg>
    ),
    
    // Korken - Weinkorken Design
    korken: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="9" y="4" width="6" height="16" rx="3" ry="3"/>
            <circle cx="12" cy="8" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="16" r="1"/>
        </svg>
    ),
    
    // Kapsel - Weinkapsel Design  
    kapseln: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <ellipse cx="12" cy="8" rx="4" ry="2"/>
            <path d="M8 8v4c0 2.2 1.8 4 4 4s4-1.8 4-4V8"/>
            <line x1="10" y1="10" x2="10" y2="14"/>
            <line x1="14" y1="10" x2="14" y2="14"/>
        </svg>
    ),
    
    // Wein - Weinglas Design
    weinfarbe: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 2v6.5C8 11.43 10.57 14 13.5 14H14v5h-2v2h6v-2h-2v-5h0.5C19.43 14 22 11.43 22 8.5V2H8zm2 2h10v4.5C20 9.88 18.88 11 17.5 11H13.5C12.12 11 11 9.88 11 8.5V4z"/>
        </svg>
    ),
    
    // Etikett - Label Design
    etikett: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="6" width="16" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="7" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1"/>
            <line x1="7" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1"/>
            <line x1="7" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1"/>
        </svg>
    )
};
