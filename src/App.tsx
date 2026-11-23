import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { FeedbackModal } from './components/feedback/FeedbackModal';
import { BottomNav } from './components/layout/BottomNav';
import { MobileShell } from './components/layout/MobileShell';
import { PhrasebookView } from './components/phrasebook/PhrasebookView';
import { IOSInstallGuideModal } from './components/pwa/IOSInstallGuideModal';
import { RoleplaySandbox } from './components/sandbox/RoleplaySandbox';
import { ScenarioHub } from './components/scenario/ScenarioHub';
import { SettingsView } from './components/settings/SettingsView';
import { getScenarioById } from './data/scenarios';
import { useAppUpdate } from './hooks/useAppUpdate';
import { usePhrasebook } from './hooks/usePhrasebook';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useTheme } from './hooks/useTheme';
import {
  loadFeedbackHistory,
  loadSettings,
  saveFeedbackHistory,
  saveSettings,
} from './services/storageService';
import type {
  ActiveTab,
  AppSettings,
  ScenarioConfig,
  SocialFeedbackReport,
} from './types';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('hub');
  const [activeScenario, setActiveScenario] = useState<ScenarioConfig | null>(
    null
  );
  const [sessionKey, setSessionKey] = useState(0);

  const [history, setHistory] = useState<SocialFeedbackReport[]>(() =>
    loadFeedbackHistory()
  );
  const [activeReport, setActiveReport] = useState<SocialFeedbackReport | null>(
    null
  );
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [guideFocus, setGuideFocus] = useState<'install' | 'mic'>('install');

  const { isDark } = useTheme(settings.theme);
  const {
    phrases,
    isPhraseSaved,
    saveFromFeedback,
    addCustomPhrase,
    toggleFavorite,
    deletePhrase,
  } = usePhrasebook();

  const {
    env,
    canShowInstallBanner,
    hasNativeInstallPrompt,
    showIOSGuideModal,
    setShowIOSGuideModal,
    triggerInstall,
    dismissBanner,
  } = usePwaInstall();

  const {
    version: appVersion,
    buildTime,
    status: updateStatus,
    updateAvailable,
    statusMessage: updateMessage,
    checkForUpdate,
    applyUpdate,
    forceReloadApp,
  } = useAppUpdate();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveFeedbackHistory(history);
  }, [history]);

  const handleUpdateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleToggleThemeQuick = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: isDark ? 'light' : 'dark',
    }));
  }, [isDark]);

  const handleStartScenario = useCallback((scenario: ScenarioConfig) => {
    setActiveReport(null);
    setReportNotice(null);
    setActiveScenario(scenario);
    setSessionKey((k) => k + 1);
  }, []);

  const handleFeedbackReady = useCallback(
    (report: SocialFeedbackReport, notice?: string) => {
      setHistory((prev) => [report, ...prev]);
      setActiveReport(report);
      setReportNotice(notice ?? null);
    },
    []
  );

  const handleOpenGuide = useCallback(
    (focus: 'install' | 'mic') => {
      setGuideFocus(focus);
      setShowIOSGuideModal(true);
    },
    [setShowIOSGuideModal]
  );

  return (
    <MobileShell>
      {activeScenario ? (
        <RoleplaySandbox
          key={`${activeScenario.id}-${sessionKey}`}
          scenario={activeScenario}
          settings={settings}
          onExit={() => setActiveScenario(null)}
          onFeedbackReady={handleFeedbackReady}
          onOpenMicHelp={() => handleOpenGuide('mic')}
        />
      ) : (
        <>
          {activeTab === 'hub' && (
            <ScenarioHub
              settings={settings}
              isDark={isDark}
              onToggleTheme={handleToggleThemeQuick}
              onStartScenario={handleStartScenario}
              onOpenSettings={() => setActiveTab('settings')}
              latestReport={history[0] ?? null}
              onViewLatestReport={() => {
                if (history[0]) {
                  setReportNotice(null);
                  setActiveReport(history[0]);
                }
              }}
              canShowInstallBanner={canShowInstallBanner}
              isIOS={env.isIOS}
              onTriggerInstall={() => {
                setGuideFocus('install');
                void triggerInstall();
              }}
              onDismissInstallBanner={dismissBanner}
            />
          )}

          {activeTab === 'phrasebook' && (
            <PhrasebookView
              phrases={phrases}
              settings={settings}
              onAddCustom={addCustomPhrase}
              onToggleFavorite={toggleFavorite}
              onDelete={deletePhrase}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onOpenIOSGuide={handleOpenGuide}
              hasNativeInstallPrompt={hasNativeInstallPrompt}
              onTriggerInstall={() => void triggerInstall()}
              appVersion={appVersion}
              buildTime={buildTime}
              updateStatus={updateStatus}
              updateAvailable={updateAvailable}
              updateMessage={updateMessage}
              onCheckUpdate={() => void checkForUpdate()}
              onApplyUpdate={applyUpdate}
              onForceReload={() => void forceReloadApp()}
            />
          )}

          {updateAvailable && (
            <div className="shrink-0 border-t border-emerald-200 bg-emerald-50 px-3.5 py-2 dark:border-emerald-900 dark:bg-emerald-950/80">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  发现 GlobalSpeak 新版本，金句本与设置不会丢失
                </span>
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition active:scale-95 dark:bg-emerald-500 dark:text-slate-950"
                >
                  <RefreshCw className="h-3 w-3" />
                  立即更新
                </button>
              </div>
            </div>
          )}

          <BottomNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            phraseCount={phrases.length}
          />
        </>
      )}

      {/* Module 3: Social Nuance Feedback Modal */}
      <FeedbackModal
        report={activeReport}
        fallbackNotice={reportNotice}
        settings={settings}
        isPhraseSaved={isPhraseSaved}
        onSavePhrase={saveFromFeedback}
        onClose={() => {
          setActiveReport(null);
          setActiveScenario(null);
        }}
        onReplayScenario={() => {
          if (activeReport) {
            handleStartScenario(getScenarioById(activeReport.scenarioId));
          }
        }}
        onGoPhrasebook={() => {
          setActiveReport(null);
          setActiveScenario(null);
          setActiveTab('phrasebook');
        }}
      />

      {/* iPhone Safari Add-to-Home-Screen & Mic Permission Guide */}
      <IOSInstallGuideModal
        open={showIOSGuideModal}
        onClose={() => setShowIOSGuideModal(false)}
        initialFocus={guideFocus}
      />
    </MobileShell>
  );
}
