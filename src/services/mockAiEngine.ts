import type {
  ChatMessage,
  FeedbackItem,
  HintSuggestion,
  ScenarioConfig,
  SimulatedVoiceOption,
  SocialFeedbackReport,
} from '../types';

export interface RoleplayTurnOutput {
  aiText: string;
  aiEmotion?: string;
  nextHints: [HintSuggestion, HintSuggestion];
  nextSimulatedReplies: [SimulatedVoiceOption, SimulatedVoiceOption];
  isReadyToWrapUp: boolean;
}

export async function getDemoRoleplayReply(
  scenario: ScenarioConfig,
  userText: string,
  completedUserTurns: number
): Promise<RoleplayTurnOutput> {
  // Natural brief pause so the conversation feels human and responsive
  await new Promise((r) => setTimeout(r, 420));

  const lower = userText.toLowerCase();
  const nextIndex = completedUserTurns - 1; // 1st user msg -> followUpTurns[0]

  if (nextIndex >= scenario.followUpTurns.length) {
    const lastTurn = scenario.followUpTurns[scenario.followUpTurns.length - 1];
    return {
      aiText: scenario.closingLine,
      aiEmotion: '愉快收尾',
      nextHints: lastTurn.hints,
      nextSimulatedReplies: lastTurn.simulatedReplies,
      isReadyToWrapUp: true,
    };
  }

  const turn = scenario.followUpTurns[nextIndex];
  let chosenLine = turn.aiLine;
  let chosenEmotion = turn.aiEmotion;

  if (turn.branches) {
    for (const branch of turn.branches) {
      if (branch.keywords.some((kw) => lower.includes(kw))) {
        chosenLine = branch.aiLine;
        chosenEmotion = branch.aiEmotion ?? chosenEmotion;
        break;
      }
    }
  }

  // Light personalization when user asks to slow down or mentions specific drink
  if (
    scenario.id === 'dining' &&
    nextIndex === 0 &&
    (lower.includes('latte') || lower.includes('cappuccino') || lower.includes('flat white'))
  ) {
    chosenLine =
      "Ooh, great choice—coming right up! Would you like to grab a quick bite with that? We just pulled fresh Turkish simit and pistachio croissants out of the oven.";
  }

  return {
    aiText: chosenLine,
    aiEmotion: chosenEmotion,
    nextHints: turn.hints,
    nextSimulatedReplies: turn.simulatedReplies,
    isReadyToWrapUp: completedUserTurns >= scenario.targetTurns,
  };
}

interface NuanceRule {
  test: (text: string) => boolean;
  build: (original: string, scenario: ScenarioConfig) => Omit<FeedbackItem, 'id'>;
}

