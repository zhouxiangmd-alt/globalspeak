import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  HelpCircle,
  Keyboard,
  LifeBuoy,
  Mic,
  Send,
  Sparkles,
  Square,
} from 'lucide-react';
import {
  getDeviceEnvironment,
  startSpeechRecognition,
  stopSpeechRecognition,
  unlockAudioForIOS,
} from '../../services/speechService';
import type { AccentCode, SimulatedVoiceOption } from '../../types';

interface VoiceComposerProps {
  disabled: boolean;
  accent: AccentCode;
  preferSimulatedVoice: boolean;
  hintOpen: boolean;
  onToggleHint: () => void;
  draftText: string;
  onDraftChange: (text: string) => void;
  simulatedReplies: [SimulatedVoiceOption, SimulatedVoiceOption];
  onSubmit: (
    text: string,
    method: 'voice' | 'simulated-voice' | 'text'
  ) => void;
  onOpenMicHelp: () => void;
}

type InputMode = 'voice' | 'text' | 'simulate';

export function VoiceComposer({
  disabled,
  accent,
  preferSimulatedVoice,
  hintOpen,
  onToggleHint,
  draftText,
  onDraftChange,
  simulatedReplies,
  onSubmit,
  onOpenMicHelp,
}: VoiceComposerProps) {
  const [env] = useState(() => getDeviceEnvironment());
  const [mode, setMode] = useState<InputMode>(() =>
    preferSimulatedVoice || !env.canUseNativeMic ? 'simulate' : 'voice'
  );
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [simulatingText, setSimulatingText] = useState<string | null>(null);

  const pressStartedAtRef = useRef<number>(0);
  const holdReleaseArmedRef = useRef<boolean>(false);
  const simTimerRef = useRef<number | null>(null);

  // If user clicked "填入输入框" from HintPopover, automatically switch to text mode so they can tweak or send
  useEffect(() => {
    if (draftText.trim().length > 0 && mode !== 'text') {
      setMode('text');
    }
  }, [draftText, mode]);

  useEffect(() => {
    return () => {
      stopSpeechRecognition(true);
      if (simTimerRef.current !== null) {
        window.clearTimeout(simTimerRef.current);
      }
    };
  }, []);

  const beginListening = () => {
    if (disabled || isListening) return;
    setVoiceError(null);
    setLiveTranscript('');

    const started = startSpeechRecognition({
      lang: accent,
      onStart: () => {
        setIsListening(true);
      },
      onInterim: (text) => {
        setLiveTranscript(text);
      },
      onFinal: (finalText) => {
        setIsListening(false);
        setLiveTranscript('');
        if (finalText.trim()) {
          onSubmit(finalText.trim(), 'voice');
        }
      },
      onError: (friendlyMessage, code) => {
        setIsListening(false);
        setVoiceError(friendlyMessage);
        if (
          code === 'unsupported' ||
          code === 'insecure-context' ||
          code === 'service-not-allowed'
        ) {
          setMode('simulate');
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (started) {
      setIsListening(true);
    }
  };

  const stopListeningAndSend = () => {
    if (!isListening) return;
    stopSpeechRecognition(false);
  };

  /**
   * Hybrid Press-and-Hold + Tap-to-Talk handler specifically engineered for iPhone Safari:
   * - Holding > 420ms and releasing acts as classic Press-to-Talk.
   * - Quick tap (or iOS permission alert firing pointercancel) stays smoothly in listening mode
   *   until the user taps "停止并发送" — preventing accidental cutoff on iPhone!
   */
  const handleMicPointerDown = () => {
    if (disabled) return;
    if (isListening) {
      holdReleaseArmedRef.current = false;
      stopListeningAndSend();
      return;
    }
    pressStartedAtRef.current = Date.now();
    holdReleaseArmedRef.current = true;
    beginListening();
  };

  const handleMicPointerUp = () => {
    if (!holdReleaseArmedRef.current) return;
    holdReleaseArmedRef.current = false;
    const heldMs = Date.now() - pressStartedAtRef.current;
    if (heldMs >= 420 && isListening) {
      stopListeningAndSend();
    }
  };

  const handleMicPointerCancel = () => {
    // On iOS Safari, the first microphone permission dialog fires pointercancel immediately.
    // Do NOT abort recognition here so the user can smoothly grant permission and keep speaking!
    holdReleaseArmedRef.current = false;
  };

  const handleSimulateVoice = (option: SimulatedVoiceOption) => {
    if (disabled || simulatingText) return;
    unlockAudioForIOS();
    setVoiceError(null);
    setSimulatingText(option.text);
    simTimerRef.current = window.setTimeout(() => {
      simTimerRef.current = null;
      setSimulatingText(null);
      onSubmit(option.text, 'simulated-voice');
    }, 680);
  };

  const handleTextSend = () => {
    const trimmed = draftText.trim();
    if (!trimmed || disabled) return;
    unlockAudioForIOS();
    onDraftChange('');
    onSubmit(trimmed, 'text');
  };

  return (
    <div className="pb-safe shrink-0 border-t border-slate-200/90 bg-white/95 px-3 pt-2.5 pb-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      {/* Error / iPhone Safari Diagnostic Notice */}
      {voiceError && (
        <div className="mb-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p>{voiceError}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenMicHelp}
                  className="inline-flex items-center gap-1 font-semibold text-amber-800 underline underline-offset-2 dark:text-amber-300"
                >
                  <HelpCircle className="h-3 w-3" />
                  查看 iPhone 麦克风与听写设置
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceError(null);
                    setMode('simulate');
                  }}
                  className="font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
                >
                  立即使用模拟语音
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Speech-to-Text Preview Bar */}
      {(isListening || simulatingText) && (
        <div className="mb-2.5 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/80">
          <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <p className="flex-1 truncate font-medium">
            {simulatingText
              ? `模拟口语录入中：${simulatingText}`
              : liveTranscript || '正在倾听英文发言，说完松开或轻点停止...'}
          </p>
        </div>
      )}

      {/* Mode switcher + Hint Lifebuoy row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setVoiceError(null);
              setMode('voice');
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
              mode === 'voice'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Mic className="h-3 w-3" />
            真机语音
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeechRecognition(true);
              setIsListening(false);
              setMode('simulate');
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
              mode === 'simulate'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            模拟语音
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeechRecognition(true);
              setIsListening(false);
              setMode('text');
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
              mode === 'text'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Keyboard className="h-3 w-3" />
            文字输入
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleHint}
          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
            hintOpen
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/70'
          }`}
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          救生圈
        </button>
      </div>

      {/* Mode 1: Real Voice (Hold or Tap to Talk, iOS Safari hardened) */}
      {mode === 'voice' && (
        <div className="space-y-1.5">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <span
                aria-hidden="true"
                className="animate-gs-pulse-ring pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500/35"
              />
            )}
            <button
              type="button"
              disabled={disabled}
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerCancel={handleMicPointerCancel}
              className={`touch-hold-target relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400'
              }`}
            >
              {isListening ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  松开或轻点结束并发送
                </>
              ) : (
                <>
                  <Mic className="h-4.5 w-4.5" />
                  按住说话（或轻点开始讲英文）
                </>
              )}
            </button>
          </div>
          {!env.canUseNativeMic && (
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
              {!env.isSecureContext
                ? '当前非 HTTPS 连接，iPhone 需 HTTPS 才可开麦，推荐使用「模拟语音」或「文字输入」'
                : '当前浏览器不支持原生实时识别，点击上方「模拟语音」即可无缝演练'}
            </p>
          )}
        </div>
      )}

      {/* Mode 2: Simulated Voice Fallback (Zero-mic realistic speaking demo) */}
      {mode === 'simulate' && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            无麦克风 / 不便开口模式：轻点下方任一语音卡片模拟开口（选「直译版」可重点测试社交体检纠偏）
          </p>
          <div className="grid grid-cols-1 gap-2">
            {simulatedReplies.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={disabled || Boolean(simulatingText)}
                onClick={() => handleSimulateVoice(opt)}
                className={`flex items-start justify-between gap-2.5 rounded-xl border p-2.5 text-left transition active:scale-[0.98] disabled:opacity-50 ${
                  opt.styleTag === 'stiff'
                    ? 'border-amber-200/90 bg-amber-50/60 hover:border-amber-300 dark:border-amber-800/60 dark:bg-amber-950/30'
                    : 'border-emerald-200/90 bg-emerald-50/60 hover:border-emerald-300 dark:border-emerald-800/60 dark:bg-emerald-950/30'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      opt.styleTag === 'stiff'
                        ? 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200'
                        : 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <p className="mt-1 text-xs font-medium leading-snug text-slate-800 dark:text-slate-100">
                    “{opt.text}”
                  </p>
                </div>
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950">
                  <Mic className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Text Input Fallback */}
      {mode === 'text' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTextSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={draftText}
            onChange={(e) => onDraftChange(e.target.value)}
            disabled={disabled}
            placeholder="输入英文回复，例如：Could I get a hot Americano?"
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={disabled || !draftText.trim()}
            aria-label="发送回复"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40 dark:bg-emerald-500 dark:text-slate-950"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      )}
    </div>
  );
}
