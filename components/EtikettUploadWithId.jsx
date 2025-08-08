import React, { useState } from 'react';

const EtikettUploadWithId = ({ onUploadComplete, className = "" }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        
        try {
            const formData = new FormData();
            formData.append('etikett', file);

            const response = await fetch('/api/etikett/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload fehlgeschlagen');
            }

            const data = await response.json();
            console.log("✅ Upload erfolgreich:", data);

            // Callback mit Upload-Daten aufrufen
            if (onUploadComplete) {
                onUploadComplete({
                    id: data.etikettId,
                    url: data.url,
                    filename: data.filename
                });
            }

        } catch (error) {
            console.error("❌ Upload-Fehler:", error);
            alert("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
        } finally {
            setIsUploading(false);
            // Input zurücksetzen für erneute Uploads
            event.target.value = '';
        }
    };

    return (
        <div className={`upload-with-id ${className}`}>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                style={{ display: 'none' }}
                id="etikett-upload-with-id"
            />
            <label 
                htmlFor="etikett-upload-with-id"
                className={`upload-button ${isUploading ? 'uploading' : ''}`}
                style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: isUploading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}
            >
                {isUploading ? '📤 Lade hoch...' : '📤 Etikett hochladen (mit ID)'}
            </label>
            
            {isUploading && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    Upload läuft... Bitte warten.
                </div>
            )}
        </div>
    );
};

export default EtikettUploadWithId;