const NUANCE_RULES: NuanceRule[] = [
  {
    test: (t) => /\b(say again|speak too fast|too fast|repeat)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "Sorry, I didn't quite catch that—could you run that by me one more time?",
      stiffSegment: /say again\?\s*you speak too fast\.?/i.test(original)
        ? 'Say again? You speak too fast.'
        : 'Say again?',
      upgradedSegment: "didn't quite catch that",
      culturalTipZh:
        '听不清对方口音时，避免直接指出对方“说太快”或说祈使句 “Say again?”。用 “I didn\'t quite catch...” 温和承接，对方会主动放慢且毫无尴尬。',
      tag: '#Travel',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(which one is delicious|delicious)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "They both sound great—what's your favorite if I want something not too heavy?",
      stiffSegment: 'Which one is delicious?',
      upgradedSegment: "what's your favorite",
      culturalTipZh:
        '问店员“哪个好吃”时，老外很少直问 “Which one is delicious?”，更常用 “What do you recommend?” 或 “What\'s your favorite?” 来自然互动。',
      tag: '#Coffee',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(i am fine|i'm fine|fine,?\s*and you)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "Doing great, thanks! Really enjoying the sessions so far—how about you?",
      stiffSegment: 'I am fine, and you?',
      upgradedSegment: 'Doing great, thanks!',
      culturalTipZh:
        '“Fine, and you?” 课本味太重，有时甚至让人觉得你在敷衍。用 “Doing great!” 或 “Loving it so far!” 接一句共同场景，社交温度立刻翻倍。',
      tag: '#SmallTalk',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(not so good|no,?\s*no|learn from you)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "Thank you, that's really kind of you to say—it's been a huge team effort.",
      stiffSegment: 'No, no, we are not so good',
      upgradedSegment: "that's really kind of you to say",
      culturalTipZh:
        '海外同行夸你数据或手术做得好时，连说 “No, no” 会让对方不知怎么接话。先大方收下赞美，再顺带归功于团队，既专业自信又不失谦逊。',
      tag: '#SmallTalk',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(make the table|higher a little|up the table)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: 'Would you mind bringing the table up just a touch? The monitor looks spot on.',
      stiffSegment: 'Make the table higher a little',
      upgradedSegment: 'bringing the table up just a touch',
      culturalTipZh:
        '欧美手术室文化非常讲究平级协作。用 “Would you mind...” 搭配 “just a touch（微调一点点）”，比命令式表达更受器械护士和麻醉团队欢迎。',
      tag: '#Clinical',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(take away|meeting fast)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "To go, please—I'm trying to catch the next keynote.",
      stiffSegment: 'Take away. I need to go to the meeting fast.',
      upgradedSegment: "To go, please—I'm trying to catch",
      culturalTipZh:
        '在国际咖啡馆点单打包常说 “To go, please”（英式可用 takeaway，但前面加一个 please 更柔和）；用 “catch the keynote” 比 “go to the meeting fast” 地道得多。',
      tag: '#Coffee',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(i have to go now|goodbye|bye-bye)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "It was lovely chatting with you! Let's definitely stay in touch.",
      stiffSegment: 'I have to go now',
      upgradedSegment: 'lovely chatting with you',
      culturalTipZh:
        '茶歇或晚宴结束告别时，直说 “I have to go now / Goodbye” 略显生硬；用 “It was lovely chatting with you” 先给情绪收口，优雅又不冷场。',
      tag: '#SmallTalk',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(i am ready|let us start|start quickly)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: 'Feeling great—thanks so much to you and the team for getting everything set up.',
      stiffSegment: 'I am ready. Let us start quickly.',
      upgradedSegment: 'thanks so much to you and the team',
      culturalTipZh:
        '海外术前破冰时，一句简短的致谢团队准备比直奔主题 “Let us start” 更能迅速建立手术间的信任感与配合默契。',
      tag: '#Clinical',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(ok,?\s*stop|no other things)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "Right there is perfect, thank you! Everything's set whenever anesthesia is ready.",
      stiffSegment: 'OK, stop. No other things.',
      upgradedSegment: 'Right there is perfect',
      culturalTipZh:
        '调整器械或床位到位时，说 “Right there is perfect!” 比直接喊 “OK, stop” 更温柔利落，传达精准同时保持专业风度。',
      tag: '#Clinical',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(yes,?\s*i can go)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: "I'd love to—count me in! Just let me know where we're meeting.",
      stiffSegment: 'Yes, I can go.',
      upgradedSegment: "I'd love to—count me in!",
      culturalTipZh:
        '同事邀约聚餐时，“Yes, I can go” 听起来像勉强答应；换成 “I\'d love to—count me in!” 立刻透出真诚的热情与合群感。',
      tag: '#Clinical',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(can i check out late|carry it myself)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: /carry/i.test(original)
        ? "I'm all good with my bag, thanks—really appreciate all your help!"
        : 'Would it be possible to request a late checkout around two on Friday?',
      stiffSegment: /carry/i.test(original) ? 'No, I can carry it myself' : 'Can I check out late',
      upgradedSegment: /carry/i.test(original) ? "I'm all good with my bag" : 'Would it be possible to request',
      culturalTipZh:
        /carry/i.test(original)
          ? '婉拒他人好意帮忙时，避免以硬邦邦的 “No” 开头；说 “I\'m all good, thanks!” 既礼貌又不生分。'
          : '向酒店提出额外需求（如延迟退房）时，“Would it be possible to...” 成功率远高于直白的 “Can I...”。',
      tag: '#Travel',
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\bi want\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: /americano/i.test(original)
        ? 'Could I get a medium hot Americano, please?'
        : original
            .replace(/\bi want\b/i, 'Could I get')
            .replace(/\.?\s*$/, ', please?'),
      stiffSegment: 'I want',
      upgradedSegment: 'Could I get',
      culturalTipZh:
        '在欧美咖啡馆、餐厅或酒店，“I want...”语气偏直接、像下指令；换成 “Could I get... / I\'d love...” 立刻多出礼貌和松弛感。',
      tag: s.primaryTag,
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\bgive me\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: /receipt|bill/i.test(original)
        ? 'Could I get a receipt for my conference expenses, please?'
        : /email|contact/i.test(original)
          ? 'Mind if we swap emails so we can stay in touch?'
          : /adapter|plug/i.test(original)
            ? 'By any chance, do you have a spare power adapter I could borrow?'
            : original.replace(/\bgive me\b/i, 'Could I possibly get'),
      stiffSegment: 'Give me',
      upgradedSegment: /receipt|bill/i.test(original)
        ? 'Could I get a receipt'
        : /email|contact/i.test(original)
          ? 'Mind if we swap emails'
          : /adapter|plug/i.test(original)
            ? 'By any chance, do you have'
            : 'Could I possibly get',
      culturalTipZh:
        '中文说“给我一个……”很正常，但直译成 “Give me...” 在英语社交里显得生硬唐突；加上 “Could I get...” 或 “Mind if...” 瞬间体面自然。',
      tag: s.primaryTag,
      scenarioTitle: s.titleZh,
    }),
  },
  {
    test: (t) => /\b(i understand|standard rule|different ways)\b/i.test(t),
    build: (original, s) => ({
      original,
      natural: /understand/i.test(original)
        ? 'Got it, makes total sense—appreciate it!'
        : "It's mostly standardized for routine cases, though we tailor it case by case.",
      stiffSegment: /understand/i.test(original) ? 'I understand' : 'do different ways',
      upgradedSegment: /understand/i.test(original) ? 'makes total sense' : 'tailor it case by case',
      culturalTipZh:
        /understand/i.test(original)
          ? '日常交流中 “I understand” 偏书面严肃，换成 “Got it / Makes total sense” 更轻松自然。'
          : '学术茶歇聊临床路径时，用 “tailor it case by case（因人制宜调整）” 既地道又有资深专家的简洁感。',
      tag: s.primaryTag,
      scenarioTitle: s.titleZh,
    }),
  },
];

