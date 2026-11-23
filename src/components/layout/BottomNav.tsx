import { BookmarkCheck, Compass, SlidersHorizontal } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  phraseCount: number;
}

export function BottomNav({
  activeTab,
  onChangeTab,
  phraseCount,
}: BottomNavProps) {
  const items: Array<{
    id: ActiveTab;
    label: string;
    icon: typeof Compass;
    badge?: number;
  }> = [
    { id: 'hub', label: '场景对练', icon: Compass },
    { id: 'phrasebook', label: '私人金句本', icon: BookmarkCheck, badge: phraseCount },
    { id: 'settings', label: '偏好设置', icon: SlidersHorizontal },
  ];

  return (
    <nav
      aria-label="主导航"
      className="pb-safe shrink-0 border-t border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div className="grid grid-cols-3 px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.3 : 1.9} />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
