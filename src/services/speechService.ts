import type {
  AccentCode,
  AppSettings,
  GeminiTtsVoice,
  OpenAiTtsVoice,
  TtsContextId,
  TtsPlaybackSource,
} from '../types';

// Minimal TypeScript declarations for Web Speech Recognition across Safari & Chrome
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: {
      readonly isFinal: boolean;
      readonly length: number;
      [altIndex: number]: {
        readonly transcript: string;
        readonly confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstanceLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((ev: Event) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    webkitAudioContext?: typeof AudioContext;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export interface VoicePresetOption<T extends string> {
  id: T;
  label: string;
  desc: string;
}

export const OPENAI_TTS_VOICES: VoicePresetOption<OpenAiTtsVoice>[] = [
  { id: 'coral', label: 'Coral', desc: '温暖自然 · 推荐女声' },
  { id: 'marin', label: 'Marin', desc: '清澈柔和 · 质感女声' },
  { id: 'cedar', label: 'Cedar', desc: '沉稳磁性 · 质感男声' },
  { id: 'nova', label: 'Nova', desc: '明快亲和 · 轻松对话' },
  { id: 'alloy', label: 'Alloy', desc: '均衡中性 · 清晰专业' },
  { id: 'ash', label: 'Ash', desc: '干练沉静 · 学术商务' },
  { id: 'sage', label: 'Sage', desc: '温和知性 · 娓娓道来' },
  { id: 'verse', label: 'Verse', desc: '表现力强 · 鲜活自然' },
];

export const GEMINI_TTS_VOICES: VoicePresetOption<GeminiTtsVoice>[] = [
  { id: 'Kore', label: 'Kore', desc: '清亮干练 · 推荐' },
  { id: 'Aoede', label: 'Aoede', desc: '柔和温暖 · 社交感强' },
  { id: 'Puck', label: 'Puck', desc: '轻松活泼 · 咖啡日常' },
  { id: 'Charon', label: 'Charon', desc: '沉稳低沉 · 学术临床' },
  { id: 'Fenrir', label: 'Fenrir', desc: '自信浑厚 · 商务出行' },
  { id: 'Zephyr', label: 'Zephyr', desc: '明快流畅 · 自然清晰' },
];

export interface DeviceEnvironment {
  isIOS: boolean;
  isSafari: boolean;
  isStandalonePWA: boolean;
  isSecureContext: boolean;
  hasTTS: boolean;
  hasSTT: boolean;
  canUseNativeMic: boolean;
  shouldShowIOSInstallGuide: boolean;
}

export function getDeviceEnvironment(): DeviceEnvironment {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isSafari: false,
      isStandalonePWA: false,
      isSecureContext: true,
      hasTTS: false,
      hasSTT: false,
      canUseNativeMic: false,
      shouldShowIOSInstallGuide: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Android/.test(ua);
  const isStandalonePWA =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  const isSecureContext = window.isSecureContext !== false;
  const hasTTS =
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  const hasSTT = Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
  const canUseNativeMic = hasSTT && isSecureContext;
  const shouldShowIOSInstallGuide = isIOS && !isStandalonePWA;

  return {
    isIOS,
    isSafari,
    isStandalonePWA,
    isSecureContext,
    hasTTS,
    hasSTT,
    canUseNativeMic,
    shouldShowIOSInstallGuide,
  };
}

// ============================================================================
// Persistent Audio Unlock & Playback State (Hardened for iPhone Safari)
// ============================================================================

// Valid 46-byte silent WAV data URI used to unlock HTMLAudioElement inside iOS tap gestures
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const MAX_AUDIO_CACHE_ENTRIES = 60;

interface CachedAudioEntry {
  blob: Blob;
  objectUrl: string;
  mimeType: string;
  source: Exclude<TtsPlaybackSource, 'browser-tts'>;
  generatedRate: number;
}

interface ExtendedAudioElement extends HTMLAudioElement {
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
}

const audioCache = new Map<string, CachedAudioEntry>();
const inFlightSyntheses = new Map<string, Promise<CachedAudioEntry>>();

let sharedAudioEl: ExtendedAudioElement | null = null;
let sharedAudioCtx: AudioContext | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
let activeAbortController: AbortController | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeWatchdog: number | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let browserTtsUnlocked = false;
let audioElUnlocked = false;
let playbackSeq = 0;
let activeRecognition: SpeechRecognitionInstanceLike | null = null;

function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    refreshVoices();
  });
}

