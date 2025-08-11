"use client";

import { useState, useEffect } from 'react';
import EtikettUploader from './EtikettUploader';
import WeinfarbenPanel from './WeinfarbenPanel';
import ExportPanel from './ExportPanel';
import HilfePanel from './HilfePanel';
import EntwuerfePanel from './EntwuerfePanel';
import { BOTTLE_DATA } from '../lib/bottleData';
import { OptionCard, MenuIcons, IconNavigation } from '../lib/components'; 

function SequentialNavigation({ title, onBack, onNext, hasNext, hasPrevious, previousMenuLabel, nextMenuLabel }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            {/* Previous Button */}
            <button
                onClick={onBack}
                disabled={!hasPrevious}
                className={`flex items-center p-1.5 rounded-md transition-colors ${
                    hasPrevious 
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-white' 
                        : 'text-gray-300 cursor-not-allowed'
                }`}
                title={hasPrevious ? `Zurück zu ${previousMenuLabel}` : 'Zurück zur Übersicht'}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Current Menu Title */}
            <div className="text-center">
                <h3 className="font-semibold text-gray-800 text-sm">
                    {title}
                </h3>
            </div>

            {/* Next Button */}
            <button
                onClick={onNext}
                disabled={!hasNext}
                className={`flex items-center p-1.5 rounded-md transition-colors ${
                    hasNext 
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-white' 
                        : 'text-gray-300 cursor-not-allowed'
                }`}
                title={hasNext ? `Weiter zu ${nextMenuLabel}` : ''}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}

function StackPanelHeader({ title, menuId, onBack, onNext, onHome, hasNext, hasPrevious, nextMenuLabel, previousMenuLabel, menus, activeMenu, onMenuClick }) {
    return (
        <div className="sticky top-0 z-10 bg-white">
            <SequentialNavigation 
                title={title}
                onBack={onBack}
                onNext={onNext}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                previousMenuLabel={previousMenuLabel}
                nextMenuLabel={nextMenuLabel}
            />
        </div>
    );
}

function StackPanel({ title, menuId, onBack, onNext, onHome, hasNext, hasPrevious, nextMenuLabel, previousMenuLabel, menus, activeMenu, onMenuClick, children }) {
    return (
        <>
            <StackPanelHeader 
                title={title} 
                menuId={menuId} 
                onBack={onBack} 
                onNext={onNext}
                onHome={onHome}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                nextMenuLabel={nextMenuLabel}
                previousMenuLabel={previousMenuLabel}
                menus={menus}
                activeMenu={activeMenu}
                onMenuClick={onMenuClick}
            />
            <div className="flex-1 overflow-y-auto p-4">
                {children}
            </div>
        </>
    );
}

