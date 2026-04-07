'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') ?? 'contractor';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cookieName = role === 'admin' ? 'admin_access' : 'contractor_access';
    const redirectTo = role === 'admin' ? '/admin/review' : '/editor';
    document.cookie = `${cookieName}=${password}; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push(redirectTo);
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 rounded-lg border border-gray-800 bg-[#111122] p-6">
      <h1 className="text-lg font-semibold text-gray-200 mb-1">
        {role === 'admin' ? 'Admin Review' : 'Panel Editor'}
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
        <p className="text-xs text-red-400 mt-2">Incorrect password</p>
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