function getOrCreateSharedAudioEl(): ExtendedAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!sharedAudioEl) {
    const el = new Audio() as ExtendedAudioElement;
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    sharedAudioEl = el;
  }
  return sharedAudioEl;
}

function getOrCreateSharedAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  return sharedAudioCtx;
}

/**
 * Must be invoked synchronously inside a user tap/click handler on iPhone Safari.
 * Unlocks Web AudioContext, the persistent HTMLAudioElement (for async neural TTS playback),
 * and native SpeechSynthesis (for offline browser fallback).
 */
export function unlockAudioForIOS(): void {
  if (typeof window === 'undefined') return;

  // 1. Unlock persistent AudioContext
  try {
    const ctx = getOrCreateSharedAudioCtx();
    if (ctx) {
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  } catch {
    // Non-fatal
  }

  // 2. Unlock persistent HTMLAudioElement so subsequent async fetch() + play() is allowed on iOS Safari
  try {
    const el = getOrCreateSharedAudioEl();
    if (el && !audioElUnlocked && el.paused) {
      el.muted = true;
      el.src = SILENT_WAV_DATA_URI;
      const playPromise = el.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            audioElUnlocked = true;
            if (el.src === SILENT_WAV_DATA_URI) {
              el.pause();
              el.muted = false;
            }
          })
          .catch(() => {
            el.muted = false;
          });
      }
    }
  } catch {
    // Non-fatal
  }

  // 3. Unlock native SpeechSynthesis for offline browser fallback
  if (!browserTtsUnlocked && 'speechSynthesis' in window) {
    try {
      refreshVoices();
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        const silent = new SpeechSynthesisUtterance(' ');
        silent.volume = 0;
        silent.rate = 10;
        window.speechSynthesis.speak(silent);
      }
      browserTtsUnlocked = true;
    } catch {
      // Non-fatal
    }
  }
}

// ============================================================================
// Neural TTS Helpers: Mode Resolution, Instructions, Caching & PCM->WAV
// ============================================================================

export function resolveEffectiveTtsSource(
  settings?: AppSettings
): TtsPlaybackSource {
  if (!settings || settings.ttsEnginePreference === 'browser') {
    return 'browser-tts';
  }
  if (settings.aiMode === 'openai' && settings.openaiApiKey.trim().length > 0) {
    return 'openai-tts';
  }
  if (settings.aiMode === 'gemini' && settings.geminiApiKey.trim().length > 0) {
    return 'gemini-tts';
  }
  return 'browser-tts';
}

export function getAudioCacheCount(): number {
  return audioCache.size;
}

export function clearAudioCache(): void {
  for (const entry of audioCache.values()) {
    try {
      URL.revokeObjectURL(entry.objectUrl);
    } catch {
      // Ignore
    }
  }
  audioCache.clear();
}

function getCachedEntry(key: string): CachedAudioEntry | undefined {
  const found = audioCache.get(key);
  if (!found) return undefined;
  // Refresh LRU order
  audioCache.delete(key);
  audioCache.set(key, found);
  return found;
}

function setCachedEntry(key: string, entry: CachedAudioEntry): void {
  if (audioCache.has(key)) {
    const old = audioCache.get(key);
    if (old && old.objectUrl !== entry.objectUrl) {
      URL.revokeObjectURL(old.objectUrl);
    }
    audioCache.delete(key);
  }
  audioCache.set(key, entry);

  while (audioCache.size > MAX_AUDIO_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = audioCache.get(oldestKey);
    if (oldest) {
      try {
        URL.revokeObjectURL(oldest.objectUrl);
      } catch {
        // Ignore
      }
    }
    audioCache.delete(oldestKey);
  }
}

