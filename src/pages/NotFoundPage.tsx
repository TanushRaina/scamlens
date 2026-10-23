/**
 * 404 — reached through the catch-all route.
 */

import { Link } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <p className="font-mono text-4xl font-bold text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        This page does not exist
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        The address you followed is not part of ScamLens.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Back to Analyze
      </Link>
    </div>
  );
}
