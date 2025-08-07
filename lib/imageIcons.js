// Bild-basierte Icons

export const ImageIcons = {
    flaschen: <img src="/icons/bottle.png" alt="Flasche" className="w-4 h-4" />,
    korken: <img src="/icons/cork.png" alt="Korken" className="w-4 h-4" />,
    kapseln: <img src="/icons/capsule.png" alt="Kapsel" className="w-4 h-4" />,
    weinfarbe: <img src="/icons/wine.png" alt="Wein" className="w-4 h-4" />,
    etikett: <img src="/icons/label.png" alt="Etikett" className="w-4 h-4" />,
    entwuerfe: <img src="/icons/drafts.png" alt="Entwürfe" className="w-4 h-4" />,
    export: <img src="/icons/export.png" alt="Export" className="w-4 h-4" />,
    hilfe: <img src="/icons/help.png" alt="Hilfe" className="w-4 h-4" />
};

// Next.js Image Component für bessere Performance
import Image from 'next/image';

export const OptimizedImageIcons = {
    flaschen: <Image src="/icons/bottle.png" alt="Flasche" width={16} height={16} />,
    korken: <Image src="/icons/cork.png" alt="Korken" width={16} height={16} />,
    kapseln: <Image src="/icons/capsule.png" alt="Kapsel" width={16} height={16} />,
    weinfarbe: <Image src="/icons/wine.png" alt="Wein" width={16} height={16} />,
    etikett: <Image src="/icons/label.png" alt="Etikett" width={16} height={16} />,
    entwuerfe: <Image src="/icons/drafts.png" alt="Entwürfe" width={16} height={16} />,
    export: <Image src="/icons/export.png" alt="Export" width={16} height={16} />,
    hilfe: <Image src="/icons/help.png" alt="Hilfe" width={16} height={16} />
};
