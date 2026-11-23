import { useEffect, useState } from 'react';
import type { ThemeMode } from '../types';

export function useTheme(themeMode: ThemeMode) {
  const [resolvedDark, setResolvedDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const isDark =
        themeMode === 'dark' || (themeMode === 'system' && media.matches);
      setResolvedDark(isDark);
      document.documentElement.classList.toggle('dark', isDark);

      const meta = document.getElementById('meta-theme-color');
      if (meta) {
        meta.setAttribute('content', isDark ? '#0f172a' : '#f8fafc');
      }
    };

    apply();
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [themeMode]);

  return { isDark: resolvedDark };
}
