/**
 * Application shell: header, privacy banner, routed pages and the persistent
 * disclaimer.
 *
 * HashRouter is used deliberately — the app is static, so deep links must work
 * without any server-side rewrite rules (GitHub Pages, Netlify and Vercel all
 * serve it as plain files).
 */

import { HashRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { PrivacyBanner } from './components/privacy/PrivacyBanner';
import { Disclaimer } from './components/privacy/Disclaimer';
import { AnalyzePage } from './pages/AnalyzePage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App(): JSX.Element {
  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <PrivacyBanner />

        <main id="main" className="flex-1 focus-visible:outline-none">
          <Routes>
            <Route path="/" element={<AnalyzePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Disclaimer />
      </div>
    </HashRouter>
  );
}
