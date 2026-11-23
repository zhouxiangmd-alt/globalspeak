import { useState } from 'react';
import {
  AudioLines,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  KeyRound,
  Loader2,
  Mic,
  Monitor,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  clearAudioCache,
  GEMINI_TTS_VOICES,
  getAudioCacheCount,
  getDeviceEnvironment,
  OPENAI_TTS_VOICES,
  resolveEffectiveTtsSource,
  speakText,
  stopSpeaking,
  unlockAudioForIOS,
} from '../../services/speechService';
import type {
  AccentCode,
  AiEngineMode,
  AppSettings,
  ThemeMode,
  TtsEnginePreference,
  TtsPlaybackSource,
} from '../../types';

import type { UpdateCheckStatus } from '../../hooks/useAppUpdate';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onOpenIOSGuide: (focus: 'install' | 'mic') => void;
  hasNativeInstallPrompt: boolean;
  onTriggerInstall: () => void;
  appVersion: string;
  buildTime: string;
  updateStatus: UpdateCheckStatus;
  updateAvailable: boolean;
  updateMessage: string | null;
  onCheckUpdate: () => void;
  onApplyUpdate: () => void;
  onForceReload: () => void;
}

const SPEED_PRESETS = [
  { value: 0.75, label: '0.75x 慢跟读' },
  { value: 0.85, label: '0.85x 稍慢' },
  { value: 1, label: '1.0x 标准' },
  { value: 1.15, label: '1.15x 实景偏快' },
];