const SCENARIO_VOICE_DIRECTIONS: Record<TtsContextId, string> = {
  dining:
    'Speak as a warm, upbeat specialty coffee barista in a lively European/Istanbul cafe. Use relaxed conversational rhythm, natural contractions, and friendly hospitality.',
  conference:
    'Speak as an articulate, collegial European medical researcher mingling over coffee at an international congress. Warm, engaging, natural peer-to-peer cadence without sounding scripted.',
  clinical:
    'Speak as a calm, confident, collaborative lead operating room nurse addressing a visiting surgeon. Clear, reassuring, concise, and professional with approachable warmth.',
  travel:
    'Speak as a polite, energetic European conference hotel concierge at a busy front desk. Crisp, helpful, slightly brisk natural cadence typical of real travel interactions.',
  phrasebook:
    'Speak as an encouraging native English communication coach demonstrating relaxed, authentic social phrasing with natural intonation and crystal-clear articulation.',
  feedback:
    'Speak as a warm native English communication coach modeling the upgraded idiomatic phrasing with effortless social ease and natural stress patterns.',
  preview:
    'Speak warmly and naturally as a refined international English conversation partner welcoming a physician.',
};

export function buildSpeechInstructions(params: {
  contextId?: TtsContextId;
  accent?: AccentCode;
  emotion?: string;
  rate?: number;
}): string {
  const {
    contextId = 'preview',
    accent = 'en-US',
    emotion,
    rate = 1,
  } = params;

  const baseDirection =
    SCENARIO_VOICE_DIRECTIONS[contextId] ?? SCENARIO_VOICE_DIRECTIONS.preview;
  const accentDirection =
    accent === 'en-GB'
      ? 'Use a natural, educated British/European English accent.'
      : 'Use a natural, warm General American English accent.';
  const emotionDirection = emotion
    ? `Subtle emotional nuance: ${emotion}.`
    : '';
  const paceDirection =
    rate <= 0.85
      ? 'Deliver at a slightly unhurried, clear pace suitable for shadowing practice while keeping natural prosody.'
      : rate >= 1.12
        ? 'Deliver at a lively, slightly brisk real-world conversational pace.'
        : 'Deliver at a natural everyday conversational speed.';

  return [baseDirection, accentDirection, emotionDirection, paceDirection]
    .filter(Boolean)
    .join(' ');
}

export function buildOpenAiSpeechUrl(rawBaseUrl: string): string {
  const trimmed = (rawBaseUrl.trim() || 'https://api.openai.com/v1')
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/audio\/speech$/i, '');

  if (/\/v\d+$/i.test(trimmed)) {
    return `${trimmed}/audio/speech`;
  }
  return `${trimmed}/v1/audio/speech`;
}

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Wraps headerless 16-bit signed little-endian PCM bytes (e.g. Gemini audio/L16;rate=24000)
 * into a standard RIFF/WAVE container playable natively in iPhone Safari & all modern browsers.
 */
