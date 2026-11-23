import type { ScenarioConfig, ScenarioId } from '../types';

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'dining',
    titleZh: '美食与咖啡',
    titleEn: 'Dining & Coffee',
    subtitleZh: '咖啡厅定制点单 · 问主厨推荐 · 买单小费与发票',
    locationBadge: '伊斯坦布尔会场咖啡馆',
    estimatedMinutes: 3,
    targetTurns: 4,
    primaryTag: '#Coffee',
    focusSkills: ['软化请求语气', '自然询问推荐', '礼貌买单与索要小票'],
    accentDefault: 'en-US',
    accentLabel: '国际英语 · 轻快',
    persona: {
      name: 'Emre',
      roleZh: '精品咖啡馆主理人',
      roleEn: 'Specialty Barista',
      avatarInitials: 'EM',
      avatarGradient: 'from-amber-600 to-orange-700',
      introNote: '早上 8:15，离大会主旨演讲还有 25 分钟，你在伊斯坦布尔会场楼下的咖啡馆排队点单。',
    },
    systemPrompt: `You are Emre, a warm, upbeat specialty coffee barista at a boutique cafe right next to the Istanbul Congress Center where an international medical conference is taking place. You are chatting with a visiting physician from China.
Keep responses natural, concise (1-3 short spoken sentences), friendly, and realistic for a morning rush cafe. Never lecture or correct the user's English during roleplay—stay 100% in character. Guide the conversation naturally across 3-5 turns: drink customization -> pastry/local recommendation -> for here/to go -> payment/receipt/conference wish.`,
    openingTurn: {
      aiLine:
        "Good morning! Heading over to the medical congress? What can I get started for you today?",
      aiEmotion: '热情迎客',
      hints: [
        {
          zhIntent: '礼貌点一杯热美式（避免用生硬的 I want）',
          enPhrase: 'Could I get a hot Americano, please?',
          naturalNote: '用 Could I get / Can I have 比 I want 柔和地道得多',
        },
        {
          zhIntent: '想定制奶咖或少糖，先礼貌询问',
          enPhrase: "I'd love a medium oat-milk latte, not too sweet.",
          naturalNote: "I'd love a... 自带轻松愉悦的咖啡馆语感",
        },
      ],
      simulatedReplies: [
        {
          label: '中式直译体验（测试体检纠偏）',
          styleTag: 'stiff',
          text: 'Yes. I want a hot Americano. Medium size.',
        },
        {
          label: '地道松弛示范',
          styleTag: 'natural',
          text: "Morning! Yeah, heading right over. Could I get a medium hot Americano, please?",
        },
      ],
    },
    followUpTurns: [
      {
        aiLine:
          "Sure thing! Would you like to grab a quick bite with that? We just pulled fresh Turkish simit and pistachio croissants out of the oven.",
        aiEmotion: '热心推荐',
        hints: [
          {
            zhIntent: '反问对方最推荐哪一款',
            enPhrase: 'Ooh, what do you recommend for something not too heavy?',
            naturalNote: '加一个轻语气词 Ooh / Hmm 瞬间拉近社交距离',
          },
          {
            zhIntent: '礼貌婉拒，只要咖啡即可',
            enPhrase: "I'm good with just the coffee today, thanks!",
            naturalNote: "I'm good / I'm all set 比干巴巴的 No, thank you 更自然",
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'Which one is delicious? Give me the best one.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "They both sound great—what's your favorite if I want something light?",
          },
        ],
        branches: [
          {
            keywords: ['no', 'just coffee', "i'm good", 'all set', 'enough'],
            aiLine:
              "No problem at all—just the coffee it is! Are we having that for here or to go?",
            aiEmotion: '干脆利落',
          },
        ],
      },
      {
        aiLine:
          "Honestly, the pistachio croissant is our crowd favorite—flaky and not overly sweet. I'll warm one up for you. Is this for here or to go?",
        aiEmotion: '微笑确认',
        hints: [
          {
            zhIntent: '打包带走，准备赶去听讲座',
            enPhrase: "To go, please—I'm trying to catch the nine o'clock keynote.",
            naturalNote: '顺嘴带一句背景，老外很吃这种随口聊两句的松弛感',
          },
          {
            zhIntent: '在店里坐一会儿，顺便问有没有插座',
            enPhrase: 'For here, please. Do you happen to have a table near an outlet?',
            naturalNote: 'Do you happen to have... 是欧美最常用的礼貌询问句式',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'Take away. I need to go to the meeting fast.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "To go, please—I'm hoping to grab a seat before the first talk starts.",
          },
        ],
      },
      {
        aiLine:
          "Got it, packed to go! With your conference lanyard that's 10% off, so it comes to 7 euros 50. Tap whenever you're ready—need a receipt for reimbursement?",
        aiEmotion: '贴心结账',
        hints: [
          {
            zhIntent: '要一张报销小票，并表达感谢',
            enPhrase: "Yes please, a receipt would be super helpful. Here's a little tip too—thanks so much!",
            naturalNote: 'super helpful / really appreciate it 是日常最高频的暖心表达',
          },
          {
            zhIntent: '不需要小票，顺便礼貌告别',
            enPhrase: "I'm all set without a receipt, thanks! Have a great morning.",
            naturalNote: '结账后补一句 Have a great morning / Enjoy the rest of your day 很加分',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'Yes, give me the receipt. Thank you, bye.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: 'Yes please, a receipt would be great for my hospital expenses. Thanks a ton, have a wonderful day!',
          },
        ],
      },
    ],
    closingLine:
      "Here's your receipt and your order—careful, it's hot! Hope you have an awesome conference today!",
  },
  {
    id: 'conference',
    titleZh: '国际会议社交',
    titleEn: 'Conference Social',
    subtitleZh: '茶歇破冰寒暄 · 得体回应夸奖 · 礼貌优雅抽身',
    locationBadge: '维也纳学术年会茶歇区',
    estimatedMinutes: 3,
    targetTurns: 4,
    primaryTag: '#SmallTalk',
    focusSkills: ['摆脱 Fine, and you', '大方接住夸奖', '不尴尬的自然退场'],
    accentDefault: 'en-GB',
    accentLabel: '欧陆 / 英式语感',
    persona: {
      name: 'Dr. Elena Novak',
      roleZh: '维也纳大学医院同行学者',
      roleEn: 'European Fellow Researcher',
      avatarInitials: 'EN',
      avatarGradient: 'from-slate-700 to-sky-700',
      introNote: '上午专题会刚结束，你在维也纳会场走廊端着咖啡，一位刚看过你团队 Poster 的欧洲同行走过来打招呼。',
    },
    systemPrompt: `You are Dr. Elena Novak, a friendly, articulate attending physician and researcher from Vienna attending a major European medical congress. You just met a visiting Chinese physician at the coffee break.
Keep responses natural, warm, and concise (1-3 short spoken sentences). Never correct the user's English during roleplay. Progress naturally across 3-5 turns: casual coffee break greeting -> genuine compliment on their poster/clinical outcomes -> brief curiosity about clinical workflow back home -> graceful wrap-up as the next session starts.`,
    openingTurn: {
      aiLine:
        "Hey there! Mind if I join this table? How's the congress treating you so far—pretty packed morning, huh?",
      aiEmotion: '轻松搭话',
      hints: [
        {
          zhIntent: '松弛回应近况（替代课本味太重的 Fine, and you?）',
          enPhrase: "Please, go ahead! It's been great so far—a bit jet-lagged, though. How about you?",
          naturalNote: '顺带提一句轻微时差（a bit jet-lagged）能瞬间引出共鸣',
        },
        {
          zhIntent: '夸一下上午的议程并自然反问',
          enPhrase: "Not at all, please join! Really enjoying the sessions—which track are you following?",
          naturalNote: '把问题抛回去（which track...）是避免冷场的黄金法则',
        },
      ],
      simulatedReplies: [
        {
          label: '中式直译体验（测试体检纠偏）',
          styleTag: 'stiff',
          text: 'Yes, you can sit here. I am fine, and you?',
        },
        {
          label: '地道松弛示范',
          styleTag: 'natural',
          text: "Not at all, please go ahead! Loving it so far—still shaking off the jet lag a bit. How's it going for you?",
        },
      ],
    },
    followUpTurns: [
      {
        aiLine:
          "Doing great, thanks! Actually, I walked past your team's poster earlier—your complication rate on those complex cases was seriously impressive. Really clean data!",
        aiEmotion: '真诚称赞',
        hints: [
          {
            zhIntent: '大方接住夸奖并归功于团队（避免连说 No, no）',
            enPhrase: "Thank you, that's really kind of you to say—it's been a huge team effort.",
            naturalNote: '西方学术社交中，笑着接下赞美再顺手提团队，既谦逊又自信',
          },
          {
            zhIntent: '顺势开启学术互动，问对方关注哪个细节',
            enPhrase: 'Thanks so much! Did anything in particular catch your eye on the outcomes?',
            naturalNote: 'catch your eye 是非常自然的口语表达',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'No, no, we are not so good. We still need to learn from you.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "Thank you, that's really kind of you to say! It's been a huge team effort over the past two years.",
          },
        ],
      },
      {
        aiLine:
          "Love that. I was actually curious—do you guys standardize that minimally invasive protocol across your department, or is it still mostly surgeon preference?",
        aiEmotion: '专业好奇',
        hints: [
          {
            zhIntent: '简短清晰回答，不陷入冗长背书',
            enPhrase: "Mostly standardized now for routine cases, though we still tailor it for higher-risk patients.",
            naturalNote: '茶歇聊天重在「点到为止」，用 tailor it 简洁又有专业度',
          },
          {
            zhIntent: '回答完顺势反问对方中心的情况',
            enPhrase: "It's pretty standardized at our center. How do you usually approach it in Vienna?",
            naturalNote: 'approach it 比 how do you do it 更地道专业',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'We have a standard rule, but sometimes different doctors do different ways.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "It's largely standardized for routine cases, though we tailor it case by case. How do you handle it at your center?",
          },
        ],
      },
      {
        aiLine:
          "Very similar here! Oh, looks like they're dimming the lights for the afternoon plenary—we should probably head back in.",
        aiEmotion: '准备散场',
        hints: [
          {
            zhIntent: '优雅收尾并顺便交换联系方式',
            enPhrase: "It was lovely chatting with you! Mind if I grab your email or LinkedIn so we can stay in touch?",
            naturalNote: 'lovely chatting with you + stay in touch 是最体面的会议收场白',
          },
          {
            zhIntent: '礼貌抽身，约定会后再聊',
            enPhrase: "Great meeting you, Elena—let's definitely catch up again at the reception tonight!",
            naturalNote: 'catch up again 比 see you next time 更有同行熟络感',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'OK, I have to go now. Give me your email. Goodbye.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "It was really lovely chatting with you, Elena! Mind if we swap contacts so we can stay in touch?",
          },
        ],
      },
    ],
    closingLine:
      "Of course—let's scan badges! Enjoy the plenary, and hopefully I'll bump into you at the gala dinner tonight!",
  },
  {
    id: 'clinical',
    titleZh: '海外手术与学术交流',
    titleEn: 'Clinical & Surgical Exchange',
    subtitleZh: '术前团队破冰 · 术中简短配合 · 术后聚餐闲聊',
    locationBadge: '苏黎世合作医院 OR-3',
    estimatedMinutes: 3,
    targetTurns: 4,
    primaryTag: '#Clinical',
    focusSkills: ['术前建立松弛信任', '礼貌高效的术中指令', '非正式聚餐回应'],
    accentDefault: 'en-GB',
    accentLabel: '清晰标准 · 临床协作',
    persona: {
      name: 'Hannah Lindner',
      roleZh: '外方手术室资深巡回/器械护士',
      roleEn: 'Lead OR Nurse',
      avatarInitials: 'HL',
      avatarGradient: 'from-emerald-700 to-teal-800',
      introNote: '你受邀赴欧洲合作医院参与手术演示交流，术前刚刷完手走进 3 号手术间，器械护士长 Hannah 正在做最后核对。',
    },
    systemPrompt: `You are Hannah Lindner, an experienced, calm, and friendly lead OR scrub nurse at a European university hospital hosting a visiting surgeon from China for a live surgical exchange.
Keep responses brief, collaborative, and natural (1-3 short spoken sentences). Never correct the user's English during roleplay. Progress naturally across 3-5 turns: warm pre-op welcome -> quick ergonomic/table/instrument preference check -> smooth collaborative check-in -> post-op casual team dinner invitation.`,
    openingTurn: {
      aiLine:
        "Good morning, Doctor! Welcome to OR 3. Anesthesia just finished prepping—how are you feeling before our first case together?",
      aiEmotion: '干练友好',
      hints: [
        {
          zhIntent: '感谢团队准备，展现亲和力与配合度',
          enPhrase: "Morning, Hannah! Feeling great—thanks so much to you and the whole team for getting everything set up.",
          naturalNote: '海外手术室极重视平等协作，开场致谢团队瞬间赢得好感',
        },
        {
          zhIntent: '轻松破冰，表示很期待一起合作',
          enPhrase: "Really excited to be here! Please feel free to call me by my first name if that's easier.",
          naturalNote: '在欧美手术室主动拉近称呼距离，气氛会立刻松弛很多',
        },
      ],
      simulatedReplies: [
        {
          label: '中式直译体验（测试体检纠偏）',
          styleTag: 'stiff',
          text: 'Good morning. I am ready. Let us start quickly.',
        },
        {
          label: '地道松弛示范',
          styleTag: 'natural',
          text: "Morning, Hannah! Feeling great—really appreciate you and the team getting everything prepped so smoothly.",
        },
      ],
    },
    followUpTurns: [
      {
        aiLine:
          "Happy to have you with us! Before we drape, how's the table height and monitor position looking for you? Any tweaks you'd like?",
        aiEmotion: '细致确认',
        hints: [
          {
            zhIntent: '礼貌请求微调手术床高度和灯光（避免命令式）',
            enPhrase: 'Would you mind raising the table just a touch? The monitor angle looks spot on.',
            naturalNote: 'just a touch（微调一点点）和 spot on（刚刚好）极其地道',
          },
          {
            zhIntent: '确认都挺合适，只需微调屏幕方向',
            enPhrase: 'Table height feels great—could we angle the screen slightly toward me?',
            naturalNote: '用 could we... 体现团队协作感，比 move the screen 礼貌得多',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'Make the table higher a little. The screen is OK.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: 'Would you mind bringing the table up just a touch? The monitor angle looks spot on, thanks!',
          },
        ],
      },
      {
        aiLine:
          "Coming up a touch—right there? Awesome. I've got the bipolar on your right and suction ready to go. Anything else you prefer to keep within reach?",
        aiEmotion: '默契配合',
        hints: [
          {
            zhIntent: '确认完美，并补充一句礼貌的提醒',
            enPhrase: "Right there is perfect! Everything looks great—I'll give you a heads-up if we need an extra clip applier.",
            naturalNote: 'give you a heads-up（提前知会你一声）是临床配合高频词',
          },
          {
            zhIntent: '简短确认，准备开始核查 Time-out',
            enPhrase: "That's ideal, thank you. Whenever anesthesia is happy, I'm ready for our time-out.",
            naturalNote: 'Whenever anesthesia is happy 是欧美手术室地道幽默又礼貌的表达',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'OK, stop. No other things. We can do time-out now.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "Right there is perfect, thank you! Everything's set—whenever anesthesia is ready, we can do our time-out.",
          },
        ],
      },
      {
        aiLine:
          "Wonderful—and fast-forward two hours, that case went super smoothly! A few of us from anesthesia and surgery are grabbing a casual bite around seven. Care to join us?",
        aiEmotion: '术后轻松邀请',
        hints: [
          {
            zhIntent: '欣然赴约，展现团队融入感',
            enPhrase: "I'd love to! Count me in—just let me know where we're meeting.",
            naturalNote: 'Count me in!（算我一个！）干脆、真诚、毫无中式客套感',
          },
          {
            zhIntent: '如果太累需要礼貌婉拒，同时保持热络',
            enPhrase: "That sounds awesome, though I'm still wiped out from the flight—can I take a rain check for tomorrow?",
            naturalNote: 'take a rain check（改天补约）是欧美极高情商的婉拒表达',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'Yes, I can go. Thank you for inviting me. What time?',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "I'd love to—count me in! Just text me the spot and I'll meet you guys there.",
          },
        ],
      },
    ],
    closingLine:
      "Awesome, we'll see you at seven! Go grab a well-earned coffee and rest your feet for a bit!",
  },
  {
    id: 'travel',
    titleZh: '出行与突发应急',
    titleEn: 'Travel & Quick Fixes',
    subtitleZh: '酒店/机场沟通 · 听不清口音时从容圆场 · 应急求助',
    locationBadge: '欧洲会议酒店前台',
    estimatedMinutes: 3,
    targetTurns: 4,
    primaryTag: '#Travel',
    focusSkills: ['听不清口音优雅追问', '避免命令式请求', '突发状况冷静协商'],
    accentDefault: 'en-GB',
    accentLabel: '偏快语速 · 听辨脱敏',
    persona: {
      name: 'Tariq',
      roleZh: '会议合作酒店礼宾主管',
      roleEn: 'Hotel Front Desk & Concierge',
      avatarInitials: 'TQ',
      avatarGradient: 'from-indigo-700 to-slate-800',
      introNote: '长途航班落地后刚到酒店办理入住，前台语速偏快且带地方口音，信息量密集，考验你的听辨从容度。',
    },
    systemPrompt: `You are Tariq, a helpful but slightly fast-talking front desk concierge at a busy conference hotel in Istanbul/Europe welcoming a tired visiting doctor.
Keep responses natural and brisk (2-3 spoken sentences, occasionally packing two practical details together so the user practices clarifying politely). Never correct the user's English during roleplay. Progress across 3-5 turns: brisk check-in details -> clarify shuttle/breakfast -> small travel hiccup (power adapter or early taxi) -> warm send-off.`,
    openingTurn: {
      aiLine:
        "Welcome in, Doctor! We've got your conference booking all pulled up—breakfast runs six-thirty to ten on the mezzanine, and the congress shuttle leaves from the courtyard gate on the half-hour. Did you want a quiet room off the main avenue?",
      aiEmotion: '语速偏快',
      hints: [
        {
          zhIntent: '没完全听清，从容礼貌请对方再说一遍（替代 Say again?）',
          enPhrase: "Sorry, I didn't quite catch the shuttle part—could you run that by me one more time?",
          naturalNote: "didn't quite catch... 把责任轻巧揽在「环境/自己」，完全不尴尬",
        },
        {
          zhIntent: '确认要安静房间，并顺便复核接驳车时间',
          enPhrase: 'A quiet room would be amazing, thank you! Just to double-check, the shuttle leaves every half hour?',
          naturalNote: 'Just to double-check... 是老外处理快语速信息最常用的防错缓冲句',
        },
      ],
      simulatedReplies: [
        {
          label: '中式直译体验（测试体检纠偏）',
          styleTag: 'stiff',
          text: 'Say again? You speak too fast. I want a quiet room.',
        },
        {
          label: '地道松弛示范',
          styleTag: 'natural',
          text: "A quiet room would be wonderful, thanks! Sorry, I didn't quite catch where the conference shuttle leaves from?",
        },
      ],
    },
    followUpTurns: [
      {
        aiLine:
          "Of course, my apologies—I know I talk fast! The shuttle picks up right outside the courtyard gate at half past every hour, so 7:30, 8:30, and so on. Here's your keycard for Room 612—quiet side!",
        aiEmotion: '放慢耐心解释',
        hints: [
          {
            zhIntent: '感谢对方放慢语速，并顺便借一个欧标插头转换器',
            enPhrase: 'Got it, super clear now—thanks! By any chance, do you have a European power adapter I could borrow?',
            naturalNote: 'By any chance...（碰巧有没有……）让临时求助显得特别客气有分寸',
          },
          {
            zhIntent: '询问酒店 Wi-Fi 及明天一早叫车服务',
            enPhrase: "Makes total sense, appreciate it! Also, is it easy to book an early taxi to the hospital tomorrow?",
            naturalNote: 'Makes total sense（完全明白了）比 I understand 更口语自然',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'I understand. Give me a plug adapter for my computer, I forgot mine.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: 'Got it, super clear now—thank you! By any chance, do you happen to have a spare power adapter I could borrow?',
          },
        ],
      },
      {
        aiLine:
          "Let me check the drawer—yes, lucky day, we've got one right here! Just drop it back at the desk when you check out. Oh, and if you need an early cab or late checkout on Friday, just give us a ring.",
        aiEmotion: '热心搞定',
        hints: [
          {
            zhIntent: '表达救了大急，并顺便预约周五延迟退房',
            enPhrase: "You're a lifesaver, thank you! Actually, would late checkout around 2 PM on Friday be possible?",
            naturalNote: "You're a lifesaver!（你真是救星！）极具欧美情绪价值",
          },
          {
            zhIntent: '表达感谢，说明明天早上可能要早起打车',
            enPhrase: 'That really saves me—thanks so much! I might swing by tonight to arrange a 6:30 AM cab.',
            naturalNote: 'swing by（顺路过来一趟）是非常地道的日常小词',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'Thank you very much. Can I check out late on Friday at 2 o clock?',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "You're a lifesaver, really appreciate it! Actually, would it be possible to request a late checkout around two on Friday?",
          },
        ],
      },
      {
        aiLine:
          "I've noted a complimentary 2 PM late checkout for you—all sorted! Elevators are just around the corner to your left. Need a hand with your luggage?",
        aiEmotion: '周到收尾',
        hints: [
          {
            zhIntent: '轻松婉拒提行李，并礼貌致谢告别',
            enPhrase: "I'm good with my bag, thanks—it's pretty light. Appreciate all your help!",
            naturalNote: "I'm good with... + Appreciate all your help 既客气又利落",
          },
          {
            zhIntent: '感谢对方帮大忙，开玩笑说终于能补个觉了',
            enPhrase: "I've got it, thank you! You've been super helpful—can't wait to catch some sleep.",
            naturalNote: 'can’t wait to... 展现放松心情，完美收尾',
          },
        ],
        simulatedReplies: [
          {
            label: '中式直译体验',
            styleTag: 'stiff',
            text: 'No, I can carry it myself. Thank you, bye-bye.',
          },
          {
            label: '地道松弛示范',
            styleTag: 'natural',
            text: "I'm all good with my bag, thanks—it's just a carry-on. Really appreciate all your help!",
          },
        ],
      },
    ],
    closingLine:
      "My pleasure, Doctor! Have a restful evening and best of luck with your presentation!",
  },
];

export function getScenarioById(id: ScenarioId): ScenarioConfig {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}
