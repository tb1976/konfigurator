// hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Starte einen Timer. Nach Ablauf der `delay`-Zeit
    // wird der `debouncedValue` auf den aktuellen `value` gesetzt.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Wichtig: Wenn sich `value` oder `delay` ändern, bevor der Timer
    // abgelaufen ist, wird der alte Timer gelöscht.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Effekt nur erneut ausführen, wenn sich Wert oder Delay ändern

  return debouncedValue;
}