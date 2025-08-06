"use client";

export default function EntwuerfePanel({ entwuerfe = [], onEntwurfLaden, onEntwurfLoeschen, onEntwurfSpeichern, activeFlasche }) {
    return (
        <div className="space-y-4 p-2">
            <div>
                <p className="text-sm text-gray-600 mb-3">Speichern Sie Ihre Konfiguration oder laden Sie einen vorhandenen Entwurf.</p>
                
                {/* Entwurf speichern Button */}
                <button
                    onClick={onEntwurfSpeichern}
                    disabled={!activeFlasche}
                    className={`
                        group w-full flex items-center border rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                        hover:-translate-y-0.5 p-3 mb-3 shadow-sm hover:shadow-md
                        ${!activeFlasche
                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-indigo-200'
                        }
                    `}
                >
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center mr-3 bg-gray-50 rounded-md transition-colors ${
                        !activeFlasche ? 'text-gray-400' : 'text-indigo-600'
                    }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    </div>
                    <div className="text-left flex-grow">
                        <h4 className={`font-medium text-sm leading-tight transition-colors ${
                            !activeFlasche ? 'text-gray-500' : 'text-indigo-800'
                        }`}>
                            Aktuellen Entwurf speichern
                        </h4>
                        <p className={`text-xs mt-1 transition-colors ${
                            !activeFlasche ? 'text-gray-400' : 'text-indigo-600'
                        }`}>
                            Sichern Sie Ihre aktuelle Konfiguration
                        </p>
                    </div>
                </button>
            </div>
            
            {entwuerfe.length === 0 ? (
                <p className="text-gray-500 text-sm">Sie haben noch keine Entwürfe gespeichert.</p>
            ) : (
                <div className="space-y-2">
                    {entwuerfe.map(entwurf => (
                        <div 
                            key={entwurf.id} 
                            className="group flex items-center p-2 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => onEntwurfLaden(entwurf)}
                        >
                            {entwurf.thumbnail && (
                                <img 
                                    src={entwurf.thumbnail} 
                                    alt={`Thumbnail für ${entwurf.name}`}
                                    className="w-auto max-w-16 h-auto max-h-20 object-contain rounded-md mr-3 border border-gray-200"
                                />
                            )}
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{entwurf.name}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(entwurf.id).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEntwurfLoeschen(entwurf.id);
                                    }}
                                    className="p-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                                    title="Diesen Entwurf löschen">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}