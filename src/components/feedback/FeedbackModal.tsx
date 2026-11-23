import { useEffect, useState } from 'react';
import {
  BookmarkCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  speakText,
  stopSpeaking,
  unlockAudioForIOS,
} from '../../services/speechService';
import type {
  AccentCode,
  AppSettings,
  FeedbackItem,
  SocialFeedbackReport,
} from '../../types';
import { PhraseDiffView } from './PhraseDiffView';

interface FeedbackModalProps {
  report: SocialFeedbackReport | null;
  fallbackNotice?: string | null;
  settings: AppSettings;
  isPhraseSaved: (phrase: string) => boolean;
  onSavePhrase: (item: FeedbackItem) => void;
  onClose: () => void;
  onReplayScenario: () => void;
  onGoPhrasebook: () => void;
}

export function FeedbackModal({
  report,
  fallbackNotice,
  settings,
  isPhraseSaved,
  onSavePhrase,
  onClose,
  onReplayScenario,
  onGoPhrasebook,
}: FeedbackModalProps) {
  const [accent, setAccent] = useState<AccentCode>(settings.defaultAccent);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingRate, setPlayingRate] = useState<number>(settings.defaultSpeed);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);

  useEffect(() => {
    setAccent(settings.defaultAccent);
  }, [settings.defaultAccent]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  if (!report) return null;

  const handlePlay = (id: string, text: string, rate: 1 | 0.8) => {
    unlockAudioForIOS();
    setTtsNotice(null);
    if (playingId === id && playingRate === rate) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }
    const targetRate = rate === 1 ? settings.defaultSpeed : 0.8;
    setPlayingRate(rate);
    speakText(text, {
      accent,
      rate: targetRate,
      settings,
      contextId: 'feedback',
      onLoading: () => setPlayingId(id),
      onStart: () => setPlayingId(id),
      onEnd: () => setPlayingId((curr) => (curr === id ? null : curr)),
      onFallback: (notice) => setTtsNotice(notice),
    });
  };

  const combinedNotice = ttsNotice ?? fallbackNotice;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="社交体检复盘卡"
    >
      <div className="flex h-[94dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:h-[88dvh] sm:rounded-3xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
        {/* Top Modal Header */}
        <header className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  “去僵硬”社交体检卡
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {report.scenarioTitleZh} ·{' '}
                  {report.engineUsed === 'demo' ? '本地语感诊断' : 'AI 深度复盘'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setAccent((a) => (a === 'en-US' ? 'en-GB' : 'en-US'))
                }
                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {accent === 'en-US' ? '🇺🇸 美音' : '🇬🇧 英音'}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  onClose();
                }}
                aria-label="关闭体检卡"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
          {combinedNotice && (
            <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/70">
              {combinedNotice}
            </div>
          )}

          {/* Vibe Overview Banner */}
          <section className="mb-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                松弛度指数 {report.relaxationScore}
              </span>
              <span className="text-[11px] text-slate-300">
                提炼 {report.items.length} 条高价值平替
              </span>
            </div>
            <h3 className="mt-2.5 text-base font-bold">{report.vibeTitle}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {report.vibeSummaryZh}
            </p>
          </section>

          {/* Diff Cards */}
          <div className="space-y-3">
            {report.items.map((item, idx) => (
              <PhraseDiffView
                key={item.id}
                item={item}
                index={idx}
                isSaved={isPhraseSaved(item.natural)}
                isPlaying={playingId === item.id}
                playingRate={playingRate}
                onSave={onSavePhrase}
                onPlay={handlePlay}
              />
            ))}
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <footer className="pb-safe shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onReplayScenario();
              }}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              再来一局巩固
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onGoPhrasebook();
              }}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-emerald-500 dark:text-slate-950"
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              去金句本磨耳朵
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
