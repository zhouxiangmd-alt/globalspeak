import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  requestRoleplayReply,
  requestSocialFeedback,
} from '../../services/aiService';
import {
  resolveEffectiveTtsSource,
  speakText,
  stopSpeaking,
  stopSpeechRecognition,
  unlockAudioForIOS,
} from '../../services/speechService';
import type {
  AccentCode,
  AppSettings,
  ChatMessage,
  HintSuggestion,
  ScenarioConfig,
  SimulatedVoiceOption,
  SocialFeedbackReport,
  TtsPlaybackSource,
} from '../../types';
import { HintPopover } from './HintPopover';
import { MessageBubble } from './MessageBubble';
import { VoiceComposer } from './VoiceComposer';

interface RoleplaySandboxProps {
  scenario: ScenarioConfig;
  settings: AppSettings;
  onExit: () => void;
  onFeedbackReady: (report: SocialFeedbackReport, notice?: string) => void;
  onOpenMicHelp: () => void;
}

export function RoleplaySandbox({
  scenario,
  settings,
  onExit,
  onFeedbackReady,
  onOpenMicHelp,
}: RoleplaySandboxProps) {
  const [accent, setAccent] = useState<AccentCode>(
    scenario.accentDefault ?? settings.defaultAccent
  );
  const [blindMode, setBlindMode] = useState<boolean>(
    settings.blindListenDefault
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: `ai-open-${Date.now()}`,
      sender: 'ai',
      text: scenario.openingTurn.aiLine,
      emotion: scenario.openingTurn.aiEmotion,
      timestamp: Date.now(),
      transcriptVisible: !settings.blindListenDefault,
    },
  ]);

  const [currentHints, setCurrentHints] = useState<
    [HintSuggestion, HintSuggestion]
  >(scenario.openingTurn.hints);
  const [currentSimReplies, setCurrentSimReplies] = useState<
    [SimulatedVoiceOption, SimulatedVoiceOption]
  >(scenario.openingTurn.simulatedReplies);

  const [hintOpen, setHintOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isReadyToWrapUp, setIsReadyToWrapUp] = useState(false);

  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playingRate, setPlayingRate] = useState<number>(settings.defaultSpeed);
  const [playingSource, setPlayingSource] = useState<TtsPlaybackSource | null>(
    null
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const userTurnCount = messages.filter((m) => m.sender === 'user').length;
  const effectiveTtsSource = resolveEffectiveTtsSource(settings);

  const playMessageAudio = (
    messageId: string,
    text: string,
    rate: number,
    emotion?: string
  ) => {
    unlockAudioForIOS();
    setPlayingRate(rate);
    speakText(text, {
      accent,
      rate,
      settings,
      contextId: scenario.id,
      emotion,
      onLoading: () => {
        setPlayingMessageId(null);
        setLoadingMessageId(messageId);
      },
      onStart: (source) => {
        setLoadingMessageId((curr) => (curr === messageId ? null : curr));
        setPlayingMessageId(messageId);
        setPlayingSource(source);
      },
      onEnd: () => {
        setLoadingMessageId((curr) => (curr === messageId ? null : curr));
        setPlayingMessageId((curr) => (curr === messageId ? null : curr));
      },
      onFallback: (notice) => setStatusNotice(notice),
      onError: (reason) => setStatusNotice(reason),
    });
  };

  // Auto-speak the opening AI turn (Blind-Listening First!)
  useEffect(() => {
    const firstMsg = messages[0];
    if (firstMsg && firstMsg.sender === 'ai') {
      const timer = window.setTimeout(() => {
        playMessageAudio(
          firstMsg.id,
          firstMsg.text,
          settings.defaultSpeed,
          firstMsg.emotion
        );
      }, 120);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup audio & mic on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopSpeechRecognition(true);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isAiThinking, isReadyToWrapUp]);

  const handleToggleGlobalBlindMode = () => {
    const nextBlind = !blindMode;
    setBlindMode(nextBlind);
    setMessages((prev) =>
      prev.map((m) =>
        m.sender === 'ai' ? { ...m, transcriptVisible: !nextBlind } : m
      )
    );
  };

  const handleToggleSingleTranscript = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, transcriptVisible: !m.transcriptVisible }
          : m
      )
    );
  };

  const handleUserSubmit = async (
    text: string,
    method: 'voice' | 'simulated-voice' | 'text'
  ) => {
    if (isAiThinking || isGeneratingFeedback) return;
    // Re-unlock iPhone Safari audio inside the user's send/speak interaction so the async AI reply plays cleanly
    unlockAudioForIOS();
    stopSpeaking();
    setLoadingMessageId(null);
    setPlayingMessageId(null);
    setHintOpen(false);
    setStatusNotice(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
      inputMethod: method,
    };

    const updatedMessages = [...messages, userMsg];
    const nextTurnCount = userTurnCount + 1;
    setMessages(updatedMessages);
    setIsAiThinking(true);

    try {
      const result = await requestRoleplayReply(
        settings,
        scenario,
        updatedMessages,
        text,
        nextTurnCount
      );

      if (result.fallbackNotice) {
        setStatusNotice(result.fallbackNotice);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.data.aiText,
        emotion: result.data.aiEmotion,
        timestamp: Date.now(),
        transcriptVisible: !blindMode,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentHints(result.data.nextHints);
      setCurrentSimReplies(result.data.nextSimulatedReplies);
      if (result.data.isReadyToWrapUp) {
        setIsReadyToWrapUp(true);
      }

      // Speak AI reply automatically for blind-listening immersion
      playMessageAudio(
        aiMsg.id,
        aiMsg.text,
        settings.defaultSpeed,
        aiMsg.emotion
      );
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleFinishSession = async () => {
    if (isGeneratingFeedback) return;
    stopSpeaking();
    stopSpeechRecognition(true);
    setLoadingMessageId(null);
    setPlayingMessageId(null);
    setIsGeneratingFeedback(true);

    try {
      const result = await requestSocialFeedback(settings, scenario, messages);
      onFeedbackReady(result.data, result.fallbackNotice);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const progressPct = Math.min(
    100,
    Math.round((userTurnCount / scenario.targetTurns) * 100)
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Top Sandbox Header */}
      <header className="pt-safe shrink-0 border-b border-slate-200/90 bg-white/95 px-3 pb-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-2 pt-2.5">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              stopSpeechRecognition(true);
              onExit();
            }}
            aria-label="返回场景大厅"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {scenario.persona.name}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setAccent((prev) => (prev === 'en-US' ? 'en-GB' : 'en-US'))
                }
                className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                title="点击切换美音/英音"
              >
                {accent === 'en-US' ? '美音 US' : '英音 UK'}
              </button>
              {effectiveTtsSource !== 'browser-tts' && (
                <span className="hidden shrink-0 items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-flex dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  真人声线
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {scenario.persona.roleZh} · {scenario.titleZh}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleGlobalBlindMode}
              title={
                blindMode
                  ? '当前盲听优先，点击全局显示原文'
                  : '点击切回盲听模式'
              }
              className={`flex h-9 items-center gap-1 rounded-xl px-2.5 text-[11px] font-semibold transition ${
                blindMode
                  ? 'bg-slate-900 text-emerald-400 dark:bg-slate-800 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {blindMode ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  盲听
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  原文
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleFinishSession}
              disabled={isGeneratingFeedback}
              className="inline-flex h-9 items-center gap-1 rounded-xl bg-emerald-600 px-2.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950"
            >
              {isGeneratingFeedback ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ClipboardCheck className="h-3.5 w-3.5" />
              )}
              体检
            </button>
          </div>
        </div>

        {/* Turn Progress Bar */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.max(12, progressPct)}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            第 {Math.min(userTurnCount, scenario.targetTurns)} /{' '}
            {scenario.targetTurns} 轮
          </span>
        </div>
      </header>

      {/* Scrollable Chat Stream */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-3.5 py-3.5">
        {/* Scenario Context Card */}
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            场景设定 · {scenario.locationBadge}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {scenario.persona.introNote}
          </p>
        </div>

        {/* Optional Status Notice */}
        {statusNotice && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-slate-200/70 px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="shrink-0 font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400"
            >
              关闭
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-3.5">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              personaInitials={scenario.persona.avatarInitials}
              personaGradient={scenario.persona.avatarGradient}
              isLoading={loadingMessageId === msg.id}
              isPlaying={playingMessageId === msg.id}
              playingRate={playingRate}
              playingSource={playingMessageId === msg.id ? playingSource : null}
              defaultRate={settings.defaultSpeed}
              onPlay={playMessageAudio}
              onStop={() => {
                stopSpeaking();
                setLoadingMessageId(null);
                setPlayingMessageId(null);
              }}
              onToggleTranscript={handleToggleSingleTranscript}
            />
          ))}

          {/* AI Typing Indicator */}
          {isAiThinking && (
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${scenario.persona.avatarGradient}`}
              >
                {scenario.persona.avatarInitials}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <Volume2 className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
                <span>{scenario.persona.name} 正在回应...</span>
              </div>
            </div>
          )}

          {/* Session Completed Wrap-up Card */}
          {isReadyToWrapUp && !isAiThinking && (
            <div className="mt-4 rounded-2xl border border-emerald-300/90 bg-emerald-50/90 p-4 text-center shadow-xs dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-sm font-bold text-emerald-950 dark:text-emerald-200">
                本局实战对练已达标！
              </h3>
              <p className="mt-1 text-xs text-emerald-800/85 dark:text-emerald-300/85">
                立即生成「去僵硬」社交体检卡，查看地道平替与文化潜台词点拨。
              </p>
              <button
                type="button"
                onClick={handleFinishSession}
                disabled={isGeneratingFeedback}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950"
              >
                {isGeneratingFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在分析你的社交语感...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4" />
                    生成「去僵硬」社交体检卡
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div ref={scrollEndRef} className="h-3" />
      </div>

      {/* Hint / Lifebuoy Popover */}
      <HintPopover
        open={hintOpen}
        hints={currentHints}
        onClose={() => setHintOpen(false)}
        onPreviewAudio={(phrase) => {
          unlockAudioForIOS();
          speakText(phrase, {
            accent,
            rate: Math.min(1, settings.defaultSpeed),
            settings,
            contextId: 'phrasebook',
            onFallback: (notice) => setStatusNotice(notice),
          });
        }}
        onUsePhrase={(phrase) => {
          setDraftText(phrase);
          setHintOpen(false);
        }}
      />

      {/* Voice + Text + Simulated Voice Composer */}
      <VoiceComposer
        disabled={isAiThinking || isGeneratingFeedback}
        accent={accent}
        preferSimulatedVoice={settings.preferSimulatedVoice}
        hintOpen={hintOpen}
        onToggleHint={() => setHintOpen((o) => !o)}
        draftText={draftText}
        onDraftChange={setDraftText}
        simulatedReplies={currentSimReplies}
        onSubmit={handleUserSubmit}
        onOpenMicHelp={onOpenMicHelp}
      />
    </div>
  );
}
