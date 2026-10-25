export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Data Deletion Instructions</h1>
        <p className="text-zinc-500 mb-8">Last updated: October 25, 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How to Delete Your Data</h2>
            <p className="mb-4">
              Convora Reach allows you to delete your data at any time. There are two ways to remove your data:
            </p>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-4">
              <h3 className="font-semibold text-white mb-2">Option 1: Self-Service (Recommended)</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Log into your Convora Reach account at reach.convora.io</li>
                <li>Navigate to <strong>Settings</strong> (Instagram settings page)</li>
                <li>Click <strong>&quot;Disconnect Instagram&quot;</strong> to deactivate your integration</li>
                <li>This immediately stops all automations and webhook processing</li>
              </ol>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="font-semibold text-white mb-2">Option 2: Email Request</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Send an email to{" "}
                  <a href="mailto:convora.io@gmail.com" className="text-purple-400 underline">
                    convora.io@gmail.com
                  </a>{" "}
                  with the subject &quot;Data Deletion Request&quot;
                </li>
                <li>Include your registered email address and Instagram username</li>
                <li>We will process your request within 30 days</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What Data Gets Deleted</h2>
            <p className="mb-3">Upon a complete data deletion request, we will delete:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Instagram Integration Config:</strong> Access tokens, account IDs, connection settings</li>
              <li><strong>DM Conversations &amp; Messages:</strong> All stored Instagram Direct Message conversations and individual messages</li>
              <li><strong>Automation Configurations:</strong> All keyword triggers, comment replies, DM templates, follow gate settings, and email capture configurations</li>
              <li><strong>Automation Logs:</strong> All records of automation triggers, DM deliveries, and comment replies</li>
              <li><strong>Contacts:</strong> All captured email addresses, phone numbers, and follower data collected through automations</li>
              <li><strong>Opt-out Records:</strong> Records of users who opted out of automated messages</li>
              <li><strong>Account Data:</strong> Your user profile, organization, and membership data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Deletion via Instagram</h2>
            <p>
              You can also remove Convora Reach&apos;s access to your Instagram account directly through Instagram:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>Open the Instagram app</li>
              <li>Go to Settings &gt; Security &gt; Apps and Websites</li>
              <li>Find &quot;Convora Reach&quot; and tap Remove</li>
              <li>This revokes our API access immediately</li>
            </ol>
            <p className="mt-3">
              Note: Removing access through Instagram stops our API access but does not delete data already
              stored in our system. To delete stored data, please use one of the methods above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Meta Platform Data Deletion Callback</h2>
            <p>
              Convora Reach supports Meta&apos;s data deletion callback. When a user removes Convora Reach from
              their Instagram/Facebook settings, Meta sends us a deletion request and we process it within
              the required timeframe. A confirmation URL and tracking code are provided to the user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Timeline</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Self-service disconnect:</strong> Integration deactivated immediately, data retained for 30 days then deleted</li>
              <li><strong>Email request:</strong> Processed within 30 days of receipt</li>
              <li><strong>Meta callback:</strong> Processed within the timeframe required by Meta&apos;s platform policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              For data deletion requests or questions, email us at:{" "}
              <a href="mailto:convora.io@gmail.com" className="text-purple-400 underline">convora.io@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
