// components/WeinfarbenPanel.jsx
"use client";

import { useState } from 'react';
import { isWeinfarbeAllowed } from '../lib/bottleData';
import { useDebounce } from '../hooks/useDebounce';

// Weinfarben-spezifische OptionCard
function WeinfarbeCard({ farbe, onClick, isSelected, isAllowed, customColor, onCustomColorChange }) {
    const cardClasses = `
        group flex items-center border rounded-lg cursor-pointer transition-all duration-200 ease-in-out
        hover:-translate-y-0.5 p-1 mb-2 shadow-sm hover:shadow-md
        ${!isAllowed ? 'opacity-25 cursor-not-allowed pointer-events-none' : ''}
        ${isSelected 
            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-md ring-1 ring-blue-400' 
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
    `;

    const displayColor = farbe.id === 'custom' ? customColor : farbe.hex;

    return (
        <div className={cardClasses} onClick={() => isAllowed && onClick(farbe.id)}>
            {/* Farbkreis als "Bild" */}
            <div className="w-10 h-14 flex-shrink-0 flex items-center justify-center mr-3 bg-gray-50 rounded-md overflow-hidden">
                {farbe.id === 'custom' ? (
                    <div className="relative">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => {
                                e.stopPropagation();
                                onCustomColorChange(e.target.value);
                            }}
                            onFocus={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                        />
                    </div>
                ) : (
                    <div 
                        className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 group-hover:scale-105 ${farbe.colorClass}`}
                        style={{ backgroundColor: farbe.hex }}
                    />
                )}
            </div>
            
            {/* Name und Info */}
            <div className="flex-grow min-w-0">
                <p className={`font-medium text-sm leading-tight transition-colors duration-200 truncate ${
                    isSelected ? 'text-blue-800' : 'text-gray-800 group-hover:text-gray-900'
                }`}>
                    {farbe.name}
                </p>
                <p className={`text-xs mt-1 transition-colors duration-200 truncate ${
                    isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                }`}>
                    {displayColor}
                </p>
            </div>
            
            {/* Ausgewählt-Häkchen */}
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

// Erweiterte Einstellungen Komponente
function AdvancedSettings({ settings, onSettingsChange, isVisible }) {
    if (!isVisible) return null;

    const blendModes = [
        { value: 'multiply', label: 'Multiply (Standard)' },
        { value: 'overlay', label: 'Overlay' },
        { value: 'soft-light', label: 'Soft Light' },
        { value: 'hard-light', label: 'Hard Light' },
        { value: 'color-burn', label: 'Color Burn' },
        { value: 'color-dodge', label: 'Color Dodge' },
        { value: 'darken', label: 'Darken' },
        { value: 'lighten', label: 'Lighten' },
        { value: 'normal', label: 'Normal' }
    ];

    // Fallback falls onSettingsChange undefined ist
    const handleSettingsChange = onSettingsChange || (() => {});

    const handleOpacityChange = (newValue) => {
        const newSettings = { ...settings, opacity: newValue };
        // console.log('Deckung geändert:', newSettings);
        handleSettingsChange(newSettings);
    };

    const handleContrastChange = (newValue) => {
        const newSettings = { ...settings, contrast: newValue };
        // console.log('Kontrast geändert:', newSettings);
        handleSettingsChange(newSettings);
    };

    const handleBlendModeChange = (newValue) => {
        const newSettings = { ...settings, blendMode: newValue };
        // console.log('Blend Mode geändert:', newSettings);
        handleSettingsChange(newSettings);
    };

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-sm text-gray-800 mb-3">Erweiterte Einstellungen</h4>
            
            {/* Deckung */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                    Deckung: {Math.round(settings.opacity * 100)}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.opacity || 0.8}
                    onChange={(e) => {
                        e.stopPropagation();
                        handleOpacityChange(parseFloat(e.target.value));
                    }}
                    onInput={(e) => {
                        e.stopPropagation();
                        handleOpacityChange(parseFloat(e.target.value));
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
            </div>

            {/* Kontrast */}
            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                    Kontrast: {Math.round(settings.contrast * 100)}%
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={settings.contrast || 1.0}
                    onChange={(e) => {
                        e.stopPropagation();
                        handleContrastChange(parseFloat(e.target.value));
                    }}
                    onInput={(e) => {
                        e.stopPropagation();
                        handleContrastChange(parseFloat(e.target.value));
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
            </div>

            {/* Blend Mode */}
            <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                    Blend Modus
                </label>
                <select
                    value={settings.blendMode}
                    onChange={(e) => handleBlendModeChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {blendModes.map(mode => (
                        <option key={mode.value} value={mode.value}>
                            {mode.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default function WeinfarbenPanel({ 
    weinfarben, 
    allowedWines, 
    activeWeinfarbe, 
    onSelect,
    customColor = '#FFF29E',
    onCustomColorChange = () => {},
    weinSettings = { opacity: 1.0, contrast: 1.5, blendMode: 'multiply' },
    onWeinSettingsChange = () => {}
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Erweiterte Weinfarben-Liste mit Custom-Option
    const extendedWeinfarben = [
        ...weinfarben,
        { 
            id: 'custom', 
            name: 'Individuelle Farbe', 
            colorClass: '', 
            hex: customColor 
        }
    ];

    return (
        <div className="space-y-2 p-2">
            <p className="text-sm text-gray-600 mb-3">Wählen Sie die Farbe Ihres Weins oder definieren Sie eine individuelle Farbe.</p>
            
            {/* Farbauswahl */}
            {extendedWeinfarben.map(farbe => {
                const isAllowed = isWeinfarbeAllowed(farbe.id, allowedWines);
                const isActive = activeWeinfarbe === farbe.id;

                return (
                    <WeinfarbeCard
                        key={farbe.id}
                        farbe={farbe}
                        onClick={onSelect}
                        isSelected={isActive}
                        isAllowed={isAllowed}
                        customColor={customColor}
                        onCustomColorChange={onCustomColorChange}
                    />
                );
            })}

            {/* Erweiterte Einstellungen Toggle */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
                <svg className={`w-4 h-4 mr-2 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Erweiterte Einstellungen
            </button>

            {/* Erweiterte Einstellungen Panel */}
            <AdvancedSettings
                settings={weinSettings}
                onSettingsChange={onWeinSettingsChange}
                isVisible={showAdvanced}
            />
        </div>
    );
}