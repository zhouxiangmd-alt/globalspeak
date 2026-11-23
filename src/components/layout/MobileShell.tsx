import type { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="flex h-[100dvh] w-full justify-center bg-slate-100 dark:bg-slate-950">
      <div className="relative flex h-full w-full max-w-[460px] flex-col overflow-hidden bg-slate-50 shadow-2xl shadow-slate-900/10 sm:border-x sm:border-slate-200/80 dark:bg-slate-900 dark:shadow-black/50 dark:sm:border-slate-800">
        {children}
      </div>
    </div>
  );
}