function SidebarButton({ menuId, label, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                group relative flex items-center w-full text-left transition-all duration-200 ease-in-out
                px-4 py-4 rounded-lg my-1 border border-transparent
                ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:border-gray-200'
                }
            `}
        >
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                {MenuIcons[menuId]}
            </div>
            <span className={`ml-4 font-medium text-base transition-all duration-200 ${
                isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
            }`}>
                {label}
            </span>
            <svg className={`ml-auto w-5 h-5 transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`} 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
}

export default function AuswahlPanel({ 
    flaschen, korken, kapseln, weinfarben,
    onFlascheSelect, onKorkenSelect, onKapselSelect, onWeinfarbeSelect,
    activeFlasche, activeKorken, activeKapsel, activeWeinfarbe,
    onEtikettUpload, isProcessingEtikett, processingProgress, processingMessage, isFabricReady,
    customColor, onCustomColorChange,
    weinSettings, onWeinSettingsChange,
    exportableCanvas, fabricRef,
    flaschenConfig, korkenDaten,
    kapselDaten, globalEtiketten,
    onEtikettSelect, onEtikettDelete,
    onThumbnailClick, entwuerfe, onEntwurfLaden, onEntwurfLoeschen, onEntwurfSpeichern,
    onMenuChange, urlFilename
}) {
    const [activeMenu, setActiveMenu] = useState(null);

    // Notify parent about menu changes for mobile layout handling
    useEffect(() => {
        if (onMenuChange) {
            onMenuChange(activeMenu);
        }
    }, [activeMenu, onMenuChange]);

    // Debug logging
    console.log('🔍 AuswahlPanel Debug:');
    console.log('Flaschen:', flaschen);
    console.log('Korken:', korken);
    console.log('Kapseln:', kapseln);
    console.log('🔄 Processing Props:', {
        isProcessingEtikett,
        processingProgress,
        processingMessage
    });

    const menus = [
        { id: 'flaschen', label: 'Flaschen' },
        { id: 'korken', label: 'Korken' },
        { id: 'kapseln', label: 'Kapseln' },
        { id: 'weinfarbe', label: 'Weinfarbe' },
        ...(activeFlasche ? [{ id: 'etikett', label: 'Etikett' }] : []),
        { id: 'entwuerfe', label: 'Entwürfe' },
        { id: 'export', label: 'Export' },
        { id: 'hilfe', label: 'Hilfe' }
    ];

    const handleMenuClick = (menuId) => setActiveMenu(menuId);
    const handleBack = () => setActiveMenu(null);

    const getMenuTitle = (menuId) => {
        switch (menuId) {
            case 'flaschen': return 'Flaschen';
            case 'korken': return 'Korken';
            case 'kapseln': return 'Kapseln';
            case 'weinfarbe': return 'Weinfarbe';
            case 'etikett': return 'Etikett';
            case 'entwuerfe': return 'Entwürfe';
            case 'export': return 'Export';
            case 'hilfe': return 'Hilfe';
            default: return '';
        }
    };

    // Navigation Logik
    const getCurrentMenuIndex = () => {
        return menus.findIndex(menu => menu.id === activeMenu);
    };

    const getNextMenuLabel = () => {
        const currentIndex = getCurrentMenuIndex();
        if (currentIndex >= 0 && currentIndex < menus.length - 1) {
            return menus[currentIndex + 1].label;
        }
        return '';
    };

    const getPreviousMenuLabel = () => {
        const currentIndex = getCurrentMenuIndex();
        if (currentIndex > 0) {
            return menus[currentIndex - 1].label;
        }
        return 'Übersicht';
    };

    const handleNavigateToNext = () => {
        const currentIndex = getCurrentMenuIndex();
        if (currentIndex >= 0 && currentIndex < menus.length - 1) {
            const nextMenu = menus[currentIndex + 1];
            setActiveMenu(nextMenu.id);
        }
    };

    const handleNavigateToPrevious = () => {
        const currentIndex = getCurrentMenuIndex();
        if (currentIndex > 0) {
            const prevMenu = menus[currentIndex - 1];
            setActiveMenu(prevMenu.id);
        } else {
            // Wenn wir beim ersten Menü sind, gehe zurück zur Hauptansicht
            setActiveMenu(null);
        }
    };

    const handleNavigateHome = () => {
        setActiveMenu(null);
    };

    const hasNext = () => {
        const currentIndex = getCurrentMenuIndex();
        return currentIndex >= 0 && currentIndex < menus.length - 1;
    };

    const hasPrevious = () => {
        const currentIndex = getCurrentMenuIndex();
        return currentIndex >= 0; // Immer true wenn ein Menü aktiv ist (zurück zur Hauptansicht möglich)
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Icon Navigation - immer sichtbar */}
            <div className="sticky top-0 z-10 bg-white">
                <IconNavigation 
                    menus={menus}
                    activeMenu={activeMenu}
                    onMenuClick={handleMenuClick}
                    onHome={handleNavigateHome}
                />
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto">
                {!activeMenu ? (
                    <div className="h-full flex flex-col">
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                            {menus.map(menu => (
                                <SidebarButton
                                    key={menu.id}
                                    menuId={menu.id}
                                    label={menu.label}
                                    isActive={false}
                                    onClick={() => handleMenuClick(menu.id)}
                                />
                            ))}
                        </nav>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {activeMenu === 'flaschen' && (
                            <StackPanel 
                                title={getMenuTitle('flaschen')} 
                                menuId="flaschen" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <div className="p-2">
                                    <p className="text-sm text-gray-600 mb-3">Wählen Sie die Grundform für Ihre Weinflasche aus.</p>
                                    <div className="space-y-2">
                                        {flaschen.map(flasche => 
                                            <OptionCard 
                                                key={flasche.id} 
                                                item={flasche} 
                                                onClick={onFlascheSelect} 
                                                isSelected={flasche.id === activeFlasche} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </StackPanel>
                        )}
                        {activeMenu === 'korken' && (
                            <StackPanel 
                                title={getMenuTitle('korken')} 
                                menuId="korken" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <div className="p-2">
                                    <p className="text-sm text-gray-600 mb-3">Wählen Sie einen passenden Korken für Ihre Flasche.</p>
                                    <div className="space-y-2">
                                        {korkenDaten.map(k => 
                                            <OptionCard 
                                                key={k.id} 
                                                item={k} 
                                                onClick={onKorkenSelect} 
                                                isSelected={k.id === activeKorken} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </StackPanel>
                        )}
                        {activeMenu === 'kapseln' && (
                            <StackPanel 
                                title={getMenuTitle('kapseln')} 
                                menuId="kapseln" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <div className="p-2">
                                    <p className="text-sm text-gray-600 mb-3">Wählen Sie eine Flaschenhalskapsel in der gewünschten Farbe.</p>
                                    <div className="space-y-2">
                                        {kapselDaten.map(kapsel => 
                                            <OptionCard 
                                                key={kapsel.id} 
                                                item={kapsel} 
                                                onClick={onKapselSelect} 
                                                isSelected={kapsel.id === activeKapsel} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </StackPanel>
                        )}

                        {activeMenu === 'weinfarbe' && (
                            <StackPanel 
                                title={getMenuTitle('weinfarbe')} 
                                menuId="weinfarbe" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <WeinfarbenPanel 
                                    weinfarben={weinfarben}
                                    allowedWines={BOTTLE_DATA[activeFlasche || '']?.allowedWines || []}
                                    activeWeinfarbe={activeWeinfarbe}
                                    onSelect={onWeinfarbeSelect}
                                    customColor={customColor}
                                    onCustomColorChange={onCustomColorChange}
                                    weinSettings={weinSettings}
                                    onWeinSettingsChange={onWeinSettingsChange}
                                />
                            </StackPanel>
                        )}

                        {activeMenu === 'etikett' && (
                            <StackPanel 
                                title={getMenuTitle('etikett')} 
                                menuId="etikett" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <EtikettUploader 
                                    onUpload={onEtikettUpload} 
                                    isProcessing={isProcessingEtikett} 
                                    processingProgress={processingProgress}
                                    processingMessage={processingMessage}
                                    isReady={isFabricReady}
                                    fabricRef={fabricRef}
                                    globalEtiketten={globalEtiketten}
                                    onThumbnailClick={onThumbnailClick}
                                    onEtikettDelete={onEtikettDelete}
                                />
                            </StackPanel>
                        )}

                        {activeMenu === 'entwuerfe' && (
                            <StackPanel 
                                title={getMenuTitle('entwuerfe')} 
                                menuId="entwuerfe" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <EntwuerfePanel 
                                    entwuerfe={entwuerfe}
                                    onEntwurfLaden={onEntwurfLaden}
                                    onEntwurfLoeschen={onEntwurfLoeschen}
                                    onEntwurfSpeichern={onEntwurfSpeichern}
                                    activeFlasche={activeFlasche}
                                    onThumbnailClick={onThumbnailClick}
                                />
                            </StackPanel>
                        )}

                        {activeMenu === 'export' && (
                            <StackPanel 
                                title={getMenuTitle('export')} 
                                menuId="export" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <ExportPanel 
                                    activeFlasche={activeFlasche}
                                    exportableCanvas={exportableCanvas}
                                    fabricRef={fabricRef}
                                    flaschenConfig={flaschenConfig}
                                    urlFilename={urlFilename}
                                />
                            </StackPanel>
                        )}

                        {activeMenu === 'hilfe' && (
                            <StackPanel 
                                title={getMenuTitle('hilfe')} 
                                menuId="hilfe" 
                                onBack={handleNavigateToPrevious}
                                onNext={handleNavigateToNext}
                                onHome={handleNavigateHome}
                                hasNext={hasNext()}
                                hasPrevious={hasPrevious()}
                                nextMenuLabel={getNextMenuLabel()}
                                previousMenuLabel={getPreviousMenuLabel()}
                                menus={menus}
                                activeMenu={activeMenu}
                                onMenuClick={handleMenuClick}
                            >
                                <HilfePanel />
                            </StackPanel>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                <div className="text-xs text-gray-500 text-center">Flaschenkonfigurator v1.0.5</div>
            </div>
        </div>
    );
}