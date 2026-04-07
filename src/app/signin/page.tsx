'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') ?? 'contractor';
  const retry = searchParams.get('retry') === '1';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(retry);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cookieName = role === 'admin' ? 'admin_access' : 'contractor_access';
    const redirectTo = searchParams.get('redirect') ?? (role === 'admin' ? '/admin' : '/editor');
    document.cookie = `${cookieName}=${password.trim()}; path=/; max-age=${60 * 60 * 24 * 30}`;

    // Verify the password works by hitting the protected page
    const res = await fetch(redirectTo, { redirect: 'manual' });
    if (res.type === 'opaqueredirect' || res.status === 307 || res.status === 308) {
      // Redirected back = wrong password
      setError(true);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 rounded-lg border border-gray-800 bg-[#111122] p-6">
      <h1 className="text-lg font-semibold text-gray-200 mb-1">
        {role === 'admin' ? 'Admin Review' : 'Instrument Editor'}
      </h1>
      <p className="text-sm text-gray-500 mb-4">Enter your password to continue</p>

      <input
        type="password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(false); }}
        placeholder="Password"
        autoFocus
        className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600"
      />

      {error && (
        <p className="text-xs text-red-400 mt-2">Incorrect password — try again</p>
      )}

      {loading && (
        <p className="text-xs text-gray-500 mt-2">Verifying...</p>
      )}

      <button
        type="submit"
        className="mt-4 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Sign In
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d1a]">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
