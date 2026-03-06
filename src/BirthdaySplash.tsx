import React, { useState } from 'react';

type BirthdaySplashProps = {
  onStartCreating: () => void;
};

const sparklePositions = [
  { left: '8%', top: '18%', delay: '0s', size: '18px' },
  { left: '20%', top: '65%', delay: '0.4s', size: '12px' },
  { left: '34%', top: '28%', delay: '1.1s', size: '16px' },
  { left: '50%', top: '80%', delay: '0.7s', size: '10px' },
  { left: '63%', top: '20%', delay: '1.6s', size: '20px' },
  { left: '76%', top: '56%', delay: '0.2s', size: '14px' },
  { left: '88%', top: '25%', delay: '1.3s', size: '17px' },
  { left: '92%', top: '72%', delay: '0.9s', size: '11px' },
];

export default function BirthdaySplash({ onStartCreating }: BirthdaySplashProps) {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <main className="birthday-splash" aria-label="Birthday splash page">
      <div className="birthday-glow" />
      {sparklePositions.map((sparkle, index) => (
        <span
          key={index}
          className="birthday-sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
            width: sparkle.size,
            height: sparkle.size,
          }}
          aria-hidden="true"
        />
      ))}

      <section className="birthday-card">
        <p className="birthday-subtitle">You Shine Bright</p>
        <h1 className="birthday-title">Happy 10th Birthday</h1>
        <button type="button" className="birthday-start-button" onClick={onStartCreating}>
          Start Creating
        </button>
        <button 
          type="button" 
          className="birthday-policy-link" 
          onClick={() => setShowPrivacyModal(true)}
        >
          Privacy Policy Statement
        </button>
      </section>

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Privacy Policy Statement</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-sm text-gray-400 mb-4">Last updated: March 4, 2026</p>
              
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <p className="mb-4">
                  PixelSprite ("PixelSprite," "we," "our," or "us"), operated by
                  <strong>True Lavender LLC</strong>, uses analytics technologies to understand how users interact
                  with the Site and to improve performance, usability, and product features.
                </p>
                <p>
                  We are committed to collecting only the minimum data necessary for legitimate business purposes and
                  to complying with applicable privacy laws, including the General Data Protection Regulation (GDPR)
                  and the California Consumer Privacy Act (CCPA/CPRA).
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-2">1. Analytics Provider</h3>
              <p className="mb-4">PixelSprite uses <strong>Google Analytics 4 (GA4)</strong> to collect and analyze usage data.</p>
              <p className="mb-2">Google Analytics may collect information such as:</p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Pages visited</li>
                <li>Session duration</li>
                <li>Device type and browser</li>
                <li>Operating system</li>
                <li>Referring website</li>
                <li>Approximate geographic location (country, region, or city level)</li>
                <li>Interaction events (such as canvas interaction, save, export, or share actions)</li>
              </ul>
              <p className="mb-4">Google Analytics does not provide PixelSprite with precise location data.</p>
              <p className="mb-4">We have enabled IP anonymization where applicable.</p>
              <p className="mb-4">We do not intentionally send personally identifiable information (PII) to Google Analytics.</p>

              <h3 className="text-lg font-semibold mb-2">2. Legal Basis for Processing (GDPR)</h3>
              <p className="mb-4">
                If you are located in the European Economic Area (EEA) or United Kingdom, we process analytics data under one
                or more of the following lawful bases:
              </p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li><strong>Consent</strong>, where required (for non-essential cookies or analytics tracking)</li>
                <li><strong>Legitimate interests</strong>, to improve site functionality, security, and user experience</li>
              </ul>
              <p className="mb-4">
                Where consent is required by law, you may manage your preferences through your browser settings or applicable
                consent tools.
              </p>

              <h3 className="text-lg font-semibold mb-2">3. CCPA / CPRA Disclosure (California Residents)</h3>
              <p className="mb-4">
                Under California law, analytics data may constitute "personal information" if it can reasonably be
                associated with a consumer or household.
              </p>
              <p className="mb-2">PixelSprite:</p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Does not sell personal information</li>
                <li>Does not knowingly share personal information for cross-context behavioral advertising</li>
                <li>Uses analytics data solely for internal product improvement and performance measurement</li>
              </ul>
              <p className="mb-4">If you are a California resident, you may request:</p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Disclosure of personal information collected</li>
                <li>Deletion of personal information (subject to legal exceptions)</li>
                <li>Information about categories of data processed</li>
              </ul>
              <p className="mb-4">
                To exercise your rights, contact:
                <a href="mailto:privacy@pixelsprite.com" className="text-blue-400 hover:text-blue-300">privacy@pixelsprite.com</a>
              </p>
              <p className="mb-4">We will not discriminate against you for exercising your privacy rights.</p>

              <h3 className="text-lg font-semibold mb-2">4. Data Association Acknowledgment</h3>
              <p className="mb-4">
                True Lavender LLC acknowledges that it has implemented appropriate privacy disclosures and, where required,
                obtained necessary permissions or consent from its end users for the collection and processing of their data,
                including the association of such data with visitation information Google Analytics collects from PixelSprite.
              </p>

              <h3 className="text-lg font-semibold mb-2">5. Cookies and Tracking Technologies</h3>
              <p className="mb-2">Google Analytics uses cookies and similar technologies to:</p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Distinguish users</li>
                <li>Measure traffic patterns</li>
                <li>Analyze product usage</li>
                <li>Improve platform stability</li>
              </ul>
              <p className="mb-4">Some analytics cookies may be considered non-essential in certain jurisdictions.</p>
              <p className="mb-2">You may:</p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Disable cookies through your browser settings</li>
                <li>Use browser-based opt-out tools</li>
                <li>Install the Google Analytics Opt-Out Browser Add-on (if available)</li>
              </ul>
              <p className="mb-4">Disabling cookies may impact certain features of the Site.</p>

              <h3 className="text-lg font-semibold mb-2">6. Data Retention</h3>
              <p className="mb-4">
                Analytics data is retained only as long as necessary for reporting and product improvement purposes and in
                accordance with Google Analytics retention settings.
              </p>
              <p className="mb-4">We periodically review data retention practices to ensure compliance with applicable law.</p>

              <h3 className="text-lg font-semibold mb-2">7. Children's Data</h3>
              <p className="mb-4">PixelSprite is not directed to children under the age of 13.</p>
              <p className="mb-4">We do not knowingly collect personal information from children under 13 through analytics tools.</p>
              <p className="mb-4">
                If we become aware that such data has been collected inadvertently, we will take reasonable steps to delete it.
              </p>

              <h3 className="text-lg font-semibold mb-2">8. International Data Transfers</h3>
              <p className="mb-4">
                Analytics data may be processed by Google on servers located outside your country of residence, including in
                the United States.
              </p>
              <p className="mb-4">
                Where required by law, appropriate safeguards are implemented in accordance with applicable data protection
                regulations.
              </p>

              <h3 className="text-lg font-semibold mb-2">9. Your Rights</h3>
              <p className="mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside mb-4 ml-4">
                <li>Access your data</li>
                <li>Request correction</li>
                <li>Request deletion</li>
                <li>Object to processing</li>
                <li>Restrict processing</li>
                <li>Withdraw consent</li>
                <li>Request data portability</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, contact:
                <a href="https://antoinettewilliams.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">https://antoinettewilliams.com/</a>
              </p>

              <div className="mt-6 pt-4 border-t border-gray-700 text-sm text-gray-400">
                <p>All rights reserved @True Lavender</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
