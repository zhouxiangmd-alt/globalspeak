import type {
  AppSettings,
  ChatMessage,
  FeedbackItem,
  HintSuggestion,
  ScenarioConfig,
  SimulatedVoiceOption,
  SocialFeedbackReport,
} from '../types';
import type { RoleplayTurnOutput } from './mockAiEngine';

interface LlmTurnJson {
  replyText: string;
  emotion?: string;
  hints?: Array<{ zhIntent: string; enPhrase: string; naturalNote?: string }>;
  shouldWrapUp?: boolean;
}

interface LlmFeedbackJson {
  vibeTitle?: string;
  vibeSummaryZh?: string;
  relaxationScore?: number;
  items?: Array<{
    original: string;
    natural: string;
    stiffSegment?: string;
    upgradedSegment?: string;
    culturalTipZh: string;
    tag?: string;
  }>;
}

function extractJsonBlock<T>(raw: string): T {
  const cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : cleaned;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const jsonText =
    firstBrace !== -1 && lastBrace !== -1
      ? candidate.slice(firstBrace, lastBrace + 1)
      : candidate;
  return JSON.parse(jsonText) as T;
}

async function callGeminiJson(
  settings: AppSettings,
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const apiKey = settings.geminiApiKey.trim();
  if (!apiKey) throw new Error('请先在设置中填写 Gemini API Key');

  const model = settings.geminiModel.trim() || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 22000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Gemini API 返回错误 (${res.status}): ${errBody.slice(0, 140)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini API 未返回有效文本内容');
    return text;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function callOpenAICompatibleJson(
  settings: AppSettings,
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const apiKey = settings.openaiApiKey.trim();
  if (!apiKey) throw new Error('请先在设置中填写 OpenAI 兼容 API Key');

  const baseUrl = (settings.openaiBaseUrl.trim() || 'https://api.openai.com/v1').replace(
    /\/+$/,
    ''
  );
  const model = settings.openaiModel.trim() || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 22000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`API 返回错误 (${res.status}): ${errBody.slice(0, 140)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('模型未返回有效文本内容');
    return text;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function runStructuredPrompt<T>(
  settings: AppSettings,
  systemInstruction: string,
  userPrompt: string
): Promise<T> {
  const raw =
    settings.aiMode === 'gemini'
      ? await callGeminiJson(settings, systemInstruction, userPrompt)
      : await callOpenAICompatibleJson(settings, systemInstruction, userPrompt);
  return extractJsonBlock<T>(raw);
}

export async function getLlmRoleplayReply(
  settings: AppSettings,
  scenario: ScenarioConfig,
  messages: ChatMessage[],
  completedUserTurns: number
): Promise<RoleplayTurnOutput> {
  const transcript = messages
    .map((m) => `${m.sender === 'ai' ? scenario.persona.name : 'Doctor (User)'}: ${m.text}`)
    .join('\n');

  const systemInstruction = `${scenario.systemPrompt}

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "replyText": "Your natural spoken English response in character (1-3 short sentences).",
  "emotion": "A 2-4 Chinese character tone tag (e.g. 热情推荐, 微笑追问, 愉快收尾).",
  "hints": [
    { "zhIntent": "Short Chinese idea 1 for how the user can reply next", "enPhrase": "Natural idiomatic English phrase 1", "naturalNote": "Brief 1-sentence Chinese tip" },
    { "zhIntent": "Short Chinese idea 2 (different angle)", "enPhrase": "Natural idiomatic English phrase 2", "naturalNote": "Brief 1-sentence Chinese tip" }
  ],
  "shouldWrapUp": ${completedUserTurns >= scenario.targetTurns ? 'true' : 'false'}
}`;

  const userPrompt = `Current user turn count: ${completedUserTurns} of ${scenario.targetTurns}.
Conversation so far:
${transcript}

Continue the roleplay naturally as ${scenario.persona.name}. If turn count >= ${scenario.targetTurns}, bring the mini-conversation to a warm, natural close.`;

  const parsed = await runStructuredPrompt<LlmTurnJson>(
    settings,
    systemInstruction,
    userPrompt
  );

  const fallbackTurn =
    scenario.followUpTurns[
      Math.min(completedUserTurns - 1, scenario.followUpTurns.length - 1)
    ] ?? scenario.openingTurn;

  const hints: [HintSuggestion, HintSuggestion] =
    parsed.hints && parsed.hints.length >= 2
      ? [parsed.hints[0], parsed.hints[1]]
      : fallbackTurn.hints;

  const simulatedReplies: [SimulatedVoiceOption, SimulatedVoiceOption] = [
    fallbackTurn.simulatedReplies[0],
    {
      label: '参考本轮推荐地道回应',
      styleTag: 'natural',
      text: hints[0].enPhrase,
    },
  ];

  return {
    aiText: parsed.replyText || scenario.closingLine,
    aiEmotion: parsed.emotion || '自然互动',
    nextHints: hints,
    nextSimulatedReplies: simulatedReplies,
    isReadyToWrapUp: Boolean(parsed.shouldWrapUp) || completedUserTurns >= scenario.targetTurns,
  };
}

export async function generateLlmFeedback(
  settings: AppSettings,
  scenario: ScenarioConfig,
  messages: ChatMessage[]
): Promise<SocialFeedbackReport> {
  const transcript = messages
    .map((m) => `${m.sender === 'ai' ? scenario.persona.name : 'Doctor (User)'}: ${m.text}`)
    .join('\n');

  const systemInstruction = `You are GlobalSpeak, an elite international communication & cultural nuance coach for non-native English-speaking physicians attending European/international conferences and surgical exchanges.
Analyze ONLY the Doctor (User)'s spoken lines in the conversation below. Focus on removing "Chinglish stiffness" and adding warmth, relaxation, and idiomatic polish—NOT pedantic grammar nitpicking.

Return ONLY valid JSON with this exact schema:
{
  "vibeTitle": "Encouraging Chinese headline (8-16 chars)",
  "vibeSummaryZh": "2 concise encouraging Chinese sentences summarizing strengths and 1 key nuance upgrade",
  "relaxationScore": 85,
  "items": [
    {
      "original": "Exact or lightly cleaned quote of what the user said",
      "natural": "More natural, relaxed native-speaker phrasing",
      "stiffSegment": "Exact short substring inside original that sounds stiff (optional)",
      "upgradedSegment": "Exact short substring inside natural that creates the idiomatic lift",
      "culturalTipZh": "1-2 concise Chinese sentences explaining the cultural/pragmatic nuance",
      "tag": "${scenario.primaryTag}"
    }
  ]
}
Provide 2 to 3 high-impact items.`;

  const userPrompt = `Scenario: ${scenario.titleZh} (${scenario.titleEn}) - ${scenario.locationBadge}
Transcript:
${transcript}`;

  const parsed = await runStructuredPrompt<LlmFeedbackJson>(
    settings,
    systemInstruction,
    userPrompt
  );

  const items: FeedbackItem[] = (parsed.items ?? []).slice(0, 4).map((it, idx) => ({
    id: `llm-fb-${Date.now()}-${idx}`,
    original: it.original,
    natural: it.natural,
    stiffSegment: it.stiffSegment,
    upgradedSegment: it.upgradedSegment,
    culturalTipZh: it.culturalTipZh,
    tag: it.tag || scenario.primaryTag,
    scenarioTitle: scenario.titleZh,
  }));

  if (items.length === 0) {
    throw new Error('大模型未返回有效的体检条目');
  }

  return {
    id: `report-${Date.now()}`,
    scenarioId: scenario.id,
    scenarioTitleZh: scenario.titleZh,
    createdAt: Date.now(),
    vibeTitle: parsed.vibeTitle || '沟通清晰流畅，微调语气更有松弛感',
    vibeSummaryZh:
      parsed.vibeSummaryZh ||
      '你的核心意思传达很准确，记住下面几句地道平替，下次在海外会场脱口而出更自然。',
    relaxationScore: Math.max(70, Math.min(98, Number(parsed.relaxationScore) || 86)),
    engineUsed: settings.aiMode,
    items,
  };
}
