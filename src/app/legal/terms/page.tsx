import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Ask Miyagi',
};

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 2, 2026</p>

      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-semibold text-gray-100 mt-8">1. Preview Program</h2>
        <p>
          Ask Miyagi is currently in <strong>preview</strong>.
          Access is granted through invite codes on a limited basis. By using this platform,
          you acknowledge that it is a work in progress and may contain bugs, errors, or
          incomplete features.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">2. Invite Codes</h2>
        <p>
          Invite codes are personal and non-transferable. Sharing your invite code with others
          is not permitted. We reserve the right to revoke access at any time, for any reason,
          without prior notice.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">3. Educational Use Only</h2>
        <p>
          This platform is intended solely for educational purposes — helping musicians learn
          to use their instruments. You may not use this platform or its content for any
          commercial purpose without explicit written permission.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">4. No Warranty</h2>
        <p>
          THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES
          OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">5. Limitation of Liability</h2>
        <p>
          In no event shall Ask Miyagi, its creators, or contributors be liable for
          any indirect, incidental, special, consequential, or punitive damages, including without
          limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting
          from your use of or inability to use the platform.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">6. Intellectual Property</h2>
        <p>
          The tutorials, interface designs, and educational content on this platform are original
          works. All third-party trademarks remain the property of their respective owners and are
          used here only for educational identification purposes. See our{' '}
          <a href="/legal/disclaimer" className="text-[var(--accent)] hover:underline">
            Disclaimer
          </a>{' '}
          for details.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the platform
          after changes constitutes acceptance of the updated terms. Material changes will be
          communicated to preview participants.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">8. Contact</h2>
        <p>
          For questions about these terms, please reach out through the preview program channels
          provided with your invite code.
        </p>
      </section>
    </article>
  );
}
