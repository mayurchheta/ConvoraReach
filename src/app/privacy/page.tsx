export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 mb-8">Last updated: October 25, 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Convora Reach (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the website at reach.convora.io
              and provides Instagram DM automation services. This Privacy Policy explains how we collect,
              use, store, and protect your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">When you use Convora Reach, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Your name, email address, and password hash when you register.
              </li>
              <li>
                <strong>Instagram Business Profile Data:</strong> When you connect your Instagram account via
                Instagram Business Login (OAuth), we access your Instagram user ID, username, display name,
                profile picture, account type, media count, follower/following counts, biography, and website.
                This uses the <em>instagram_business_basic</em> and <em>instagram_profile_management</em> permissions.
              </li>
              <li>
                <strong>Instagram Messages:</strong> We access and store Instagram Direct Messages sent to and
                from your connected business account to power our DM inbox feature. This uses the
                <em> instagram_manage_messages</em> and <em>Human Agent</em> permissions, which allow us to
                respond to messages beyond the standard 24-hour messaging window.
              </li>
              <li>
                <strong>Instagram Comments:</strong> We receive and process comments on your posts, reels, and
                stories to trigger keyword-based automations. This uses the <em>instagram_manage_comments</em> permission.
              </li>
              <li>
                <strong>Instagram Insights:</strong> We access your account-level and media-level analytics
                (reach, impressions, engagement, profile views, follower counts) to display in our analytics
                dashboard. This uses the <em>instagram_manage_insights</em> permission.
              </li>
              <li>
                <strong>Tagged Content:</strong> We access posts and media where your account is tagged to help
                you track mentions and engagement. This uses the <em>instagram_tagged_content</em> permission.
              </li>
              <li>
                <strong>Published Content:</strong> When you use our publishing feature, we upload images and
                captions to your Instagram feed on your behalf. This uses the <em>instagram_content_publish</em> permission.
              </li>
              <li>
                <strong>Contact Data:</strong> Email addresses and phone numbers voluntarily provided by your
                Instagram followers through automation flows (email capture feature).
              </li>
              <li>
                <strong>Automation Logs:</strong> Records of automation triggers, DM deliveries, comment replies,
                and email captures for analytics and debugging purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide Instagram DM automation services (comment-to-DM, keyword triggers, email capture)</li>
              <li>To display your DM inbox and allow you to send/receive messages</li>
              <li>To show analytics and performance metrics for your automations and Instagram account</li>
              <li>To publish content to your Instagram feed when you use the publishing feature</li>
              <li>To enforce rate limiting and opt-out compliance for responsible API usage</li>
              <li>To maintain and improve the Service</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell, rent, or share your data with third parties for advertising or
              marketing purposes. Your data is used solely to power the features of Convora Reach.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage &amp; Security</h2>
            <p>
              Your data is stored in a PostgreSQL database hosted on secure infrastructure. Access tokens
              for Instagram are stored encrypted and are only used to make authorized API calls on your behalf.
              We use HMAC-SHA256 signature verification for all webhook deliveries to ensure data integrity.
              Passwords are hashed using bcrypt and are never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. When you disconnect your Instagram
              account or delete your Convora Reach account, we deactivate your integration and stop all
              automations. You may request complete data deletion at any time (see our{" "}
              <a href="/data-deletion" className="text-purple-400 underline">Data Deletion page</a>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
            <p>
              Convora Reach integrates with the following third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Meta/Instagram Graph API:</strong> To access and manage your Instagram business account data</li>
              <li><strong>imgbb / freeimage.host:</strong> Temporary image hosting for content publishing (images are auto-deleted after 10 minutes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your data by viewing your dashboard, inbox, contacts, and analytics</li>
              <li>Disconnect your Instagram account at any time from the Settings page</li>
              <li>Request data export by contacting us</li>
              <li>Request complete data deletion (see <a href="/data-deletion" className="text-purple-400 underline">Data Deletion</a>)</li>
              <li>Opt out of automated messages by sending &quot;STOP&quot; to any automation DM</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>
              For any privacy-related questions or requests, please contact us at:{" "}
              <a href="mailto:convora.io@gmail.com" className="text-purple-400 underline">convora.io@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
