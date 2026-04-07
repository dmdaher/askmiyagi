'use client';

import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            href="/admin"
            className="text-lg font-bold text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            Miyagi Pipeline Control
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/review"
              className="text-sm text-gray-400 transition-colors hover:text-gray-200"
            >
              Review
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 transition-colors hover:text-gray-300"
            >
              Back to Studio
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