export function wrapPcm16ToWavBytes(
  pcmBytes: Uint8Array,
  sampleRate = 24000,
  numChannels = 1
): Uint8Array {
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const wav = new Uint8Array(44 + pcmBytes.byteLength);
  const view = new DataView(wav.buffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.byteLength, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format chunk size
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(36, 'data');
  view.setUint32(40, pcmBytes.byteLength, true);
  wav.set(pcmBytes, 44);

  return wav;
}

async function fetchOpenAiNeuralAudio(
  text: string,
  settings: AppSettings,
  options: {
    contextId: TtsContextId;
    accent: AccentCode;
    emotion?: string;
    rate: number;
    signal: AbortSignal;
  }
): Promise<CachedAudioEntry> {
  const url = buildOpenAiSpeechUrl(settings.openaiBaseUrl);
  const apiKey = settings.openaiApiKey.trim();
  const model = settings.openaiTtsModel.trim() || 'gpt-4o-mini-tts';
  const voice = settings.openaiTtsVoice || 'coral';
  const clampedSpeed = Math.max(0.7, Math.min(1.3, Number(options.rate.toFixed(2))));
  const supportsInstructions = model.toLowerCase().includes('gpt-4o');
  const instructions = buildSpeechInstructions({
    contextId: options.contextId,
    accent: options.accent,
    emotion: options.emotion,
    rate: clampedSpeed,
  });

  const execute = async (includeInstructions: boolean) => {
    const payload: Record<string, unknown> = {
      model,
      voice,
      input: text,
      speed: clampedSpeed,
      response_format: 'mp3',
    };
    if (includeInstructions) {
      payload.instructions = instructions;
    }

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
  };

  let res = await execute(supportsInstructions);

  // Some OpenAI-compatible relays reject the newer `instructions` field with 400; retry once cleanly without it
  if (!res.ok && res.status === 400 && supportsInstructions) {
    res = await execute(false);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI TTS 错误 (${res.status}): ${errText.slice(0, 120)}`);
  }

  const rawBlob = await res.blob();
  if (rawBlob.size < 100) {
    throw new Error('OpenAI TTS 返回了空音频数据');
  }

  const mimeType =
    rawBlob.type && rawBlob.type.startsWith('audio/')
      ? rawBlob.type
      : 'audio/mpeg';
  const blob =
    rawBlob.type === mimeType ? rawBlob : new Blob([rawBlob], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  return {
    blob,
    objectUrl,
    mimeType,
    source: 'openai-tts',
    generatedRate: clampedSpeed,
  };
}

async function fetchGeminiNeuralAudio(
  text: string,
  settings: AppSettings,
  options: {
    contextId: TtsContextId;
    accent: AccentCode;
    emotion?: string;
    rate: number;
    signal: AbortSignal;
  }
): Promise<CachedAudioEntry> {
  const apiKey = settings.geminiApiKey.trim();
  const model = settings.geminiTtsModel.trim() || 'gemini-2.5-flash-preview-tts';
  const voiceName = settings.geminiTtsVoice || 'Kore';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const styleGuide = buildSpeechInstructions({
    contextId: options.contextId,
    accent: options.accent,
    emotion: options.emotion,
    rate: 1,
  });

  const promptText = `Read the following spoken English line aloud naturally (${styleGuide} Speak ONLY the exact line below without adding any extra words):\n${text}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini TTS 错误 (${res.status}): ${errText.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
          inline_data?: { mime_type?: string; data?: string };
        }>;
      };
    }>;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const audioPart = parts.find(
    (p) => Boolean(p.inlineData?.data) || Boolean(p.inline_data?.data)
  );
  const base64Data = audioPart?.inlineData?.data ?? audioPart?.inline_data?.data;
  const rawMime =
    audioPart?.inlineData?.mimeType ??
    audioPart?.inline_data?.mime_type ??
    'audio/L16;codec=pcm;rate=24000';

  if (!base64Data) {
    throw new Error('Gemini 响应中未包含音频数据');
  }

  const decodedBytes = decodeBase64ToUint8Array(base64Data);
  const lowerMime = rawMime.toLowerCase();

  let blob: Blob;
  let finalMime: string;

  if (lowerMime.includes('l16') || lowerMime.includes('pcm')) {
    const rateMatch = lowerMime.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? Number(rateMatch[1]) || 24000 : 24000;
    const wavBytes = wrapPcm16ToWavBytes(decodedBytes, sampleRate, 1);
    finalMime = 'audio/wav';
    blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: finalMime });
  } else {
    finalMime = rawMime;
    blob = new Blob([decodedBytes.buffer as ArrayBuffer], { type: finalMime });
  }

  const objectUrl = URL.createObjectURL(blob);

  return {
    blob,
    objectUrl,
    mimeType: finalMime,
    source: 'gemini-tts',
    generatedRate: 1,
  };
}

function buildCacheKey(
  source: Exclude<TtsPlaybackSource, 'browser-tts'>,
  settings: AppSettings,
  accent: AccentCode,
  contextId: TtsContextId,
  text: string
): string {
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  if (source === 'openai-tts') {
    return [
      'openai',
      settings.openaiTtsModel.trim() || 'gpt-4o-mini-tts',
      settings.openaiTtsVoice || 'coral',
      accent,
      contextId,
      normalizedText,
    ].join('|');
  }
  return [
    'gemini',
    settings.geminiTtsModel.trim() || 'gemini-2.5-flash-preview-tts',
    settings.geminiTtsVoice || 'Kore',
    accent,
    contextId,
    normalizedText,
  ].join('|');
}

