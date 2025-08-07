// Icon Management System für eigene Icons
// Verwenden Sie diese Datei, um Ihre eigenen Icons zu verwalten

import React from 'react';

// 1. SVG Icon Component für einfache Anpassung
export function CustomIcon({ children, className = "w-4 h-4", ...props }) {
    return (
        <svg 
            className={className} 
            fill="currentColor" 
            viewBox="0 0 24 24" 
            {...props}
        >
            {children}
        </svg>
    );
}

// 2. Icon Wrapper für verschiedene Typen
export function Icon({ type, src, alt, className = "w-4 h-4", children }) {
    if (type === 'svg' && children) {
        return <CustomIcon className={className}>{children}</CustomIcon>;
    }
    
    if (type === 'image' && src) {
        return (
            <img 
                src={src} 
                alt={alt || 'Icon'} 
                className={className}
                style={{ objectFit: 'contain' }}
            />
        );
    }
    
    return null;
}

// 3. Ihre eigenen Icons hier definieren
export const MyCustomIcons = {
    // SVG Icons
    flaschen: (
        <CustomIcon>
            <path d="M8 2v2H6a1 1 0 000 2h1v1.5c0 1.5-1 2.5-1 4.5v8a2 2 0 002 2h8a2 2 0 002-2v-8c0-2-1-3-1-4.5V6h1a1 1 0 000-2h-2V2a1 1 0 00-2 0v2h-4V2a1 1 0 00-2 0z"/>
        </CustomIcon>
    ),
    
    // Bild Icons (legen Sie Dateien in /public/icons/ ab)
    korken: <Icon type="image" src="/icons/cork-custom.png" alt="Korken" />,
    kapseln: <Icon type="image" src="/icons/capsule-custom.png" alt="Kapsel" />,
    
    // Font Icons (falls Sie Font Awesome oder ähnliches verwenden)
    export: <i className="fas fa-download w-4 h-4"></i>,
};

// 4. Icon Konfigurations-System
export const IconConfig = {
    // Hier können Sie zwischen verschiedenen Icon-Sets wähseln
    currentSet: 'default', // 'default', 'custom', 'minimal'
    
    sets: {
        default: {
            flaschen: MyCustomIcons.flaschen,
            korken: MyCustomIcons.korken,
            // ... andere Icons
        },
        
        minimal: {
            flaschen: <CustomIcon><circle cx="12" cy="12" r="3"/></CustomIcon>,
            korken: <CustomIcon><rect x="10" y="6" width="4" height="12" rx="2"/></CustomIcon>,
            // ... minimale Icons
        }
    }
};

// 5. Helper Funktion um Icons zu laden
export function getIcon(iconName, iconSet = IconConfig.currentSet) {
    return IconConfig.sets[iconSet]?.[iconName] || null;
}
