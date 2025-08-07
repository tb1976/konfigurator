// lib/components.js
import React from 'react';

// Icon Component für PNG-Dateien - vereinfacht für alle Icons
function IconImage({ src, alt, className = "w-8 h-8" }) {
    return (
        <div className="w-8 h-8 flex items-center justify-center">
            <img 
                src={src} 
                alt={alt} 
                className={className}
                style={{ 
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%'
                }}
                onError={(e) => {
                    console.log(`Icon nicht gefunden: ${src}`);
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );
}

export function OptionCard({ item, onClick, isSelected }) {
    const cardClasses = `
        group flex items-center border rounded-lg cursor-pointer transition-all duration-200 ease-in-out
        hover:-translate-y-0.5 p-1 mb-2 shadow-sm hover:shadow-md
        ${isSelected 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-md ring-1 ring-blue-400' 
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
    `;

    return (
        <div className={cardClasses} onClick={() => onClick(item.id)}>
            <div className="w-auto h-20 flex-shrink-0 flex items-center justify-center mr-3 bg-gray-50 rounded-md overflow-hidden">
                {item.src ? (
                    <img 
                        src={item.src} 
                        alt={item.name} 
                        className="w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                        style={{ height: '64px' }}
                        onError={(e) => {
                            console.error(`Fehler beim Laden des Bildes: ${item.src}`, e);
                            e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                            console.log(`Bild erfolgreich geladen: ${item.src}`);
                        }}
                    />
                ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">?</span>
                    </div>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <p className={`font-medium text-sm leading-tight transition-colors duration-200 truncate ${
                    isSelected ? 'text-blue-800' : 'text-gray-800 group-hover:text-gray-900'
                }`}>
                    {item.name}
                </p>
                {item.info && (
                    <p className={`text-xs mt-1 transition-colors duration-200 truncate ${
                        isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                        {item.info}
                    </p>
                )}
            </div>
            {isSelected && (
                <div className="flex-shrink-0 ml-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}

export const MenuIcons = {
    // Ihre eigenen PNG-Icons
    flaschen: <IconImage src="/icons/bottle.png" alt="Flasche" />,
    korken: <IconImage src="/icons/cork.png" alt="Korken" />,
    kapseln: <IconImage src="/icons/capsule.png" alt="Kapsel" />,
    etikett: <IconImage src="/icons/label.png" alt="Etikett" />,
    weinfarbe: <IconImage src="/icons/color.png" alt="Weinfarbe" />,
    entwuerfe: <IconImage src="/icons/draft.png" alt="Entwürfe" />,
    export: <IconImage src="/icons/export.png" alt="Export" />,
    hilfe: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
};

export function IconNavigation({ menus, activeMenu, onMenuClick, onHome }) {
    return (
        <div className="flex items-center justify-center p-3 border-b border-gray-200 bg-white">
            {/* Home Button - immer sichtbar */}
            <button
                onClick={onHome}
                className="mr-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Zur Übersicht"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            </button>

            {/* Icon Navigation - nur auf Desktop sichtbar */}
            <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
                {menus.map((menu) => (
                    <button
                        key={menu.id}
                        onClick={() => onMenuClick(menu.id)}
                        className={`relative p-1.5 rounded-md transition-all duration-200 flex-shrink-0 ${
                            activeMenu === menu.id
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        title={menu.label}
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            {MenuIcons[menu.id]}
                        </div>
                        {/* Aktive Unterstrich-Linie */}
                        {activeMenu === menu.id && (
                            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