async function getOrSynthesizeNeuralAudio(
  source: Exclude<TtsPlaybackSource, 'browser-tts'>,
  text: string,
  settings: AppSettings,
  options: {
    contextId: TtsContextId;
    accent: AccentCode;
    emotion?: string;
    rate: number;
    signal: AbortSignal;
  }
): Promise<CachedAudioEntry> {
  const key = buildCacheKey(source, settings, options.accent, options.contextId, text);

  // 1. Instant cache hit (0ms latency, $0 extra API cost even across 1.0x / 0.8x replays!)
  const cached = getCachedEntry(key);
  if (cached) {
    return cached;
  }

  // 2. Deduplicate concurrent taps on the same message
  const pending = inFlightSyntheses.get(key);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const entry =
      source === 'openai-tts'
        ? await fetchOpenAiNeuralAudio(text, settings, options)
        : await fetchGeminiNeuralAudio(text, settings, options);
    setCachedEntry(key, entry);
    return entry;
  })();

  inFlightSyntheses.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightSyntheses.delete(key);
  }
}

async function playNeuralBlob(
  entry: CachedAudioEntry,
  requestedRate: number,
  token: number,
  callbacks: {
    onStart?: (source: TtsPlaybackSource) => void;
    onEnd?: () => void;
  }
): Promise<void> {
  if (token !== playbackSeq) return;

  const effectiveRate = Math.max(
    0.55,
    Math.min(1.8, Number((requestedRate / entry.generatedRate).toFixed(2)))
  );

  // Primary path: persistent unlocked HTMLAudioElement (preserves pitch cleanly on Safari & Chrome)
  const el = getOrCreateSharedAudioEl();
  if (el) {
    try {
      el.pause();
      el.muted = false;
      el.volume = 1;
      el.src = entry.objectUrl;
      el.currentTime = 0;
      el.playbackRate = effectiveRate;
      el.preservesPitch = true;
      el.webkitPreservesPitch = true;
      el.mozPreservesPitch = true;

      let finished = false;
      const finishOnce = () => {
        if (finished) return;
        finished = true;
        if (activeWatchdog !== null) {
          globalThis.clearTimeout(activeWatchdog);
          activeWatchdog = null;
        }
        el.onended = null;
        el.onerror = null;
        if (token === playbackSeq) {
          callbacks.onEnd?.();
        }
      };

      el.onended = finishOnce;
      el.onerror = finishOnce;

      await el.play();
      if (token !== playbackSeq) {
        el.pause();
        return;
      }

      audioElUnlocked = true;
      // Re-apply playbackRate right after play() for iOS Safari reliability
      el.playbackRate = effectiveRate;
      callbacks.onStart?.(entry.source);

      // Watchdog prevents stuck UI if iOS interrupts audio via phone call/lock
      const safetyMs =
        Number.isFinite(el.duration) && el.duration > 0
          ? Math.ceil((el.duration / effectiveRate) * 1000) + 2500
          : 45000;
      activeWatchdog = globalThis.setTimeout(finishOnce, safetyMs);
      return;
    } catch {
      // Fall through to Web Audio API buffer playback (often still unlocked on iOS Safari!)
    }
  }

  // Secondary path: Web Audio API decodeAudioData + BufferSourceNode
  const ctx = getOrCreateSharedAudioCtx();
  if (!ctx) {
    throw new Error('音频播放器不可用');
  }

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const arrayBuffer = await entry.blob.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  if (token !== playbackSeq) return;

  const sourceNode = ctx.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.playbackRate.value = effectiveRate;
  sourceNode.connect(ctx.destination);

  activeBufferSource = sourceNode;
  sourceNode.onended = () => {
    if (activeBufferSource === sourceNode) {
      activeBufferSource = null;
    }
    if (token === playbackSeq) {
      callbacks.onEnd?.();
    }
  };

  callbacks.onStart?.(entry.source);
  sourceNode.start(0);
}

