import {
  Eye,
  EyeOff,
  Gauge,
  Keyboard,
  Loader2,
  Mic,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';
import type { ChatMessage, TtsPlaybackSource } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  personaInitials: string;
  personaGradient: string;
  isLoading: boolean;
  isPlaying: boolean;
  playingRate: number;
  playingSource: TtsPlaybackSource | null;
  defaultRate: number;
  onPlay: (
    messageId: string,
    text: string,
    rate: number,
    emotion?: string
  ) => void;
  onStop: () => void;
  onToggleTranscript: (messageId: string) => void;
}

export function MessageBubble({
  message,
  personaInitials,
  personaGradient,
  isLoading,
  isPlaying,
  playingRate,
  playingSource,
  defaultRate,
  onPlay,
  onStop,
  onToggleTranscript,
}: MessageBubbleProps) {
  if (message.sender === 'user') {
    const InputBadgeIcon =
      message.inputMethod === 'text'
        ? Keyboard
        : message.inputMethod === 'simulated-voice'
          ? Sparkles
          : Mic;
    const inputLabel =
      message.inputMethod === 'text'
        ? '文字'
        : message.inputMethod === 'simulated-voice'
          ? '模拟语音'
          : '语音';

    return (
      <div className="flex justify-end">
        <div className="max-w-[84%] rounded-2xl rounded-br-md bg-slate-900 px-3.5 py-2.5 text-white shadow-xs dark:bg-emerald-600 dark:text-white">
          <p className="text-[14px] leading-relaxed">{message.text}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-300/80 dark:text-emerald-100/80">
            <InputBadgeIcon className="h-2.5 w-2.5" />
            <span>{inputLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  const showText = Boolean(message.transcriptVisible);
  const isNeural =
    playingSource === 'openai-tts' || playingSource === 'gemini-tts';

  return (
    <div className="flex items-start gap-2.5">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-xs ${personaGradient}`}
      >
        {personaInitials}
      </div>

      <div className="min-w-0 max-w-[84%] flex-1 rounded-2xl rounded-tl-md border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-700/80 dark:bg-slate-800">
        {/* Blind-Listening voice player bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              isPlaying || isLoading
                ? onStop()
                : onPlay(message.id, message.text, defaultRate, message.emotion)
            }
            className={`flex flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
              isPlaying || isLoading
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                isPlaying || isLoading
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'bg-slate-900 text-white dark:bg-slate-700'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              )}
            </span>

            {/* Equalizer bars */}
            <div className="flex h-5 items-center gap-[3px]" aria-hidden="true">
              {[0.5, 0.9, 0.65, 1, 0.55, 0.8, 0.45].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: `${Math.round(h * 18)}px`,
                    animationDelay: `${i * 110}ms`,
                  }}
                  className={`w-[3px] rounded-full transition-colors ${
                    isPlaying
                      ? 'animate-gs-wave bg-emerald-500 dark:bg-emerald-400'
                      : isLoading
                        ? 'animate-pulse bg-emerald-400/70'
                        : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <span className="ml-auto text-[11px] font-medium">
              {isLoading
                ? '合成真人语音...'
                : isPlaying
                  ? playingRate <= 0.82
                    ? isNeural
                      ? '0.8x 真人慢速'
                      : '0.8x 慢速播报'
                    : isNeural
                      ? '真人语音播报中'
                      : '正在播报...'
                  : '点击重听'}
            </span>
          </button>
        </div>

        {/* Transcript section: Blind-Listening First */}
        <div className="mt-2.5">
          {showText ? (
            <p className="text-[14px] leading-relaxed text-slate-800 dark:text-slate-100">
              {message.text}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onToggleTranscript(message.id)}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-left transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-emerald-700"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400">
                盲听训练中 · 先靠耳朵抓关键词
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Eye className="h-3.5 w-3.5" />
                看原文
              </span>
            </button>
          )}
        </div>

        {/* Action Strip: Slow replay + Toggle transcript + Emotion */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-700/70">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                (isPlaying || isLoading) && playingRate <= 0.82
                  ? onStop()
                  : onPlay(message.id, message.text, 0.8, message.emotion)
              }
              className={`inline-flex min-h-[28px] items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                (isPlaying || isLoading) && playingRate <= 0.82
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Gauge className="h-3 w-3" />
              0.8x 慢速
            </button>

            <button
              type="button"
              onClick={() => onToggleTranscript(message.id)}
              className="inline-flex min-h-[28px] items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700/70 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {showText ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  隐藏原文
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  显示原文
                </>
              )}
            </button>
          </div>

          {message.emotion && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              语气：{message.emotion}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