export function SettingsView({
  settings,
  onUpdateSettings,
  onOpenIOSGuide,
  hasNativeInstallPrompt,
  onTriggerInstall,
  appVersion,
  buildTime,
  updateStatus,
  updateAvailable,
  updateMessage,
  onCheckUpdate,
  onApplyUpdate,
  onForceReload,
}: SettingsViewProps) {
  const [env] = useState(() => getDeviceEnvironment());
  const [testState, setTestState] = useState<'idle' | 'loading' | 'playing'>(
    'idle'
  );
  const [testSource, setTestSource] = useState<TtsPlaybackSource | null>(null);
  const [testNotice, setTestNotice] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [cacheCount, setCacheCount] = useState(() => getAudioCacheCount());

  const effectiveSource = resolveEffectiveTtsSource(settings);

  const handleTestVoice = () => {
    unlockAudioForIOS();
    if (testState !== 'idle') {
      stopSpeaking();
      setTestState('idle');
      return;
    }

    setTestNotice(null);
    setTestSource(null);
    speakText(
      "Good morning, Doctor! Could I get you a hot Americano before the morning keynote starts?",
      {
        accent: settings.defaultAccent,
        rate: settings.defaultSpeed,
        settings,
        contextId: 'preview',
        onLoading: () => setTestState('loading'),
        onStart: (source) => {
          setTestState('playing');
          setTestSource(source);
          setCacheCount(getAudioCacheCount());
        },
        onEnd: () => {
          setTestState('idle');
          setCacheCount(getAudioCacheCount());
        },
        onFallback: (notice) => setTestNotice(notice),
        onError: (reason) => {
          setTestNotice(reason);
          setTestState('idle');
        },
      }
    );
  };

  const handleClearCache = () => {
    stopSpeaking();
    clearAudioCache();
    setCacheCount(0);
    setTestState('idle');
  };

  const effectiveBannerText =
    effectiveSource === 'openai-tts'
      ? `当前生效：OpenAI 真人神经网络语音（${settings.openaiTtsModel || 'gpt-4o-mini-tts'} · ${settings.openaiTtsVoice}），自动按场景附带语气 instructions`
      : effectiveSource === 'gemini-tts'
        ? `当前生效：Gemini 原生人声（${settings.geminiTtsModel || 'gemini-2.5-flash-preview-tts'} · ${settings.geminiTtsVoice}）`
        : settings.ttsEnginePreference === 'browser'
          ? '已手动选择浏览器离线语音（零 API 消耗）'
          : '当前为离线沙盒或尚未填写 API Key，将自动平滑使用浏览器离线语音兜底';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="pt-safe shrink-0 border-b border-slate-200/80 bg-white/95 px-4 pb-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="pt-3">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            偏好设置与语音引擎
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            复用同一份 API Key 驱动真人神经网络语音、语速调节与 iPhone Safari 适配
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 pt-4 pb-6">
        {/* Section 1: Dual-Mode AI Engine */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              AI 对话与体检引擎（双模式）
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            默认「离线沙盒」免 Key 即开即练；填入 API Key 后同时驱动实时对话、社交体检与真人神经网络语音。
          </p>

          <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/80">
            {(
              [
                { id: 'demo', label: '离线沙盒' },
                { id: 'gemini', label: 'Gemini API' },
                { id: 'openai', label: 'OpenAI 兼容' },
              ] as Array<{ id: AiEngineMode; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateSettings({ aiMode: opt.id })}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  settings.aiMode === opt.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {settings.aiMode === 'gemini' && (
            <div className="mt-3.5 space-y-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gemini API Key（对话与语音共用）
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    {showKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={(e) =>
                    onUpdateSettings({ geminiApiKey: e.target.value })
                  }
                  placeholder="AIza..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  对话模型名称
                </label>
                <input
                  type="text"
                  value={settings.geminiModel}
                  onChange={(e) =>
                    onUpdateSettings({ geminiModel: e.target.value })
                  }
                  placeholder="gemini-2.5-flash"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {settings.aiMode === 'openai' && (
            <div className="mt-3.5 space-y-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  API Base URL（兼容 OpenAI / 中转站）
                </label>
                <input
                  type="url"
                  value={settings.openaiBaseUrl}
                  onChange={(e) =>
                    onUpdateSettings({ openaiBaseUrl: e.target.value })
                  }
                  placeholder="https://api.openai.com/v1"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    API Key（对话与语音共用）
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    {showKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.openaiApiKey}
                  onChange={(e) =>
                    onUpdateSettings({ openaiApiKey: e.target.value })
                  }
                  placeholder="sk-..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  对话模型名称
                </label>
                <input
                  type="text"
                  value={settings.openaiModel}
                  onChange={(e) =>
                    onUpdateSettings({ openaiModel: e.target.value })
                  }
                  placeholder="gpt-4o-mini"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {settings.aiMode !== 'demo' && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Key 仅保存在本机浏览器 localStorage，绝不经过第三方中转；异常时自动降级本地兜底。
            </p>
          )}
        </section>

        {/* Section 2: Neural Voice & Speed Settings */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AudioLines className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                语音播报引擎与音色
              </h2>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800"
            >
              {testState === 'loading' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  合成中...
                </>
              ) : testState === 'playing' ? (
                <>
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  停止试听
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3" />
                  试听当前语音
                </>
              )}
            </button>
          </div>

          {/* Neural TTS vs Browser Offline Fallback Switch */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/80">
            {(
              [
                {
                  id: 'neural',
                  label: '真人神经网络语音',
                  icon: Sparkles,
                },
                {
                  id: 'browser',
                  label: '浏览器离线兜底',
                  icon: Volume2,
                },
              ] as Array<{
                id: TtsEnginePreference;
                label: string;
                icon: typeof Sparkles;
              }>
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ ttsEnginePreference: opt.id })
                  }
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    settings.ttsEnginePreference === opt.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Effective TTS Status Pill */}
          <div
            className={`mt-2.5 rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
              effectiveSource !== 'browser-tts'
                ? 'bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/60'
                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:text-slate-300 dark:ring-slate-700/70'
            }`}
          >
            {effectiveBannerText}
          </div>

          {/* Live Test Status / Fallback Feedback */}
          {(testSource || testNotice) && (
            <div className="mt-2 rounded-xl bg-amber-50/90 px-3 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/70">
              {testNotice
                ? testNotice
                : testSource === 'openai-tts'
                  ? `试听成功：已通过 OpenAI ${settings.openaiTtsModel} (${settings.openaiTtsVoice}) 生成真人语音并写入缓存。`
                  : testSource === 'gemini-tts'
                    ? `试听成功：已通过 Gemini 原生语音 (${settings.geminiTtsVoice}) 生成人声并写入缓存。`
                    : '试听成功：当前使用浏览器原生离线朗读。'}
            </div>
          )}

          {/* OpenAI Voice Picker (shown when neural + openai mode) */}
          {settings.ttsEnginePreference === 'neural' &&
            settings.aiMode === 'openai' && (
              <div className="mt-3.5 space-y-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    OpenAI 语音模型（默认 gpt-4o-mini-tts）
                  </label>
                  <input
                    type="text"
                    value={settings.openaiTtsModel}
                    onChange={(e) =>
                      onUpdateSettings({ openaiTtsModel: e.target.value })
                    }
                    placeholder="gpt-4o-mini-tts"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    选择自然人声音色
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {OPENAI_TTS_VOICES.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ openaiTtsVoice: v.id })
                        }
                        className={`rounded-xl border px-2.5 py-2 text-left transition ${
                          settings.openaiTtsVoice === v.id
                            ? 'border-emerald-500 bg-emerald-50/80 dark:border-emerald-500 dark:bg-emerald-950/50'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {v.label}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* Gemini Native Voice Picker (shown when neural + gemini mode) */}
          {settings.ttsEnginePreference === 'neural' &&
            settings.aiMode === 'gemini' && (
              <div className="mt-3.5 space-y-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gemini 原生语音模型
                  </label>
                  <input
                    type="text"
                    value={settings.geminiTtsModel}
                    onChange={(e) =>
                      onUpdateSettings({ geminiTtsModel: e.target.value })
                    }
                    placeholder="gemini-2.5-flash-preview-tts"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    选择 Gemini 原生音色
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GEMINI_TTS_VOICES.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ geminiTtsVoice: v.id })
                        }
                        className={`rounded-xl border px-2.5 py-2 text-left transition ${
                          settings.geminiTtsVoice === v.id
                            ? 'border-emerald-500 bg-emerald-50/80 dark:border-emerald-500 dark:bg-emerald-950/50'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {v.label}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          <div className="mt-4 space-y-4">
            {/* Accent */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                默认朗读口音
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-900/80">
                {(
                  [
                    { id: 'en-US', label: '🇺🇸 美音' },
                    { id: 'en-GB', label: '🇬🇧 英音' },
                  ] as Array<{ id: AccentCode; label: string }>
                ).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onUpdateSettings({ defaultAccent: a.id })}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      settings.defaultAccent === a.id
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-grained Speed Slider + Presets */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  播报语速调节（自动变速保真，不重复扣费）
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {settings.defaultSpeed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.7}
                max={1.25}
                step={0.05}
                value={settings.defaultSpeed}
                onChange={(e) =>
                  onUpdateSettings({ defaultSpeed: Number(e.target.value) })
                }
                aria-label="播报语速调节"
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 dark:bg-slate-700"
              />
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {SPEED_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ defaultSpeed: preset.value })
                    }
                    className={`rounded-lg py-1 text-[10px] font-semibold transition ${
                      Math.abs(settings.defaultSpeed - preset.value) < 0.01
                        ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900/80 dark:text-slate-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blind listen toggle */}
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  进入对练默认开启「盲听优先」
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  AI 回复默认折叠文字先听语音，锻炼脱敏听力
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.blindListenDefault}
                onChange={(e) =>
                  onUpdateSettings({ blindListenDefault: e.target.checked })
                }
                className="h-5 w-5 accent-emerald-600"
              />
            </label>

            {/* Prefer simulated voice toggle */}
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  优先展示「无麦克风模拟语音」
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  适合在医院值班室、候机厅或无麦设备时安静演练
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.preferSimulatedVoice}
                onChange={(e) =>
                  onUpdateSettings({ preferSimulatedVoice: e.target.checked })
                }
                className="h-5 w-5 accent-emerald-600"
              />
            </label>

            {/* Audio Cache Status Row */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] dark:bg-slate-900/60">
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Database className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                本次会话已缓存 <strong>{cacheCount}</strong> 条真人语音（重听免重复扣费）
              </span>
              {cacheCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="inline-flex shrink-0 items-center gap-1 font-semibold text-rose-600 hover:underline dark:text-rose-400"
                >
                  <Trash2 className="h-3 w-3" />
                  清空
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Theme */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              外观主题（同步 iPhone 状态栏）
            </h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/80">
            {(
              [
                { id: 'system', label: '跟随系统', icon: Monitor },
                { id: 'light', label: '浅色护眼', icon: Sun },
                { id: 'dark', label: '夜间深色', icon: Moon },
              ] as Array<{ id: ThemeMode; label: string; icon: typeof Sun }>
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: opt.id })}
                  className={`inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition ${
                    settings.theme === opt.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 4: iPhone Safari PWA & Voice Compatibility Center */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              iPhone Safari 与 PWA 兼容检测
            </h2>
          </div>

          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-900/60">
            <StatusRow
              label="PWA 全屏独立模式"
              ok={env.isStandalonePWA}
              okText="已从主屏幕独立启动"
              noText="当前在浏览器标签页运行"
            />
            <StatusRow
              label="HTTPS 安全环境（麦克风前置条件）"
              ok={env.isSecureContext}
              okText="已就绪"
              noText="非 HTTPS（将自动启用模拟语音兜底）"
            />
            <StatusRow
              label="浏览器离线兜底语音 (TTS)"
              ok={env.hasTTS}
              okText="支持美音/英音与 0.8x 慢速"
              noText="使用静音动画模拟"
            />
            <StatusRow
              label="浏览器实时语音识别 (STT)"
              ok={env.canUseNativeMic}
              okText="已支持按住/轻点说话"
              noText="已就绪「模拟语音 + 文字输入」兜底"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                hasNativeInstallPrompt
                  ? onTriggerInstall()
                  : onOpenIOSGuide('install')
              }
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              添加到主屏幕指南
            </button>
            <button
              type="button"
              onClick={() => onOpenIOSGuide('mic')}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
            >
              <Mic className="h-3.5 w-3.5" />
              iPhone 语音权限排查
            </button>
          </div>
        </section>

        {/* Section 5: Version & One-Tap Online Update */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                版本与在线更新
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              v{appVersion}
            </span>
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            构建时间：{buildTime} UTC · 在线更新仅刷新页面代码，你的金句本、复盘记录与 API Key 会完整保留。
          </p>

          {updateMessage && (
            <div
              className={`mt-2.5 rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                updateAvailable
                  ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800'
                  : updateStatus === 'error'
                    ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800'
                    : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:text-slate-300 dark:ring-slate-700'
              }`}
            >
              {updateMessage}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {updateAvailable ? (
              <button
                type="button"
                onClick={onApplyUpdate}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-slate-950"
              >
                <Sparkles className="h-3.5 w-3.5" />
                立即更新到新版
              </button>
            ) : (
              <button
                type="button"
                disabled={updateStatus === 'checking'}
                onClick={onCheckUpdate}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950"
              >
                {updateStatus === 'checking' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    检查中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    一键检查更新
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onForceReload}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-700 dark:text-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              清缓存重载页面
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  okText,
  noText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  noText: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 text-right font-semibold ${
          ok
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-amber-700 dark:text-amber-400'
        }`}
      >
        {ok ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        {ok ? okText : noText}
      </span>
    </div>
  );
}
