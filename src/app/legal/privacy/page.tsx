import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Ask Miyagi',
};

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 2, 2026</p>

      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-semibold text-gray-100 mt-8">Overview</h2>
        <p>
          Ask Miyagi respects your privacy. This policy
          explains what information we collect, how we use it, and your rights regarding that
          information.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">What We Collect</h2>
        <p>
          <strong>Currently, we collect minimal information:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Preview access cookie</strong> — When you enter a valid invite code, we store a
            small cookie in your browser to remember your access. This cookie contains only your
            invite code and expires after 30 days.
          </li>
          <li>
            <strong>Local storage</strong> — We store your preview access status and terms agreement
            in your browser&apos;s local storage. This data never leaves your device.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Personal information (name, email, phone number)</li>
          <li>Usage analytics or tracking data</li>
          <li>IP addresses or device fingerprints</li>
          <li>Tutorial progress or interaction data</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">How We Use Information</h2>
        <p>
          The preview access cookie is used solely to determine whether you have been granted access
          to the platform. It is checked on each page load to verify your preview status. No other
          purpose.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Third Parties</h2>
        <p>
          We do not share any information with third parties. The platform is hosted on Vercel,
          which may collect standard web server logs (IP address, request timestamps) as part of
          their hosting service. See{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            className="text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel&apos;s Privacy Policy
          </a>{' '}
          for details.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Cookies</h2>
        <p>
          We use a single functional cookie:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse mt-2">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="py-2 pr-4 text-gray-400 font-medium">Name</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Purpose</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--card-border)]/50">
                <td className="py-2 pr-4 font-mono text-xs">preview_access</td>
                <td className="py-2 pr-4">Stores your invite code to maintain preview access</td>
                <td className="py-2 pr-4">30 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Your Rights</h2>
        <p>You can at any time:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Clear your browser cookies and local storage to remove all data</li>
          <li>Use the platform in a private/incognito window</li>
          <li>Request information about what data we hold (currently: none beyond the cookie)</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Changes to This Policy</h2>
        <p>
          If we begin collecting additional information (such as analytics or user accounts),
          this policy will be updated and preview participants will be notified. The &quot;Last
          updated&quot; date at the top of this page will reflect the most recent revision.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Contact</h2>
        <p>
          For privacy-related questions, please reach out through the preview program channels
          provided with your invite code.
        </p>
      </section>
    </article>
  );
}