const FALLBACK_UPGRADES: Record<string, Omit<FeedbackItem, 'id'>[]> = {
  dining: [
    {
      original: 'I want an Americano.',
      natural: 'Could I get a hot Americano, please?',
      stiffSegment: 'I want',
      upgradedSegment: 'Could I get',
      culturalTipZh:
        '点单时用 “Could I get...” 代替 “I want...”，顺带加一句 “please”，是最稳妥的欧美咖啡馆开口模板。',
      tag: '#Coffee',
      scenarioTitle: '美食与咖啡',
    },
    {
      original: 'Give me the bill and receipt.',
      natural: 'Could we get the check—and a receipt for my conference expenses?',
      stiffSegment: 'Give me the bill',
      upgradedSegment: 'Could we get the check',
      culturalTipZh:
        '海外参会餐饮报销高频句：用 “receipt for my conference expenses” 说明用途，店员一听就懂。',
      tag: '#Coffee',
      scenarioTitle: '美食与咖啡',
    },
  ],
  conference: [
    {
      original: 'Fine, and you?',
      natural: "Doing great! Really enjoying the sessions so far—how about you?",
      stiffSegment: 'Fine, and you?',
      upgradedSegment: 'Doing great! Really enjoying the sessions',
      culturalTipZh:
        '打破 “Fine, and you?” 条件反射：用积极状态词 + 一句当前会议话题，轻松开启高质量学术寒暄。',
      tag: '#SmallTalk',
      scenarioTitle: '国际会议社交',
    },
    {
      original: 'I have to go to the next meeting.',
      natural: "It was lovely catching up—I'm going to grab a seat before the next keynote starts.",
      stiffSegment: 'I have to go',
      upgradedSegment: 'It was lovely catching up',
      culturalTipZh:
        '茶歇礼貌抽身的黄金结构：先肯定刚才的聊天（lovely catching up），再用客观议程自然结束对话。',
      tag: '#SmallTalk',
      scenarioTitle: '国际会议社交',
    },
  ],
  clinical: [
    {
      original: 'Make the table higher a little.',
      natural: 'Would you mind raising the table just a touch?',
      stiffSegment: 'Make the table higher a little',
      upgradedSegment: 'raising the table just a touch',
      culturalTipZh:
        '海外手术室配合讲究精准又温和，“just a touch（一点点）” 是外科医生高频地道口语。',
      tag: '#Clinical',
      scenarioTitle: '海外手术与学术交流',
    },
    {
      original: 'Thank you for inviting me, I can go.',
      natural: "I'd love to—count me in!",
      stiffSegment: 'I can go',
      upgradedSegment: "I'd love to—count me in!",
      culturalTipZh:
        '术后聚餐是建立跨国科研合作人脉的绝佳时机，用 “Count me in!” 显得爽快又具亲和力。',
      tag: '#Clinical',
      scenarioTitle: '海外手术与学术交流',
    },
  ],
  travel: [
    {
      original: 'Say again? I did not hear clearly.',
      natural: "Sorry, I didn't quite catch that—could you run that by me one more time?",
      stiffSegment: 'Say again?',
      upgradedSegment: "didn't quite catch that",
      culturalTipZh:
        '面对欧洲/中东/南亚等多元口音时，无需紧张自责，这句万能圆场句能让你显得从容自信。',
      tag: '#Travel',
      scenarioTitle: '出行与突发应急',
    },
    {
      original: 'Do you have a power adapter for me?',
      natural: 'By any chance, do you happen to have a spare power adapter I could borrow?',
      stiffSegment: 'for me',
      upgradedSegment: 'By any chance, do you happen to have',
      culturalTipZh:
        '用 “By any chance” 和 “happen to have” 双重柔化突发求助，酒店礼宾往往会格外热心地帮你解决。',
      tag: '#Travel',
      scenarioTitle: '出行与突发应急',
    },
  ],
};

