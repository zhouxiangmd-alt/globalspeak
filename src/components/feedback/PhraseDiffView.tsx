import {
  Check,
  Gauge,
  Lightbulb,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react';
import type { FeedbackItem } from '../../types';

interface PhraseDiffViewProps {
  item: FeedbackItem;
  index: number;
  isSaved: boolean;
  isPlaying: boolean;
  playingRate: number;
  onSave: (item: FeedbackItem) => void;
  onPlay: (id: string, text: string, rate: 1 | 0.8) => void;
}

function renderHighlightedText(
  fullText: string,
  segment: string | undefined,
  highlightClass: string
) {
  if (!segment) return fullText;
  const idx = fullText.toLowerCase().indexOf(segment.toLowerCase());
  if (idx === -1) return fullText;

  const before = fullText.slice(0, idx);
  const match = fullText.slice(idx, idx + segment.length);
  const after = fullText.slice(idx + segment.length);

  return (
    <>
      {before}
      <span className={highlightClass}>{match}</span>
      {after}
    </>
  );
}

export function PhraseDiffView({
  item,
  index,
  isSaved,
  isPlaying,
  playingRate,
  onSave,
  onPlay,
}: PhraseDiffViewProps) {
  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/70">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700/80 dark:text-slate-300">
          体检项 #{index + 1} · {item.tag}
        </span>

        <button
          type="button"
          onClick={() => onSave(item)}
          disabled={isSaved}
          className={`inline-flex min-h-[30px] items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
            isSaved
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800'
              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              已存入金句本
            </>
          ) : (
            <>
              <Star className="h-3.5 w-3.5" />
              存入金句本
            </>
          )}
        </button>
      </div>

      {/* Original (Stiff) */}
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900/60">
        <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
          原文表达 · What you said
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {renderHighlightedText(
            item.original,
            item.stiffSegment,
            'rounded bg-rose-100/90 px-1 py-0.5 text-rose-800 line-through decoration-rose-400 dark:bg-rose-950/80 dark:text-rose-300'
          )}
        </p>
      </div>

      {/* Native Upgrade */}
      <div className="mt-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 px-3 py-2.5 dark:border-emerald-800/70 dark:bg-emerald-950/35">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
            <Sparkles className="h-3 w-3" />
            地道平替 · Native &amp; Relaxed
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPlay(item.id, item.natural, 1)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                isPlaying && playingRate >= 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/90 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-800'
              }`}
            >
              <Volume2 className="h-3 w-3" />
              朗读
            </button>
            <button
              type="button"
              onClick={() => onPlay(item.id, item.natural, 0.8)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                isPlaying && playingRate < 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/90 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-800'
              }`}
            >
              <Gauge className="h-3 w-3" />
              0.8x
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-[14px] font-semibold leading-relaxed text-slate-900 dark:text-white">
          {renderHighlightedText(
            item.natural,
            item.upgradedSegment,
            'rounded bg-emerald-200/80 px-1 py-0.5 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-200'
          )}
        </p>
      </div>

      {/* Cultural Nuance Tip */}
      <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-50/75 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/30 dark:text-amber-200">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          <span className="font-semibold">文化潜台词：</span>
          {item.culturalTipZh}
        </p>
      </div>
    </article>
  );
}
