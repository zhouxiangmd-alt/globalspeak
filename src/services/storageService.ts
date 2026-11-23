import { STARTER_PHRASES } from '../data/starterPhrases';
import type { AppSettings, SavedPhrase, SocialFeedbackReport } from '../types';

const KEYS = {
  SETTINGS: 'globalspeak_settings_v1',
  PHRASES: 'globalspeak_phrasebook_v1',
  HISTORY: 'globalspeak_history_v1',
  IOS_INSTALL_DISMISSED: 'globalspeak_ios_install_dismissed_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultAccent: 'en-US',
  defaultSpeed: 1,
  blindListenDefault: true,
  preferSimulatedVoice: false,
  aiMode: 'demo',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  ttsEnginePreference: 'neural',
  openaiTtsModel: 'gpt-4o-mini-tts',
  openaiTtsVoice: 'coral',
  geminiTtsModel: 'gemini-2.5-flash-preview-tts',
  geminiTtsVoice: 'Kore',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore quota errors in private browsing mode
  }
}

export function loadPhrasebook(): SavedPhrase[] {
  try {
    const raw = localStorage.getItem(KEYS.PHRASES);
    if (!raw) {
      localStorage.setItem(KEYS.PHRASES, JSON.stringify(STARTER_PHRASES));
      return STARTER_PHRASES;
    }
    const parsed = JSON.parse(raw) as SavedPhrase[];
    return Array.isArray(parsed) ? parsed : STARTER_PHRASES;
  } catch {
    return STARTER_PHRASES;
  }
}

export function savePhrasebook(phrases: SavedPhrase[]): void {
  try {
    localStorage.setItem(KEYS.PHRASES, JSON.stringify(phrases));
  } catch {
    // Ignore storage error
  }
}

export function loadFeedbackHistory(): SocialFeedbackReport[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SocialFeedbackReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedbackHistory(reports: SocialFeedbackReport[]): void {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(reports.slice(0, 20)));
  } catch {
    // Ignore storage error
  }
}

export function isIOSInstallBannerDismissed(): boolean {
  try {
    return localStorage.getItem(KEYS.IOS_INSTALL_DISMISSED) === '1';
  } catch {
    return false;
  }
}

export function dismissIOSInstallBanner(): void {
  try {
    localStorage.setItem(KEYS.IOS_INSTALL_DISMISSED, '1');
  } catch {
    // Ignore
  }
}
