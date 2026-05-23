'use client';

import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect } from 'react';

// Routes where session replay must NOT run. Contractor manifests, admin
// pipeline controls, and API responses should never be captured.
const SENSITIVE_PREFIXES = ['/admin', '/editor', '/api'];

function isSensitive(pathname: string): boolean {
  return SENSITIVE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function PostHogRouteGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (!posthog.__loaded) return;
    if (isSensitive(pathname)) {
      posthog.stopSessionRecording();
    } else {
      posthog.startSessionRecording();
    }
  }, [pathname]);

  return null;
}
