// lib/components.js
import React from 'react';

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
    flaschen: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    korken: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    kapseln: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    ),
    weinfarbe: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3V1m10 20a4 4 0 004-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4zM17 3V1" />
        </svg>
    ),
    etikett: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
        </svg>
    ),
    entwuerfe: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    export: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    hilfe: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
};

export function IconNavigation({ menus, activeMenu, onMenuClick, onHome }) {
    return (
        <div className="flex items-center justify-center p-2 border-b border-gray-200 bg-white">
            {/* Home Button */}
            <button
                onClick={onHome}
                className="mr-2 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Zur Übersicht"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </button>

            {/* Icon Navigation */}
            <div className="flex items-center">
                {menus.map((menu) => (
                    <button
                        key={menu.id}
                        onClick={() => onMenuClick(menu.id)}
                        className={`relative p-1.5 mx-0.5 rounded-md transition-all duration-200 ${
                            activeMenu === menu.id
                                ? 'text-blue-600 transform scale-110'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        title={menu.label}
                    >
                        <div className="w-4 h-4">
                            {MenuIcons[menu.id]}
                        </div>
                        {/* Aktive Unterstrich-Linie */}
                        {activeMenu === menu.id && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