export async function generateDemoFeedback(
  scenario: ScenarioConfig,
  messages: ChatMessage[]
): Promise<SocialFeedbackReport> {
  await new Promise((r) => setTimeout(r, 550));

  const userMessages = messages.filter((m) => m.sender === 'user');
  const items: FeedbackItem[] = [];
  const usedRules = new Set<number>();

  for (const msg of userMessages) {
    for (let i = 0; i < NUANCE_RULES.length; i += 1) {
      if (usedRules.has(i)) continue;
      if (NUANCE_RULES[i].test(msg.text)) {
        usedRules.add(i);
        items.push({
          id: `fb-${Date.now()}-${items.length}`,
          ...NUANCE_RULES[i].build(msg.text, scenario),
        });
        break;
      }
    }
    if (items.length >= 3) break;
  }

  const stiffHits = items.length;

  // If user already spoke naturally or typed custom sentences, still offer high-value tailored upgrades
  if (items.length < 2) {
    const fallbacks = FALLBACK_UPGRADES[scenario.id] ?? FALLBACK_UPGRADES.dining;
    for (const fb of fallbacks) {
      if (items.length >= 2) break;
      const alreadyExists = items.some(
        (existing) => existing.natural.toLowerCase() === fb.natural.toLowerCase()
      );
      if (!alreadyExists) {
        items.push({
          id: `fb-curated-${Date.now()}-${items.length}`,
          ...fb,
        });
      }
    }
  }

  const isAlreadyNatural = stiffHits === 0 && userMessages.length > 0;

  return {
    id: `report-${Date.now()}`,
    scenarioId: scenario.id,
    scenarioTitleZh: scenario.titleZh,
    createdAt: Date.now(),
    vibeTitle: isAlreadyNatural
      ? '松弛度很棒，沟通自然得体'
      : stiffHits === 1
        ? '信息精准清晰，微调 1 处语气更地道'
        : '核心意思完全到位，升级几处软化表达更松弛',
    vibeSummaryZh: isAlreadyNatural
      ? `你在「${scenario.titleZh}」中已经很有国际同行的交流松弛感了！下方为你整理了本场景最值得顺手收藏的 2 句进阶地道金句，方便随时磨耳朵。`
      : `你的表达逻辑清晰、对方能立刻理解；重点把容易显生硬的直译短语换成欧美高频礼貌缓冲句，整体社交温度会瞬间拉满。`,
    relaxationScore: isAlreadyNatural ? 94 : stiffHits === 1 ? 86 : 79,
    engineUsed: 'demo',
    items,
  };
}
