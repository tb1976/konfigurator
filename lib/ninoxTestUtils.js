// lib/ninoxTestUtils.js
// Test-Utilities für Ninox Integration

export const createTestRecord = () => ({
    Id: 'test-123',
    Flaschentyp: 'bd75optima',
    Korkentyp: 'natur',
    Kapseltyp: 'gold', 
    Weinfarbe: 'rot',
    EtikettPosition: 'center',
    EtikettBreite: 80,
    EtikettHoehe: 60,
    Notizen: 'Test-Konfiguration'
});

export const testNinoxConnection = async () => {
    const requiredEnvVars = [
        'NINOX_API_KEY',
        'NINOX_TEAM_ID', 
        'NINOX_DATABASE_ID'
    ];

    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Fehlende Environment Variables:', missing);
        return false;
    }

    try {
        // Test Ninox API Connection
        const response = await fetch(`https://api.ninox.com/v1/teams/${process.env.NINOX_TEAM_ID}/databases/${process.env.NINOX_DATABASE_ID}/tables`, {
            headers: {
                'Authorization': `Bearer ${process.env.NINOX_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ Ninox API Verbindung erfolgreich');
            return true;
        } else {
            console.error('❌ Ninox API Fehler:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ Verbindungsfehler:', error.message);
        return false;
    }
};

export const validateConfiguration = (config) => {
    const errors = [];
    
    // Required fields
    if (!config.bottle) errors.push('Flaschentyp fehlt');
    if (!config.cork) errors.push('Korkentyp fehlt');
    if (!config.cap) errors.push('Kapseltyp fehlt');
    if (!config.wine) errors.push('Weinfarbe fehlt');
    
    // Valid values
    const validBottles = ['bd75optima', 'bd75prestige', 'bg75optima', 'paris75'];
    const validCorks = ['natur', 'natur2', 'mikro', 'brand'];
    const validCaps = ['gold', 'silber', 'kupfer', 'blau', 'rot', 'schwarz', 'weiss', 'keine'];
    const validWines = ['weiss', 'rose', 'rot'];
    
    if (config.bottle && !validBottles.includes(config.bottle)) {
        errors.push(`Ungültiger Flaschentyp: ${config.bottle}`);
    }
    if (config.cork && !validCorks.includes(config.cork)) {
        errors.push(`Ungültiger Korkentyp: ${config.cork}`);
    }
    if (config.cap && !validCaps.includes(config.cap)) {
        errors.push(`Ungültiger Kapseltyp: ${config.cap}`);
    }
    if (config.wine && !validWines.includes(config.wine)) {
        errors.push(`Ungültige Weinfarbe: ${config.wine}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const generateTestUrl = (baseUrl = 'http://localhost:3000') => {
    const config = createTestRecord();
    return `${baseUrl}/konfigurator/ninox/${config.Id}`;
};

export const logConfigurationMapping = (ninoxRecord, configuration) => {
    console.log('🔄 Configuration Mapping:');
    console.table({
        'Flaschentyp → bottle': `${ninoxRecord.Flaschentyp} → ${configuration.bottle}`,
        'Korkentyp → cork': `${ninoxRecord.Korkentyp} → ${configuration.cork}`,
        'Kapseltyp → cap': `${ninoxRecord.Kapseltyp} → ${configuration.cap}`,
        'Weinfarbe → wine': `${ninoxRecord.Weinfarbe} → ${configuration.wine}`,
        'EtikettPosition → label': `${ninoxRecord.EtikettPosition} → ${configuration.label}`,
        'EtikettBreite → labelWidth': `${ninoxRecord.EtikettBreite} → ${configuration.labelWidth}`,
        'EtikettHoehe → labelHeight': `${ninoxRecord.EtikettHoehe} → ${configuration.labelHeight}`
    });
};

// Mock Ninox API für Development
export const createMockNinoxApi = () => {
    const records = new Map();
    
    // Add test record
    records.set('test-123', createTestRecord());
    
    return {
        async getRecord(recordId) {
            const record = records.get(recordId);
            if (!record) {
                throw new Error(`Record ${recordId} not found`);
            }
            return record;
        },
        
        async updateRecord(recordId, data) {
            if (!records.has(recordId)) {
                throw new Error(`Record ${recordId} not found`);
            }
            records.set(recordId, { ...records.get(recordId), ...data });
            return records.get(recordId);
        },
        
        listRecords() {
            return Array.from(records.values());
        }
    };
};
