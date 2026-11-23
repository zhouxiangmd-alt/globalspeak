export type ScenarioId = 'dining' | 'conference' | 'clinical' | 'travel';

export type AccentCode = 'en-US' | 'en-GB';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AiEngineMode = 'demo' | 'gemini' | 'openai';

export type TtsEnginePreference = 'neural' | 'browser';

export type OpenAiTtsVoice =
  | 'coral'
  | 'marin'
  | 'cedar'
  | 'alloy'
  | 'nova'
  | 'ash'
  | 'sage'
  | 'verse';

export type GeminiTtsVoice =
  | 'Kore'
  | 'Aoede'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Zephyr';

export type TtsContextId = ScenarioId | 'phrasebook' | 'feedback' | 'preview';

export type TtsPlaybackSource = 'openai-tts' | 'gemini-tts' | 'browser-tts';

export type ActiveTab = 'hub' | 'phrasebook' | 'settings';

export interface HintSuggestion {
  zhIntent: string;
  enPhrase: string;
  naturalNote?: string;
}

export interface SimulatedVoiceOption {
  label: string;
  styleTag: 'stiff' | 'natural';
  text: string;
}

export interface ScenarioScriptTurn {
  aiLine: string;
  aiEmotion?: string;
  hints: [HintSuggestion, HintSuggestion];
  simulatedReplies: [SimulatedVoiceOption, SimulatedVoiceOption];
  /** Triggered when user's reply includes specific cues */
  branches?: Array<{
    keywords: string[];
    aiLine: string;
    aiEmotion?: string;
  }>;
}

export interface ScenarioConfig {
  id: ScenarioId;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  locationBadge: string;
  estimatedMinutes: number;
  targetTurns: number;
  primaryTag: string;
  focusSkills: string[];
  accentDefault: AccentCode;
  accentLabel: string;
  persona: {
    name: string;
    roleZh: string;
    roleEn: string;
    avatarInitials: string;
    avatarGradient: string;
    introNote: string;
  };
  systemPrompt: string;
  openingTurn: ScenarioScriptTurn;
  followUpTurns: ScenarioScriptTurn[];
  closingLine: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  emotion?: string;
  inputMethod?: 'voice' | 'simulated-voice' | 'text';
  transcriptVisible?: boolean;
}

export interface FeedbackItem {
  id: string;
  original: string;
  natural: string;
  /** Highlighted segment inside original to strike/mute */
  stiffSegment?: string;
  /** Highlighted upgraded segment inside natural to emphasize in emerald */
  upgradedSegment?: string;
  culturalTipZh: string;
  tag: string;
  scenarioTitle: string;
}

export interface SocialFeedbackReport {
  id: string;
  scenarioId: ScenarioId;
  scenarioTitleZh: string;
  createdAt: number;
  vibeTitle: string;
  vibeSummaryZh: string;
  relaxationScore: number; // 1-100, encouraging scale (72-96)
  engineUsed: AiEngineMode;
  items: FeedbackItem[];
}

export interface SavedPhrase {
  id: string;
  phrase: string;
  original?: string;
  culturalTipZh: string;
  tag: string;
  source: 'feedback' | 'custom' | 'starter';
  createdAt: number;
  favorite?: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultAccent: AccentCode;
  defaultSpeed: number;
  blindListenDefault: boolean;
  preferSimulatedVoice: boolean;
  aiMode: AiEngineMode;
  geminiApiKey: string;
  geminiModel: string;
  openaiBaseUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  ttsEnginePreference: TtsEnginePreference;
  openaiTtsModel: string;
  openaiTtsVoice: OpenAiTtsVoice;
  geminiTtsModel: string;
  geminiTtsVoice: GeminiTtsVoice;
}
