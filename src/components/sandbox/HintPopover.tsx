import { LifeBuoy, Send, Volume2, X } from 'lucide-react';
import type { HintSuggestion } from '../../types';

interface HintPopoverProps {
  open: boolean;
  hints: [HintSuggestion, HintSuggestion];
  onClose: () => void;
  onPreviewAudio: (phrase: string) => void;
  onUsePhrase: (phrase: string) => void;
}

export function HintPopover({
  open,
  hints,
  onClose,
  onPreviewAudio,
  onUsePhrase,
}: HintPopoverProps) {
  if (!open) return null;

  return (
    <div className="mx-3 mb-2 rounded-2xl border border-amber-200/90 bg-amber-50/95 p-3 shadow-lg shadow-slate-900/10 backdrop-blur-md dark:border-amber-800/70 dark:bg-slate-800/95">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
          <LifeBuoy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          救生圈 · 偷看地道灵感（2 条思路）
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭灵感"
          className="flex h-6 w-6 items-center justify-center rounded-full text-amber-800/70 hover:bg-amber-200/60 dark:text-amber-300/70 dark:hover:bg-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 space-y-2">
        {hints.map((hint, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white/95 p-2.5 ring-1 ring-amber-200/70 dark:bg-slate-900/80 dark:ring-slate-700"
          >
            <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
              思路 {idx + 1}：{hint.zhIntent}
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-snug text-slate-900 dark:text-white">
              “{hint.enPhrase}”
            </p>
            {hint.naturalNote && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {hint.naturalNote}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPreviewAudio(hint.enPhrase)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Volume2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                先听发音
              </button>
              <button
                type="button"
                onClick={() => onUsePhrase(hint.enPhrase)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
              >
                <Send className="h-3 w-3" />
                填入输入框
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
