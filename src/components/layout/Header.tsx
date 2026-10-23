/**
 * App header: brand, primary tab navigation and the theme toggle.
 */

import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

const TABS = [
  { to: '/', label: 'Analyze', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/about', label: 'About', end: false },
] as const;

function tabClass(active: boolean): string {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  ].join(' ');
}

export function Header(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            🔎
          </span>
          <span className="text-lg font-semibold tracking-tight">ScamLens</span>
        </div>

        <nav aria-label="Main navigation" className="ml-auto flex items-center gap-1">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => tabClass(isActive)}>
              {tab.label}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
