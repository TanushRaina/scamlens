/**
 * The always-visible risk disclaimer.
 *
 * It sits in the footer on every route so a verdict can never be read without the
 * caveat next to it.
 */

export function Disclaimer(): JSX.Element {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          ScamLens is a risk-assessment tool, not a guarantee.
        </p>
        <p className="mt-1">
          It estimates how closely a message matches patterns that are commonly used in fraud. A low score
          does <strong>not</strong> mean a message is safe, and a high score does <strong>not</strong> mean a
          message is definitely a scam. Only you know whether you were expecting the contact.
        </p>
        <p className="mt-1">
          Link checks are structural only — they look at the shape of a URL, not its live reputation. When in
          doubt, contact the institution through a number you already have.
        </p>
        <p className="mt-2 text-xs">
          ScamLens is not affiliated with any bank, insurer, government agency or brand named in its rule set.
        </p>
      </div>
    </footer>
  );
}