// ============================================================================
// Browser Native SpeechSynthesis Fallback (Offline / Zero-Cost)
// ============================================================================

const PREFERRED_VOICES: Record<AccentCode, string[]> = {
  'en-US': [
    'samantha',
    'ava',
    'allison',
    'nicky',
    'aaron',
    'alex',
    'google us english',
    'aria',
    'jenny',
  ],
  'en-GB': [
    'daniel',
    'serena',
    'martha',
    'arthur',
    'kate',
    'oliver',
    'google uk english female',
    'google uk english male',
    'libby',
  ],
};

function normalizeLang(lang: string): string {
  return lang.replace(/_/g, '-').toLowerCase();
}

export function pickBestVoice(accent: AccentCode): SpeechSynthesisVoice | null {
  const voices = refreshVoices();
  if (!voices.length) return null;

  const target = normalizeLang(accent);
  const preferredNames = PREFERRED_VOICES[accent];

  for (const nameHint of preferredNames) {
    const found = voices.find(
      (v) =>
        normalizeLang(v.lang).startsWith(target) &&
        v.name.toLowerCase().includes(nameHint)
    );
    if (found) return found;
  }

  const accentMatches = voices.filter((v) =>
    normalizeLang(v.lang).startsWith(target)
  );
  if (accentMatches.length > 0) {
    return accentMatches.find((v) => v.localService) ?? accentMatches[0];
  }

  const anyEnglish = voices.filter((v) =>
    normalizeLang(v.lang).startsWith('en')
  );
  if (anyEnglish.length > 0) {
    return anyEnglish.find((v) => v.localService) ?? anyEnglish[0];
  }

  return null;
}

function speakWithBrowserTts(
  text: string,
  options: {
    accent: AccentCode;
    rate: number;
    token: number;
    onStart?: (source: TtsPlaybackSource) => void;
    onEnd?: () => void;
    onError?: (reason: string) => void;
  }
): void {
  const { accent, rate, token, onStart, onEnd, onError } = options;
  if (token !== playbackSeq) return;

  if (typeof window === 'undefined') {
    onEnd?.();
    return;
  }

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    onStart?.('browser-tts');
    const simulatedMs = Math.min(3500, Math.max(1200, text.length * 40));
    activeWatchdog = globalThis.setTimeout(() => {
      activeWatchdog = null;
      if (token === playbackSeq) onEnd?.();
    }, simulatedMs);
    return;
  }

  const wasBusy = synth.speaking || synth.pending;

  const startUtterance = () => {
    if (token !== playbackSeq) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent;
      utterance.rate = Math.max(0.65, Math.min(1.3, rate));
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice = pickBestVoice(accent);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      let finished = false;
      const finishOnce = (isErr?: boolean, errMsg?: string) => {
        if (finished) return;
        finished = true;
        if (activeWatchdog !== null) {
          globalThis.clearTimeout(activeWatchdog);
          activeWatchdog = null;
        }
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        if (token !== playbackSeq) return;
        if (isErr && errMsg) {
          onError?.(errMsg);
        }
        onEnd?.();
      };

      utterance.onstart = () => {
        if (token === playbackSeq) onStart?.('browser-tts');
      };

      utterance.onend = () => {
        finishOnce(false);
      };

      utterance.onerror = (event) => {
        if (event.error === 'interrupted' || event.error === 'canceled') {
          finishOnce(false);
        } else {
          finishOnce(
            true,
            '语音播报未启动，请检查 iPhone 左侧静音拨片是否关闭，或点击气泡重新播放。'
          );
        }
      };

      activeUtterance = utterance;
      onStart?.('browser-tts');
      synth.speak(utterance);
      browserTtsUnlocked = true;

      const expectedMs = Math.max(6000, Math.round((text.length * 145) / rate));
      activeWatchdog = globalThis.setTimeout(() => {
        finishOnce(false);
      }, expectedMs);
    } catch {
      onError?.('当前设备语音合成受限，可点击「显示原文」继续练习。');
      onEnd?.();
    }
  };

  if (wasBusy) {
    try {
      synth.cancel();
    } catch {
      // Ignore
    }
    globalThis.setTimeout(startUtterance, 65);
  } else {
    startUtterance();
  }
}

