export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-zinc-500 mb-8">Last updated: October 25, 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Convora Reach at reach.convora.io (&quot;the Service&quot;), you agree to be
              bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Convora Reach is an Instagram DM automation platform that allows businesses and creators to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Automatically reply to Instagram comments with Direct Messages based on keyword triggers</li>
              <li>Manage Instagram DM conversations from a unified inbox</li>
              <li>Capture email addresses and phone numbers from followers through automation flows</li>
              <li>Publish content directly to Instagram feeds</li>
              <li>View analytics and insights for automations and Instagram account performance</li>
              <li>Retroactively send DMs to commenters on past posts (Rewind feature)</li>
              <li>View posts where the account is tagged</li>
            </ul>
            <p className="mt-3">
              All features operate through Instagram&apos;s official Graph API and require a valid Instagram
              Business or Creator account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Requirements</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must have a valid Instagram Business or Creator account to use the Service</li>
              <li>You must authorize Convora Reach to access your Instagram account through Instagram Business Login (OAuth)</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old or the age of majority in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Instagram API Permissions</h2>
            <p className="mb-3">
              Convora Reach requests the following Instagram permissions to provide its services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>instagram_business_basic:</strong> To read your account profile information and media</li>
              <li><strong>instagram_manage_messages:</strong> To send and receive Direct Messages on your behalf</li>
              <li><strong>instagram_manage_comments:</strong> To read and reply to comments on your posts</li>
              <li><strong>instagram_content_publish:</strong> To publish images and captions to your Instagram feed</li>
              <li><strong>instagram_manage_insights:</strong> To access account and media analytics</li>
              <li><strong>instagram_tagged_content:</strong> To view posts where your account is tagged</li>
              <li><strong>instagram_profile_management:</strong> To access and display your profile details</li>
              <li><strong>Human Agent:</strong> To respond to Direct Messages beyond the 24-hour standard messaging window</li>
            </ul>
            <p className="mt-3">
              You may revoke these permissions at any time by disconnecting your Instagram account from
              Convora Reach or by removing the app from your Instagram account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service to send spam, unsolicited messages, or harassing content</li>
              <li>Violate Instagram&apos;s Terms of Service or Meta&apos;s Platform Policies</li>
              <li>Use the Service to collect personal data without consent</li>
              <li>Attempt to circumvent rate limits or safety mechanisms</li>
              <li>Use the Service for any illegal purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Rate Limiting &amp; Safety</h2>
            <p>
              Convora Reach enforces rate limits on automated messages (maximum 200 DMs per hour with
              minimum 12-second spacing) to comply with Meta&apos;s platform policies and protect your account.
              Users who send &quot;STOP&quot;, &quot;unsubscribe&quot;, or similar opt-out keywords are permanently
              excluded from receiving automated messages from your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>
              Convora Reach is provided &quot;as is&quot; without warranties of any kind. We are not responsible
              for any actions taken by Meta/Instagram on your account as a result of using automation features.
              We are not liable for any lost data, revenue, or business opportunities arising from the use of
              the Service. Use automation responsibly and within Instagram&apos;s platform guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
            <p>
              You may stop using the Service at any time by disconnecting your Instagram account and
              deleting your Convora Reach account. We reserve the right to suspend or terminate accounts
              that violate these Terms or Instagram&apos;s policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
            <p>
              For questions about these Terms, please contact us at:{" "}
              <a href="mailto:convora.io@gmail.com" className="text-purple-400 underline">convora.io@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
