import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddPhraseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    phrase: string;
    original?: string;
    culturalTipZh: string;
    tag: string;
  }) => void;
}

const TAG_OPTIONS = ['#Coffee', '#SmallTalk', '#Clinical', '#Travel', '#自建'];

export function AddPhraseModal({ open, onClose, onAdd }: AddPhraseModalProps) {
  const [phrase, setPhrase] = useState('');
  const [original, setOriginal] = useState('');
  const [tip, setTip] = useState('');
  const [tag, setTag] = useState('#自建');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim()) return;
    onAdd({
      phrase,
      original,
      culturalTipZh: tip,
      tag,
    });
    setPhrase('');
    setOriginal('');
    setTip('');
    setTag('#自建');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="新增自建金句"
    >
      <div className="pb-safe w-full max-w-[430px] rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              新增私人金句
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              随手记下在会议、文献或海外交流中听到的好句子
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              地道英文表达 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="例如：Could we walk through that slide one more time?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              原本可能直译的说法（选填）
            </label>
            <input
              type="text"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="例如：Please explain this PPT again."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              语境 / 文化潜台词笔记（选填）
            </label>
            <input
              type="text"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="例如：学术提问时用 walk through 更显温和专业"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              场景标签
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    tag === t
                      ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!phrase.trim()}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-emerald-500 dark:text-slate-950"
          >
            <Plus className="h-4 w-4" />
            保存到私人金句本
          </button>
        </form>
      </div>
    </div>
  );
}
