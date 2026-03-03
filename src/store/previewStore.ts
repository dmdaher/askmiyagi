'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const VALID_CODES = (process.env.NEXT_PUBLIC_PREVIEW_CODES ?? '')
  .split(',')
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

interface PreviewStore {
  hasAccess: boolean;
  inviteCode: string | null;
  agreedToTerms: boolean;

  validateCode: (code: string) => boolean;
  grantAccess: (code: string) => void;
  agreeToTerms: () => void;
  revokeAccess: () => void;
}

export const usePreviewStore = create<PreviewStore>()(
  persist(
    (set) => ({
      hasAccess: false,
      inviteCode: null,
      agreedToTerms: false,

      validateCode: (code: string) => {
        return VALID_CODES.includes(code.trim().toLowerCase());
      },

      grantAccess: (code: string) => {
        setCookie('preview_access', code.trim(), 30);
        set({ hasAccess: true, inviteCode: code.trim() });
      },

      agreeToTerms: () => {
        set({ agreedToTerms: true });
      },

      revokeAccess: () => {
        deleteCookie('preview_access');
        set({ hasAccess: false, inviteCode: null, agreedToTerms: false });
      },
    }),
    {
      name: 'preview-access',
    },
  ),
);
