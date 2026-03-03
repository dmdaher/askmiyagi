import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer — Ask Miyagi',
};

export default function DisclaimerPage() {
  return (
    <article>
      <h1 className="text-2xl font-bold text-gray-100 mb-2">Disclaimer</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: March 2, 2026</p>

      <section className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <h2 className="text-lg font-semibold text-gray-100 mt-8">No Affiliation</h2>
        <p>
          Ask Miyagi is an <strong>independent educational project</strong>.
          It is <strong>not affiliated with, endorsed by, or sponsored by Roland Corporation, Boss Corporation,
          or any of their subsidiaries</strong>.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Trademarks</h2>
        <p>
          Roland is a registered trademark of Roland Corporation. Fantom is a product of Roland Corporation.
          Boss is a division of Roland Corporation.
          All other product names, logos, and brands mentioned on this site are the property
          of their respective owners. These names are used solely for identification and
          educational purposes and do not imply any affiliation or endorsement.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Educational Purpose</h2>
        <p>
          This platform is designed exclusively for educational purposes — helping musicians
          learn to use their instruments through interactive tutorials. The digital representations
          of hardware instruments are simplified educational aids and do not replicate the full
          functionality of the actual products.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">No Warranty</h2>
        <p>
          This software is provided &quot;as is&quot; without warranty of any kind, express or implied.
          The tutorials and information presented may contain errors or inaccuracies.
          Always refer to the official product documentation from the manufacturer for
          authoritative information about your instrument.
        </p>

        <h2 className="text-lg font-semibold text-gray-100 mt-8">Not a Substitute</h2>
        <p>
          This platform is a <strong>learning supplement</strong>, not a replacement for
          official product manuals, authorized training, or professional instruction.
          Users should always consult official documentation for critical operations
          such as firmware updates, factory resets, or system configuration.
        </p>

      </section>
    </article>
  );
}
