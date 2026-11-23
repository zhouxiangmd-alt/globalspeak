import { useCallback, useEffect, useRef, useState } from 'react';

export type UpdateCheckStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'error';

export function useAppUpdate() {
  const [status, setStatus] = useState<UpdateCheckStatus>('idle');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hadControllerRef = useRef<boolean>(
    typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      Boolean(navigator.serviceWorker.controller)
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let isMounted = true;

    const handleControllerChange = () => {
      if (!isMounted) return;
      if (hadControllerRef.current) {
        setUpdateAvailable(true);
        setStatus('available');
        setStatusMessage('发现 GlobalSpeak 新版本，点击立即应用更新。');
      } else {
        hadControllerRef.current = true;
      }
    };

    const bindRegistration = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setUpdateAvailable(true);
        setStatus('available');
        setStatusMessage('新版本已下载就绪，点击立即刷新启用。');
      }

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (
            isMounted &&
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setUpdateAvailable(true);
            setStatus('available');
            setStatusMessage('新版本已下载就绪，点击立即刷新启用。');
          }
        });
      });
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    );

    void navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg && isMounted) {
          bindRegistration(reg);
        }
      })
      .catch(() => {});

    // Automatically check for updates when user returns to iPhone PWA from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void navigator.serviceWorker
          .getRegistration()
          .then((reg) => reg?.update())
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  const checkForUpdate = useCallback(async () => {
    setStatus('checking');
    setStatusMessage('正在联网检查最新版本...');

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();

          // Give newly discovered SW a moment to transition to installing/waiting
          await new Promise((r) => setTimeout(r, 450));

          if (reg.waiting || reg.installing) {
            setUpdateAvailable(true);
            setStatus('available');
            setStatusMessage('检测到新版本！点击「立即更新」即可生效（本地金句本与设置均保留）。');
            return;
          }
        }
      }

      // Verify network connectivity gently without polluting cache
      await fetch(`/manifest.webmanifest?t=${Date.now()}`, {
        cache: 'no-store',
      });

      setStatus('up-to-date');
      setStatusMessage(`当前已是最新版本（v${__APP_VERSION__}）。`);
    } catch {
      setStatus('error');
      setStatusMessage('检查更新失败，请确认手机网络正常后重试。');
    }
  }, []);

  /**
   * Clears Workbox/SW runtime asset caches (never touches localStorage phrasebook/keys!)
   * and reloads fresh assets from the server.
   */
  const forceReloadApp = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        await reg?.update();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Proceed to reload anyway
    }
    window.location.reload();
  }, []);

  return {
    version: __APP_VERSION__,
    buildTime: __BUILD_TIME__,
    status,
    updateAvailable,
    statusMessage,
    checkForUpdate,
    applyUpdate,
    forceReloadApp,
  };
}