// ============================================================================
// Public Unified Stop & Speak Entry Points
// ============================================================================

export function stopSpeaking(): void {
  playbackSeq += 1;

  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // Ignore
    }
    activeAbortController = null;
  }

  if (activeWatchdog !== null) {
    globalThis.clearTimeout(activeWatchdog);
    activeWatchdog = null;
  }

  if (sharedAudioEl) {
    try {
      sharedAudioEl.onended = null;
      sharedAudioEl.onerror = null;
      sharedAudioEl.pause();
    } catch {
      // Ignore
    }
  }

  if (activeBufferSource) {
    try {
      activeBufferSource.onended = null;
      activeBufferSource.stop();
    } catch {
      // Ignore
    }
    activeBufferSource = null;
  }

  activeUtterance = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export interface SpeakOptions {
  accent?: AccentCode;
  rate?: number;
  settings?: AppSettings;
  contextId?: TtsContextId;
  emotion?: string;
  onLoading?: () => void;
  onStart?: (source: TtsPlaybackSource) => void;
  onEnd?: () => void;
  onFallback?: (notice: string) => void;
  onError?: (reason: string) => void;
}

/**
 * Unified neural + browser fallback speech engine:
 * - Reuses API Key configured in Settings (OpenAI-compatible /v1/audio/speech or Gemini native TTS).
 * - Caches generated audio per message so replaying or switching 1.0x <-> 0.8x costs $0 extra.
 * - Smoothly falls back to browser SpeechSynthesis if offline, in demo mode, or on API error.
 */
export function speakText(text: string, options: SpeakOptions = {}): void {
  const {
    accent = options.settings?.defaultAccent ?? 'en-US',
    rate = options.settings?.defaultSpeed ?? 1,
    settings,
    contextId = 'preview',
    emotion,
    onLoading,
    onStart,
    onEnd,
    onFallback,
    onError,
  } = options;

  stopSpeaking();
  const token = playbackSeq;
  const effectiveSource = resolveEffectiveTtsSource(settings);

  // Offline / Demo / Browser-only mode -> stay synchronous inside tap gesture on iOS!
  if (effectiveSource === 'browser-tts' || !settings) {
    speakWithBrowserTts(text, {
      accent,
      rate,
      token,
      onStart,
      onEnd,
      onError,
    });
    return;
  }

  const controller = new AbortController();
  activeAbortController = controller;
  const fetchTimeout = globalThis.setTimeout(() => controller.abort(), 18000);

  // Check cache first: if already cached, skip loading spinner for instant playback!
  const cacheKey = buildCacheKey(effectiveSource, settings, accent, contextId, text);
  if (!audioCache.has(cacheKey)) {
    onLoading?.();
  }

  void (async () => {
    try {
      const entry = await getOrSynthesizeNeuralAudio(
        effectiveSource,
        text,
        settings,
        {
          contextId,
          accent,
          emotion,
          rate,
          signal: controller.signal,
        }
      );

      globalThis.clearTimeout(fetchTimeout);
      if (token !== playbackSeq) return;

      await playNeuralBlob(entry, rate, token, {
        onStart,
        onEnd,
      });
    } catch (err) {
      globalThis.clearTimeout(fetchTimeout);
      if (token !== playbackSeq) return;

      const reason =
        err instanceof DOMException && err.name === 'AbortError'
          ? '请求超时'
          : err instanceof Error
            ? err.message
            : '接口异常';

      onFallback?.(
        `真人语音暂时不可用（${reason}），已自动平滑切换浏览器离线语音播报。`
      );

      speakWithBrowserTts(text, {
        accent,
        rate,
        token,
        onStart,
        onEnd,
        onError,
      });
    } finally {
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    }
  })();
}

// ============================================================================
// Speech Recognition (STT) — iPhone Safari Hardened
// ============================================================================

