import { useCallback, useEffect, useState } from 'react';
import { loadPhrasebook, savePhrasebook } from '../services/storageService';
import type { FeedbackItem, SavedPhrase } from '../types';

export function usePhrasebook() {
  const [phrases, setPhrases] = useState<SavedPhrase[]>(() => loadPhrasebook());

  useEffect(() => {
    savePhrasebook(phrases);
  }, [phrases]);

  const isPhraseSaved = useCallback(
    (phraseText: string) => {
      const normalized = phraseText.trim().toLowerCase();
      return phrases.some((p) => p.phrase.trim().toLowerCase() === normalized);
    },
    [phrases]
  );

  const saveFromFeedback = useCallback((item: FeedbackItem): boolean => {
    let added = false;
    setPhrases((prev) => {
      const exists = prev.some(
        (p) => p.phrase.trim().toLowerCase() === item.natural.trim().toLowerCase()
      );
      if (exists) return prev;
      added = true;
      const next: SavedPhrase = {
        id: `phrase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phrase: item.natural.trim(),
        original: item.original.trim(),
        culturalTipZh: item.culturalTipZh.trim(),
        tag: item.tag || '#SmallTalk',
        source: 'feedback',
        createdAt: Date.now(),
        favorite: false,
      };
      return [next, ...prev];
    });
    return added;
  }, []);

  const addCustomPhrase = useCallback(
    (input: {
      phrase: string;
      original?: string;
      culturalTipZh: string;
      tag: string;
    }) => {
      const entry: SavedPhrase = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phrase: input.phrase.trim(),
        original: input.original?.trim() || undefined,
        culturalTipZh:
          input.culturalTipZh.trim() || '自建高频实用金句，建议睡前或候机时 0.8x 慢速跟读。',
        tag: input.tag || '#自建',
        source: 'custom',
        createdAt: Date.now(),
        favorite: false,
      };
      setPhrases((prev) => [entry, ...prev]);
    },
    []
  );

  const toggleFavorite = useCallback((id: string) => {
    setPhrases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
  }, []);

  const deletePhrase = useCallback((id: string) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    phrases,
    isPhraseSaved,
    saveFromFeedback,
    addCustomPhrase,
    toggleFavorite,
    deletePhrase,
  };
}
