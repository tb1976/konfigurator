# Flaschen-Konfigurator Integration Guide

## Übersicht

Der Flaschen-Konfigurator kann sowohl als standalone Anwendung als auch in einem Kundendashboard integriert werden. Er unterstützt URL-Parameter für das Teilen von Konfigurationen und Firebase-basierte Kundendaten.

## Integration Modi

### 1. Standalone Modus (Standard)

```jsx
import Konfigurator from '@/components/Konfigurator';

export default function KonfiguratorPage() {
    return <Konfigurator />;
}
```

### 2. Kundendashboard Integration

```jsx
import Konfigurator from '@/components/Konfigurator';

export default function CustomerDashboard({ user }) {
    const handleSaveDraft = async (draft) => {
        // Speichere Entwurf in Firebase/Datenbank
        const response = await fetch('/api/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...draft,
                userId: user.uid
            })
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Speichern');
        }
    };

    return (
        <Konfigurator
            customerId={user.uid}
            mode="dashboard"
            onSaveCallback={handleSaveDraft}
        />
    );
}
```

### 3. Vorkonfigurierte Konfiguration laden

```jsx
import Konfigurator from '@/components/Konfigurator';

export default function ConfiguredBottle() {
    const initialConfig = {
        flasche: 'bd75optima',
        korken: 'natur',
        kapsel: 'gold',
        weinfarbe: 'rotDunkel',
        customColor: '#8B0000',
        etikett: {
            src: 'https://example.com/label.png',
            top: 100,
            left: 50,
            scaleX: 0.8,
            scaleY: 0.8,
            rotation: 0
        }
    };

    return (
        <Konfigurator
            initialConfig={initialConfig}
            mode="dashboard"
        />
    );
}
```

## URL Parameter

### Unterstützte Parameter

| Parameter | Beschreibung | Beispiel |
|-----------|--------------|----------|
| `customerId` | Firebase User ID | `customerId=abc123` |
| `flasche` | Flaschentyp | `flasche=bd75optima` |
| `korken` | Korkentyp | `korken=natur` |
| `kapsel` | Kapseltyp | `kapsel=gold` |
| `weinfarbe` | Weinfarbe | `weinfarbe=rotDunkel` |
| `customColor` | Benutzerdefinierte Farbe | `customColor=%23FF6B6B` |
| `weinSettings` | Wein-Einstellungen (JSON) | `weinSettings=%7B%22opacity%22%3A0.8%7D` |
| `etikettSrc` | Etikett-URL | `etikettSrc=https%3A//example.com/label.png` |
| `etikettTop` | Etikett Y-Position | `etikettTop=100` |
| `etikettLeft` | Etikett X-Position | `etikettLeft=50` |
| `etikettScaleX` | Etikett X-Skalierung | `etikettScaleX=0.8` |
| `etikettScaleY` | Etikett Y-Skalierung | `etikettScaleY=0.8` |
| `etikettRotation` | Etikett Rotation (Grad) | `etikettRotation=15` |

### Beispiel URLs

**Vollständige Konfiguration:**
```
https://example.com/konfigurator?flasche=bd75optima&korken=natur&kapsel=gold&weinfarbe=rotDunkel&etikettSrc=https%3A//example.com/label.png&etikettTop=100&etikettLeft=50&etikettScaleX=0.8&etikettScaleY=0.8
```

**Mit Kunden-ID:**
```
https://example.com/konfigurator?customerId=firebase-user-123&flasche=bd75optima&korken=natur
```

**Nur Basis-Konfiguration:**
```
https://example.com/konfigurator?flasche=bd75optima&weinfarbe=weiss
```

## API Integration

### Entwurf-Speichern Callback

```javascript
const handleSaveDraft = async (draft) => {
    // draft enthält:
    // {
    //   id: timestamp,
    //   name: "Benutzer Name",
    //   thumbnail: "data:image/png;base64,...",
    //   flasche: "bd75optima",
    //   korken: "natur",
    //   kapsel: "gold",
    //   weinfarbe: "rotDunkel",
    //   customColor: "#8B0000",
    //   weinSettings: { opacity: 1.0, contrast: 1.5, blendMode: 'multiply' },
    //   etikett: { src: "...", top: 100, left: 50, scaleX: 0.8, scaleY: 0.8, rotation: 0 },
    //   customerId: "firebase-user-123",
    //   createdAt: "2025-08-06T...",
    //   shareUrl: "https://..."
    // }

    const response = await fetch('/api/customer/drafts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(draft)
    });

    if (!response.ok) {
        throw new Error('Fehler beim Speichern des Entwurfs');
    }

    return response.json();
};
```

### Entwürfe laden (für Dashboard)

```javascript
// Im Dashboard die Entwürfe laden
useEffect(() => {
    const loadCustomerDrafts = async () => {
        const response = await fetch(`/api/customer/drafts?customerId=${user.uid}`);
        const drafts = await response.json();
        
        // Entwürfe in localStorage für Konfigurator verfügbar machen
        localStorage.setItem(
            `flaschenkonfigurator_entwuerfe_${user.uid}`, 
            JSON.stringify(drafts)
        );
    };

    if (user?.uid) {
        loadCustomerDrafts();
    }
}, [user]);
```

## Utility-Funktionen

```javascript
import { 
    generateConfigurationUrl, 
    parseConfigurationFromUrl, 
    validateConfiguration 
} from '@/lib/urlParams';

// URL aus aktueller Konfiguration generieren
const shareUrl = generateConfigurationUrl({
    flasche: 'bd75optima',
    korken: 'natur',
    weinfarbe: 'rotDunkel'
});

// Konfiguration aus URL parsen
const config = parseConfigurationFromUrl(window.location.search);

// Konfiguration validieren
const { isValid, errors } = validateConfiguration(config);
```

## Firebase Integration Beispiel

### API Route: `/api/customer/drafts`

```javascript
// pages/api/customer/drafts.js
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const draft = req.body;
            const docRef = await addDoc(collection(db, 'drafts'), draft);
            res.status(200).json({ id: docRef.id, ...draft });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Speichern' });
        }
    } else if (req.method === 'GET') {
        try {
            const customerId = req.query.customerId;
            const q = query(
                collection(db, 'drafts'), 
                where('customerId', '==', customerId)
            );
            const querySnapshot = await getDocs(q);
            const drafts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(drafts);
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Laden' });
        }
    }
}
```

## Eigenschaften der Konfigurator Komponente

| Prop | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `customerId` | string | null | Firebase User ID für Kundendashboard |
| `mode` | 'standalone' \| 'dashboard' | 'standalone' | Betriebsmodus |
| `onSaveCallback` | function | null | Callback für Entwurf-Speichern im Dashboard |
| `initialConfig` | object | null | Vorkonfiguration (überschreibt URL-Parameter) |

## Styling und Anpassung

Der Konfigurator verwendet TailwindCSS und kann über CSS-Klassen angepasst werden. Für Kundendashboard-Integration können Sie die Container-Klassen überschreiben:

```css
.konfigurator-container {
    /* Ihre benutzerdefinierten Styles */
}
```
