// components/EtikettenHistorie.jsx
export default function EtikettenHistorie({ etiketten, onSelect, onDelete }) {
    if (etiketten.length === 0) {
        return null; // Nichts anzeigen, wenn keine Etiketten da sind
    }

    return (
        <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Ihre Etiketten</h3>
            <div className="grid grid-cols-3 gap-2">
                {etiketten.map((dataURL, index) => (
                    <div key={index} className="relative group">
                        <img
                            src={dataURL}
                            alt={`Etikett ${index + 1}`}
                            className="w-full h-auto object-cover rounded-md cursor-pointer border hover:border-blue-500"
                            onClick={() => onSelect(dataURL)}
                        />
                        <button
                        onClick={(e) => { 
                            e.stopPropagation();
                            onDelete(index);
                        }}
                            className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}