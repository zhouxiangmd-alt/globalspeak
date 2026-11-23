import {
  ClipboardCheck,
  Cpu,
  Download,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { SCENARIOS } from '../../data/scenarios';
import { isRealAiConfigured } from '../../services/aiService';
import type {
  AppSettings,
  ScenarioConfig,
  SocialFeedbackReport,
} from '../../types';
import { ScenarioCard } from './ScenarioCard';

interface ScenarioHubProps {
  settings: AppSettings;
  isDark: boolean;
  onToggleTheme: () => void;
  onStartScenario: (scenario: ScenarioConfig) => void;
  onOpenSettings: () => void;
  latestReport: SocialFeedbackReport | null;
  onViewLatestReport: () => void;
  canShowInstallBanner: boolean;
  isIOS: boolean;
  onTriggerInstall: () => void;
  onDismissInstallBanner: () => void;
}

export function ScenarioHub({
  settings,
  isDark,
  onToggleTheme,
  onStartScenario,
  onOpenSettings,
  latestReport,
  onViewLatestReport,
  canShowInstallBanner,
  isIOS,
  onTriggerInstall,
  onDismissInstallBanner,
}: ScenarioHubProps) {
  const realAiActive = settings.aiMode !== 'demo' && isRealAiConfigured(settings);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky Top Header */}
      <header className="pt-safe shrink-0 border-b border-slate-200/80 bg-white/90 px-4 pb-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 text-white shadow-sm ring-1 ring-slate-900/10 dark:ring-emerald-500/30">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                GlobalSpeak
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                医生国际交流与学术口语教练
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSettings}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                realAiActive
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
              }`}
              title="切换 AI 驱动模式"
            >
              <Cpu className="h-3 w-3" />
              {realAiActive
                ? settings.aiMode === 'gemini'
                  ? 'Gemini 实时'
                  : 'AI 实时模式'
                : '离线沙盒'}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain px-4 pt-3.5 pb-6">
        {/* Optional PWA Install Prompt Banner */}
        {canShowInstallBanner && (
          <div className="mb-3.5 flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 dark:border-emerald-900/70 dark:bg-emerald-950/40">
            <button
              type="button"
              onClick={onTriggerInstall}
              className="flex flex-1 items-center gap-2.5 text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                <Download className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                  {isIOS ? '添加到 iPhone 主屏幕' : '安装 GlobalSpeak 桌面应用'}
                </p>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  {isIOS ? '免下载全屏打开，查看 2 步设置指南' : '支持离线随时打开金句本与演练'}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={onDismissInstallBanner}
              aria-label="关闭安装提示"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emerald-700/70 hover:bg-emerald-100 dark:text-emerald-300/70 dark:hover:bg-emerald-900/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Executive Calm Intro Banner */}
        <section className="mb-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-sm dark:from-slate-800 dark:via-slate-800/95 dark:to-emerald-950/60 dark:ring-1 dark:ring-slate-700/80">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
              盲听优先 · 社交去僵硬
            </span>
            <span className="text-[11px] text-slate-400">欧洲 / 土耳其参会实战</span>
          </div>
          <h2 className="mt-2.5 text-[17px] leading-snug font-bold tracking-tight">
            每次 3 分钟，练出国际会场的社交松弛感
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            先听后看克服口音慌乱，3～5 轮速练后立即生成「原文 vs. 地道平替」社交体检卡。
          </p>
        </section>

        {/* Latest Feedback Quick Access */}
        {latestReport && (
          <button
            type="button"
            onClick={onViewLatestReport}
            className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 text-left shadow-xs transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-emerald-700"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  查看上次复盘 · {latestReport.scenarioTitleZh}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {latestReport.vibeTitle}（共 {latestReport.items.length} 条地道平替）
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              重看体检卡
            </span>
          </button>
        )}

        {/* Section Header */}
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            选择实战场景（4 大高频主题）
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            点击即可开练
          </span>
        </div>

        {/* 4 Core Scenario Cards */}
        <div className="space-y-3">
          {SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={onStartScenario}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
