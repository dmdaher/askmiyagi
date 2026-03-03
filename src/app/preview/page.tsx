'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePreviewStore } from '@/store/previewStore';

export default function PreviewPage() {
  const router = useRouter();
  const { validateCode, grantAccess, agreeToTerms } = usePreviewStore();

  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter an invite code.');
      return;
    }

    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (!validateCode(code)) {
      setError('Invalid invite code. Please check and try again.');
      return;
    }

    agreeToTerms();
    grantAccess(code);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#00aaff] to-[#0066cc] shadow-lg shadow-[#00aaff]/20 mb-4">
            <svg
              width="28"
              height="28"
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
          <h1 className="text-xl font-bold text-gray-100">Ask Miyagi</h1>
          <p className="text-sm text-gray-500 mt-1">Preview Access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="invite-code" className="block text-sm font-medium text-gray-300 mb-2">
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Enter your invite code"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              autoComplete="off"
              autoFocus
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setError('');
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-400 leading-relaxed">
              I agree to the{' '}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {error && (
            <motion.p
              className="text-sm text-red-400"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-[#00aaff] to-[#0066cc] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#00aaff]/20 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Enter Preview
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-600">
            Not affiliated with Roland or Boss.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/legal/disclaimer" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Disclaimer
            </a>
            <a href="/legal/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Terms
            </a>
            <a href="/legal/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
