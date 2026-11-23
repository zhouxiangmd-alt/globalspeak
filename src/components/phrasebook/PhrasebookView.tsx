import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Gauge,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Volume2,
} from 'lucide-react';
import { PHRASE_TAGS } from '../../data/starterPhrases';
import {
  resolveEffectiveTtsSource,
  speakText,
  stopSpeaking,
  unlockAudioForIOS,
} from '../../services/speechService';
import type { AccentCode, AppSettings, SavedPhrase } from '../../types';
import { AddPhraseModal } from './AddPhraseModal';

interface PhrasebookViewProps {
  phrases: SavedPhrase[];
  settings: AppSettings;
  onAddCustom: (input: {
    phrase: string;
    original?: string;
    culturalTipZh: string;
    tag: string;
  }) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PhrasebookView({
  phrases,
  settings,
  onAddCustom,
  onToggleFavorite,
  onDelete,
}: PhrasebookViewProps) {
  const [accent, setAccent] = useState<AccentCode>(settings.defaultAccent);
  const [selectedTag, setSelectedTag] = useState<string>('#全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingMode, setPlayingMode] = useState<'normal' | 'slow'>('normal');
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const effectiveTtsSource = resolveEffectiveTtsSource(settings);

  useEffect(() => {
    setAccent(settings.defaultAccent);
  }, [settings.defaultAccent]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return phrases
      .filter((p) => {
        if (selectedTag !== '#全部' && p.tag !== selectedTag) return false;
        if (!q) return true;
        return (
          p.phrase.toLowerCase().includes(q) ||
          p.culturalTipZh.toLowerCase().includes(q) ||
          (p.original ?? '').toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
  }, [phrases, selectedTag, searchQuery]);

  const handlePlay = (id: string, text: string, mode: 'normal' | 'slow') => {
    unlockAudioForIOS();
    setTtsNotice(null);
    if ((playingId === id || loadingId === id) && playingMode === mode) {
      stopSpeaking();
      setLoadingId(null);
      setPlayingId(null);
      return;
    }
    const targetRate = mode === 'slow' ? 0.8 : settings.defaultSpeed;
    setPlayingMode(mode);
    speakText(text, {
      accent,
      rate: targetRate,
      settings,
      contextId: 'phrasebook',
      onLoading: () => {
        setPlayingId(null);
        setLoadingId(id);
      },
      onStart: () => {
        setLoadingId((curr) => (curr === id ? null : curr));
        setPlayingId(id);
      },
      onEnd: () => {
        setLoadingId((curr) => (curr === id ? null : curr));
        setPlayingId((curr) => (curr === id ? null : curr));
      },
      onFallback: (notice) => setTtsNotice(notice),
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="pt-safe shrink-0 border-b border-slate-200/80 bg-white/95 px-4 pb-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center justify-between pt-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                私人金句本
              </h1>
              {effectiveTtsSource !== 'browser-tts' && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  真人语音
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              共 {phrases.length} 句 · 重复朗读/慢速切换自动命中缓存免扣费
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 dark:bg-emerald-500 dark:text-slate-950"
          >
            <Plus className="h-3.5 w-3.5" />
            自建金句
          </button>
        </div>

        {/* Accent Toggle + Search Row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索英文金句或语境..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* US / UK Accent Segmented Control */}
          <div
            className="inline-flex shrink-0 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800"
            role="group"
            aria-label="切换朗读口音"
          >
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setLoadingId(null);
                setPlayingId(null);
                setAccent('en-US');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                accent === 'en-US'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              🇺🇸 美音
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setLoadingId(null);
                setPlayingId(null);
                setAccent('en-GB');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                accent === 'en-GB'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              🇬🇧 英音
            </button>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {PHRASE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      {/* Phrase Cards List */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain px-4 pt-3.5 pb-6">
        {ttsNotice && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/70">
            <span>{ttsNotice}</span>
            <button
              type="button"
              onClick={() => setTtsNotice(null)}
              className="shrink-0 font-semibold underline"
            >
              关闭
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-800/30">
            <Bookmark className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              当前分类下还没有金句
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              完成对练后可一键收录，或点击右上角手动记一句。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const isCardLoading = loadingId === item.id;
              const isCardPlaying = playingId === item.id;
              const sourceLabel =
                item.source === 'feedback'
                  ? '复盘收录'
                  : item.source === 'custom'
                    ? '自建笔记'
                    : '精选示范';
              const normalRateLabel = `${settings.defaultSpeed.toFixed(
                settings.defaultSpeed % 1 === 0 ? 1 : 2
              )}x`;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {item.tag}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {sourceLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={item.favorite ? '取消置顶收藏' : '置顶星标'}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          item.favorite
                            ? 'text-amber-500'
                            : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        aria-label="删除此金句"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Native Phrase */}
                  <p className="mt-2.5 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
                    {item.phrase}
                  </p>

                  {/* Optional Stiff Original */}
                  {item.original && (
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      替代直译：
                      <span className="line-through decoration-rose-400/70">
                        {item.original}
                      </span>
                    </p>
                  )}

                  {/* Cultural Nuance Note */}
                  <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{item.culturalTipZh}</span>
                  </div>

                  {/* Audio Controls: Normal & Slow 0.8x */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlay(item.id, item.phrase, 'normal')}
                      className={`inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${
                        (isCardPlaying || isCardLoading) &&
                        playingMode === 'normal'
                          ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                      }`}
                    >
                      {isCardLoading && playingMode === 'normal' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          合成真人语音...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          {isCardPlaying && playingMode === 'normal'
                            ? '正在朗读...'
                            : `朗读 ${normalRateLabel} (${accent === 'en-US' ? '美音' : '英音'})`}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlay(item.id, item.phrase, 'slow')}
                      className={`inline-flex min-h-[34px] items-center justify-center gap-1 rounded-xl px-3.5 text-xs font-semibold transition active:scale-[0.98] ${
                        (isCardPlaying || isCardLoading) &&
                        playingMode === 'slow'
                          ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-slate-950'
                          : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/70'
                      }`}
                    >
                      {isCardLoading && playingMode === 'slow' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Gauge className="h-3.5 w-3.5" />
                      )}
                      0.8x 慢速跟读
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <AddPhraseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddCustom}
      />
    </div>
  );
}
