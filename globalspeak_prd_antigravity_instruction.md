# GlobalSpeak - 医生国际交流与学术场景口语教练
> **Product Requirement Document (PRD) & Antigravity Prompt Specification**

---

## 1. 产品定位与目标 (Product Vision)

### 1.1 核心痛点
* **文化温差与表达生硬**：拥有充足的医学/学术词汇量，但在会议茶歇、晚宴及日常点餐/交流时，习惯使用“中式直译”（如 *Fine, and you?* / *I want a coffee.*），缺乏地道表达与社交松弛感。
* **听力防守心态**：在嘈杂环境或面对多样化国际口音（欧洲、日韩、印度等）时易慌乱，不懂得如何自然且礼貌地打断、追问或接话。
* **备考效率低**：市面 App 多偏重基础语法和通用背单词，缺乏针对“国际学术会议、海外手术交流、跨国同行破冰”的高频特定场景。

### 1.2 目标定位
一款 **Mobile-First PWA Web App**（移动端优先的渐进式 Web 应用），无需繁琐安装。通过微型语音沙盒（3～5轮快速对练）与即时“社交体检”，帮助使用者快速打造地道、自信的国际交流肌肉记忆。

---

## 2. 核心功能模块 (Core Modules V1)

```
+-----------------------------------------------------------------------+
|                           GlobalSpeak V1                              |
+-----------------------------------------------------------------------+
|  [1. 场景选择]   -->   [2. 语音/文字对练]   -->   [3. 社交体检复盘]    |
| (美食/会议/手术)      (AI 扮演不同角色)        (地道平替 + 文化潜台词) |
+-----------------------------------------------------------------------+
|                          [4. 私人金句本]                              |
|                    (一键收录 / 语音朗读 / 慢速模仿)                   |
+-----------------------------------------------------------------------+
```

### 2.1 模块一：专属场景选择卡 (Scenario Hub)
内置 4 大核心实用场景：
1. **美食与咖啡 (Dining & Coffee)**：咖啡厅定制点单、餐厅问推荐（*What do you recommend?*）、买单与小费。
2. **国际会议社交 (Conference Social)**：走廊偶遇寒暄、茶歇被主动搭话、受夸奖如何得体回应、礼貌抽身。
3. **海外手术与学术交流 (Clinical & Surgical Exchange)**：术前团队破冰、术中简短配合指令、术后聚餐闲聊。
4. **出行与突发应急 (Travel & Quick Fixes)**：酒店/机场沟通、没听清对方口音时如何自然圆场。

### 2.2 模块二：实战语音沙盒 (Roleplay Sandbox)
* **人设扮演**：AI 根据选中场景自动匹配角色（如：热情的咖啡师、欧裔参会学者、外方手术室护士/麻醉师）。
* **交互模式**：
  * 支持**按住说话 (Voice)** 与 **文字输入 (Text)**。
  * **盲听优先**：AI 回复默认播放语音，用户可自由切换“显示/隐藏英文文本”与“慢速重播”。
* **救生圈 (Hint Button)**：卡壳时点击“偷看灵感”，自动提供 2 个简短中文思路 + 核心英文短语建议。

### 2.3 模块三：“去僵硬”社交体检卡 (Social Nuance Feedback)
每局 3～5 轮对话结束后，系统自动生成精简体检卡：
* **原文 vs. 地道平替**：对比用户的表达与老外更自然、更具松弛感的使用习惯。
  * *Example*: `I want an Americano` $\rightarrow$ `Could I get a hot Americano, please?`
* **文化潜台词点拨**：用 1～2 句话点明为什么这样说更地道（如解释 *Fine, and you?* 与 *Doing great! How about you?* 的语感差异）。
* **一键收录**：提供“★ 存入金句本”按钮。

### 2.4 模块四：私人金句本 (Pocket Phrasebook)
* **灵感卡片管理**：展示用户自建和复盘收录的金句。
* **多速度 / 多口音朗读**：支持标准速度、0.8x 慢速播放，支持切换美音/英音发音。

---

## 3. 技术栈建议 (Tech Stack for Antigravity)

* **前端框架**：React / Next.js 或 Vue 3 (单文件 PWA / Single-page Application)
* **UI 样式**：Tailwind CSS (适配移动端竖屏，支持 Dark/Light Mode)
* **图标库**：Lucide-react
* **API / 逻辑**：
  * 大模型：Gemini 2.5 / 1.5 Pro API 或 OpenAI API
  * 语音组件：Web Speech API (浏览器原生语音识别/合成) 或 OpenAI Whisper / ElevenLabs

---

## 4. 给 Antigravity 的首条启动指令 (Copy & Paste Prompt)

> **请复制下方框内文字，直接粘贴到 Antigravity（反重力）的输入框中发起任务：**

```text
Help me build a single-file React + Tailwind CSS Web Application called "GlobalSpeak", designed as a mobile-first PWA for non-native English speaking professionals (specifically physicians attending international conferences and surgical exchanges).

Key Features to implement in this V1 interactive UI:

1. Scenario Selection Dashboard:
   - 4 main cards: "Dining & Coffee", "Conference Social", "Surgical & Clinical Exchange", "Travel & Emergency".
   - Each card has a subtitle, estimated time (3 mins), and a "Start Session" button.

2. Interactive Roleplay Sandbox:
   - Simulates a chat interface with an AI persona (e.g., barista, European fellow researcher, surgical nurse).
   - Show conversation turns (audio playback simulation toggle, show/hide transcript toggle, slow-speed playback button).
   - "Hint / Inspiration" popover button offering 2 suggested phrases when stuck (e.g., "What's your recommendation?").
   - Voice input button (press to talk simulation) + Text fallback.
   - Finish session button (ends after 3-5 turns).

3. Social Nuance Feedback Modal/Card:
   - Appears after completing a session.
   - Shows "What you said" vs "More natural / Native phrasing" (highlighting changes in color).
   - Includes a 1-line "Cultural Nuance Tip" (e.g., explaining tone difference between "I want..." vs "Could I get...").
   - "Save to My Phrasebook" button for each suggestion.

4. My Phrasebook View:
   - A tab to view saved key phrases with tags (e.g., #Coffee, #SmallTalk).
   - Audio playback button simulation (Normal & 0.8x Slow).

Style & UX Requirements:
- Modern, clean, mobile-first design optimized for iOS Safari / Chrome on mobile.
- Use a calm, professional color palette (e.g., Slate blue, Emerald green accents).
- Make all mock data highly realistic for a doctor attending an international conference in Europe/Turkey.

Please generate the complete, single-file runnable React code for this V1 prototype!
```