export interface RecognitionCallbacks {
  lang?: AccentCode;
  onStart?: () => void;
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onError?: (friendlyMessage: string, errorCode: string) => void;
  onEnd?: () => void;
}

export function mapRecognitionError(errorCode: string, isIOS: boolean): string {
  switch (errorCode) {
    case 'not-allowed':
      return isIOS
        ? '未获取麦克风权限：请在 iPhone「设置 → Safari 浏览器 → 麦克风」设为允许，或直接切换下方「模拟语音 / 文字输入」。'
        : '麦克风权限被拒绝，请在浏览器地址栏允许麦克风访问，或切换「模拟语音 / 文字输入」。';
    case 'service-not-allowed':
      return isIOS
        ? 'iPhone 语音识别服务未开启：请前往「设置 → 通用 → 键盘 → 开启“启用听写”」，或直接使用「模拟语音 / 文字输入」。'
        : '浏览器语音识别服务不可用，已为您保留「模拟语音 / 文字输入」兜底。';
    case 'audio-capture':
      return '未检测到可用麦克风设备，请检查耳机/录音占用，或直接使用「模拟语音 / 文字输入」。';
    case 'no-speech':
      return '刚才没有检测到清晰的英语声音，可以靠近手机再试一次，或点击「模拟语音」体验。';
    case 'network':
      return '语音识别需要联网（Apple / Google 语音引擎），当前网络较慢，建议先用「模拟语音」或文字输入。';
    case 'insecure-context':
      return 'iPhone Safari 仅在 HTTPS（或本机 localhost）下开放麦克风权限；当前连接请先使用「模拟语音」或文字输入。';
    case 'unsupported':
      return '当前浏览器不支持原生实时语音识别，已自动为您准备「模拟语音」与文字输入。';
    default:
      return '语音识别中断，可重试或切换「模拟语音 / 文字输入」。';
  }
}

export function startSpeechRecognition(callbacks: RecognitionCallbacks): boolean {
  const env = getDeviceEnvironment();

  if (!env.isSecureContext) {
    callbacks.onError?.(
      mapRecognitionError('insecure-context', env.isIOS),
      'insecure-context'
    );
    return false;
  }

  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    callbacks.onError?.(
      mapRecognitionError('unsupported', env.isIOS),
      'unsupported'
    );
    return false;
  }

  // Stop AI TTS before opening mic so iOS audio session transitions cleanly
  stopSpeaking();
  stopSpeechRecognition(true);

  try {
    const recognition = new Ctor();
    recognition.lang = callbacks.lang ?? 'en-US';
    // CRITICAL for iOS Safari: continuous must be false to prevent instant service-not-allowed/abort
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalBuffer = '';
    let lastInterim = '';
    let emittedFinal = false;

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? '';
        if (res.isFinal) {
          finalBuffer = `${finalBuffer} ${text}`.trim();
        } else {
          interim = `${interim} ${text}`.trim();
        }
      }
      lastInterim = interim;
      const combined = `${finalBuffer} ${interim}`.trim();
      if (combined) {
        callbacks.onInterim?.(combined);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        return;
      }
      callbacks.onError?.(
        mapRecognitionError(event.error, env.isIOS),
        event.error
      );
    };

    recognition.onend = () => {
      if (activeRecognition === recognition) {
        activeRecognition = null;
      }
      const bestText = (finalBuffer || lastInterim).trim();
      if (bestText && !emittedFinal) {
        emittedFinal = true;
        callbacks.onFinal?.(bestText);
      }
      callbacks.onEnd?.();
    };

    activeRecognition = recognition;
    recognition.start();
    return true;
  } catch {
    callbacks.onError?.(
      mapRecognitionError('not-allowed', env.isIOS),
      'not-allowed'
    );
    return false;
  }
}

export function stopSpeechRecognition(abort = false): void {
  if (!activeRecognition) return;
  const instance = activeRecognition;
  activeRecognition = null;
  try {
    if (abort) {
      instance.abort();
    } else {
      instance.stop();
    }
  } catch {
    // Ignore stop errors if already ended
  }
}
