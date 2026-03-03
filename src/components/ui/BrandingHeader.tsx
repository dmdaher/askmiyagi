'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BrandingHeader() {
  return (
    <motion.header
      className="w-full border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-[#00aaff] via-[#00ccff] to-[#0088dd] bg-clip-text text-transparent">
              Ask
            </span>{' '}
            <span className="text-gray-100">Miyagi</span>
          </h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[var(--surface)] hover:text-gray-100"
          >
            Home
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
