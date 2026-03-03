'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LEGAL_PAGES = [
  { href: '/legal/disclaimer', label: 'Disclaimer' },
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00aaff] to-[#0066cc] shadow-lg shadow-[#00aaff]/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-100">
              Ask Miyagi
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[var(--surface)] hover:text-gray-100"
          >
            Back to App
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <nav className="hidden md:block w-48 flex-shrink-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Legal
          </h2>
          <ul className="space-y-1">
            {LEGAL_PAGES.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className={[
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    pathname === page.href
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--surface)]',
                  ].join(' ')}
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile nav */}
          <div className="md:hidden flex gap-2 mb-8 flex-wrap">
            {LEGAL_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={[
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  pathname === page.href
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                    : 'text-gray-400 bg-[var(--surface)] hover:text-gray-200',
                ].join(' ')}
              >
                {page.label}
              </Link>
            ))}
          </div>

          <div className="prose prose-invert max-w-3xl">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] bg-[var(--card-bg)]/50">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center">
          <p className="text-xs text-gray-600">
            Not affiliated with Roland or Boss. All trademarks belong to their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
