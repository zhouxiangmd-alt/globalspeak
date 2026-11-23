import type { SavedPhrase } from '../types';

export const STARTER_PHRASES: SavedPhrase[] = [
  {
    id: 'starter-1',
    phrase: 'Could I get a hot Americano, please?',
    original: 'I want a hot Americano.',
    culturalTipZh:
      '欧美点单极少直说 "I want..."（听起来像下指令），改用 "Could I get..." 或 "I\'d love a..." 立刻自带礼貌与松弛感。',
    tag: '#Coffee',
    source: 'starter',
    createdAt: Date.now() - 86400000 * 3,
    favorite: true,
  },
  {
    id: 'starter-2',
    phrase: "Doing great, thanks! How's the congress treating you so far?",
    original: 'Fine, and you?',
    culturalTipZh:
      '"Fine, and you?" 像背课文且略显疏离；用 "Doing great!" 再顺手接一句眼前共同话题（会议/咖啡），破冰瞬间自然。',
    tag: '#SmallTalk',
    source: 'starter',
    createdAt: Date.now() - 86400000 * 2,
    favorite: true,
  },
  {
    id: 'starter-3',
    phrase: 'Would you mind raising the table just a touch?',
    original: 'Make the table higher a little.',
    culturalTipZh:
      '海外手术室强调团队平等协作，"Would you mind + V-ing" 搭配 "just a touch（微调一点）"，清晰专业又不失风度。',
    tag: '#Clinical',
    source: 'starter',
    createdAt: Date.now() - 86400000,
    favorite: false,
  },
  {
    id: 'starter-4',
    phrase: "Sorry, I didn't quite catch that—could you run that by me one more time?",
    original: 'Say again? You speak too fast.',
    culturalTipZh:
      '听不清对方口音时，避免直接指责对方语速快或说生硬的 "Say again?"；用 "didn\'t quite catch..." 从容圆场最得体。',
    tag: '#Travel',
    source: 'starter',
    createdAt: Date.now() - 43200000,
    favorite: true,
  },
];

export const PHRASE_TAGS = ['#全部', '#Coffee', '#SmallTalk', '#Clinical', '#Travel', '#自建'];
