/**
 * The About page.
 *
 * Explains what ScamLens is, how the score is built, what it cannot do, and the
 * privacy promise. Phase 4 adds the accuracy table and the full worked example.
 */

export function AboutPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">About ScamLens</h1>

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What it is</h2>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">
          ScamLens reads a message, email, SMS or URL and estimates how closely it matches patterns that are
          commonly used in fraud. Every warning it gives names the phrase that triggered it and explains why
          that phrase is suspicious, what a legitimate sender would have done instead, and what to do about
          it.
        </p>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">
          It is a <strong>risk-assessment tool, not a guarantee</strong>. A low score does not mean a message
          is safe, and a high score does not mean it is definitely a scam.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">How the score works</h2>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">
          The engine holds a set of weighted rules across nine categories. Each signal contributes a weight
          between 0 and 1, and the contributions are combined with a <em>noisy-OR</em>:
        </p>
        <p className="rounded-lg bg-slate-100 p-3 font-mono text-sm dark:bg-slate-800">
          risk = 1 − (1 − w₁) × (1 − w₂) × (1 − w₃) …
        </p>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">
          Because the terms are multiplied rather than added, one weak signal cannot push the score up on its
          own, but several independent weak signals accumulate quickly. Signals that are only suspicious in
          combination add a further boost, and evidence that the message is a warning rather than a request
          reduces the score again. Every step is listed in the <strong>Show the math</strong> section so you
          can see exactly what produced the number.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What it cannot do</h2>
        <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          <li>
            It does not visit links. URL checks look only at the shape of an address — its domain, its
            characters and its structure — never at a site&apos;s live reputation.
          </li>
          <li>
            It does not recognise a brand&apos;s real messaging channel. A message that looks exactly like a
            bank alert is still only a message.
          </li>
          <li>
            It has no access to your accounts, so it cannot tell you whether a transaction really happened.
          </li>
          <li>
            Its rule set is tuned for English and Romanized Hindi messages. Other languages and regions are
            not covered by the current rules.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Privacy</h2>
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">
          ScamLens is a static web app. There is no backend and no analytics. Your text is processed by
          JavaScript in your own browser and never sent anywhere. History is written to your browser&apos;s
          local storage, which only your device can read. Clearing your browser data clears it too.
        </p>
      </section>
    </div>
  );
}
