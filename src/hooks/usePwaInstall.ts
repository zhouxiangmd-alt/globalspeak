import { useCallback, useEffect, useState } from 'react';
import { getDeviceEnvironment } from '../services/speechService';
import {
  dismissIOSInstallBanner,
  isIOSInstallBannerDismissed,
} from '../services/storageService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [env] = useState(() => getDeviceEnvironment());
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() =>
    isIOSInstallBannerDismissed()
  );
  const [showIOSGuideModal, setShowIOSGuideModal] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowIOSGuideModal(true);
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    dismissIOSInstallBanner();
    setBannerDismissed(true);
  }, []);

  const canShowInstallBanner =
    !env.isStandalonePWA &&
    !bannerDismissed &&
    (env.shouldShowIOSInstallGuide || Boolean(deferredPrompt));

  return {
    env,
    canShowInstallBanner,
    hasNativeInstallPrompt: Boolean(deferredPrompt),
    showIOSGuideModal,
    setShowIOSGuideModal,
    triggerInstall,
    dismissBanner,
  };
}
