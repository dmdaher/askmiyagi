import posthog from 'posthog-js';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: '/relay-mg',
    ui_host: 'https://us.posthog.com',
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },
  });
}
