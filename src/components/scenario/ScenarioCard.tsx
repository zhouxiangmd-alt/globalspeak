import {
  ArrowRight,
  Clock,
  Coffee,
  MapPin,
  Plane,
  Stethoscope,
  Users,
} from 'lucide-react';
import { unlockAudioForIOS } from '../../services/speechService';
import type { ScenarioConfig, ScenarioId } from '../../types';

interface ScenarioCardProps {
  scenario: ScenarioConfig;
  onStart: (scenario: ScenarioConfig) => void;
}

const SCENARIO_ICONS: Record<ScenarioId, typeof Coffee> = {
  dining: Coffee,
  conference: Users,
  clinical: Stethoscope,
  travel: Plane,
};

const SCENARIO_ACCENT_STYLES: Record<
  ScenarioId,
  {
    iconBg: string;
    badge: string;
  }
> = {
  dining: {
    iconBg:
      'bg-amber-50 text-amber-700 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800/60',
    badge:
      'bg-amber-50/90 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  conference: {
    iconBg:
      'bg-sky-50 text-sky-700 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-800/60',
    badge: 'bg-sky-50/90 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
  },
  clinical: {
    iconBg:
      'bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/60',
    badge:
      'bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  travel: {
    iconBg:
      'bg-indigo-50 text-indigo-700 ring-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800/60',
    badge:
      'bg-indigo-50/90 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
};

export function ScenarioCard({ scenario, onStart }: ScenarioCardProps) {
  const Icon = SCENARIO_ICONS[scenario.id];
  const style = SCENARIO_ACCENT_STYLES[scenario.id];

  const handleStart = () => {
    // Synchronously unlock iOS Safari speech synthesis inside direct tap handler
    unlockAudioForIOS();
    onStart(scenario);
  };

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
                {scenario.titleZh}
              </h3>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {scenario.titleEn}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {scenario.subtitleZh}
            </p>
          </div>
        </div>
      </div>

      {/* Location & Persona meta */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${style.badge}`}
        >
          <MapPin className="h-3 w-3" />
          {scenario.locationBadge}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
          <Clock className="h-3 w-3" />
          约 {scenario.estimatedMinutes} 分钟 · {scenario.targetTurns} 轮
        </span>
      </div>

      {/* Focus skills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {scenario.focusSkills.map((skill) => (
          <span
            key={skill}
            className="rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:text-slate-400 dark:ring-slate-700/80"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer: Persona + Start CTA */}
      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700/70">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-xs ${scenario.persona.avatarGradient}`}
          >
            {scenario.persona.avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
              {scenario.persona.name}
            </p>
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              {scenario.persona.roleZh} · {scenario.accentLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.97] dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
        >
          开始对练
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
