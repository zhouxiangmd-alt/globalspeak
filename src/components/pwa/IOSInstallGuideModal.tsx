import {
  CheckCircle2,
  Mic,
  PlusSquare,
  Share,
  Smartphone,
  Volume2,
  X,
} from 'lucide-react';

interface IOSInstallGuideModalProps {
  open: boolean;
  onClose: () => void;
  initialFocus?: 'install' | 'mic';
}

export function IOSInstallGuideModal({
  open,
  onClose,
  initialFocus = 'install',
}: IOSInstallGuideModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="iPhone Safari 使用与安装指南"
    >
      <div className="pb-safe max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400 dark:bg-slate-800">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                iPhone Safari 专属适配指南
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                全屏 App 体验 + 顺畅语音识别设置
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Section 1: Add to Home Screen */}
          <section
            className={`rounded-2xl border p-4 ${
              initialFocus === 'install'
                ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800/70 dark:bg-emerald-950/30'
                : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
            }`}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <PlusSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              一、添加到 iPhone 主屏幕（免安装全屏 PWA）
            </h3>
            <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                  1
                </span>
                <span>
                  使用 iPhone 自带的 <strong>Safari 浏览器</strong>打开本页面，轻点底部工具栏中间的{' '}
                  <span className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-900 dark:bg-slate-700 dark:text-white">
                    <Share className="h-3 w-3" /> 分享
                  </span>{' '}
                  图标。
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                  2
                </span>
                <span>
                  向上滑动菜单，选择 <strong>「添加到主屏幕」</strong>，再点右上角 <strong>「添加」</strong>。
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                  3
                </span>
                <span>
                  从桌面图标启动即可享受无地址栏全屏体验，金句本与离线场景可随时秒开。
                </span>
              </li>
            </ol>
          </section>

          {/* Section 2: iPhone Mic & Speech tips */}
          <section
            className={`rounded-2xl border p-4 ${
              initialFocus === 'mic'
                ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800/70 dark:bg-emerald-950/30'
                : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
            }`}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Mic className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              二、iPhone 语音识别与播报顺畅秘诀
            </h3>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>麦克风权限</strong>：需通过 <strong>HTTPS</strong> 网址访问，并在 iPhone{' '}
                  <code>设置 → Safari 浏览器 → 麦克风</code> 选择「允许」或「询问」。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>关键开关（听写）</strong>：iOS 网页语音转文字依赖系统听写服务，请确认{' '}
                  <code>设置 → 通用 → 键盘 → 启用听写</code> 已打开。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>没有声音？</strong>：请确认 iPhone 机身左侧<strong>静音拨片</strong>未开启静音；若在会议室不方便开口，可随时使用「模拟语音」或「文字输入」。
                </span>
              </li>
            </ul>
          </section>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white transition active:scale-[0.98] dark:bg-emerald-500 dark:text-slate-950"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}
