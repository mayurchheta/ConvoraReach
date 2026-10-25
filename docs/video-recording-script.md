# Video Recording Script — Convora Reach App Review

Record ONE continuous video, ~5-7 minutes. Use screen recording (QuickTime/Loom).
Keep the URL bar visible throughout showing `reach.convora.io`.

---

## Scene 1: OAuth Flow + instagram_business_basic (45s)

1. Open `https://reach.convora.io/login` — log in with test credentials
2. Click **Settings** in the sidebar
3. Click **"Connect with Instagram"** (purple button)
4. Instagram login page opens — sign in with your Instagram Professional account
5. Grant all permissions on the consent screen
6. Redirected back — settings page shows **Connected: @your_username**
7. **Narrate:** *"The app uses Instagram Business Login to connect the account. After connecting, the username and account ID are displayed in the settings page."*

---

## Scene 2: instagram_business_profile_management (20s)

1. Still on the Settings page — point out the connected account info
2. Go to **Analytics** — show the Followers count and profile data
3. **Narrate:** *"Profile management permission lets us display the account's profile details and track follower growth alongside automation analytics."*

---

## Scene 3: instagram_business_manage_comments (60s)

1. Go to **Automations** in the sidebar
2. Click **New Automation**
3. Fill in:
   - Name: "Test Link Automation"
   - Trigger Type: Comment Keyword
   - Keywords: TESTLINK
   - Comment Reply: "Check your DMs! Sending you the link now."
   - DM Message: "Hey! Here's the link you asked for: https://example.com"
4. Click **Create Automation**
5. Switch to **Instagram app** (phone or web) on a **different account**
6. Comment **"TESTLINK"** on a post from the connected account
7. Wait ~10-30 seconds — show the auto-reply appearing on the comment
8. **Narrate:** *"When a user comments the keyword, the app automatically replies to the comment using the manage_comments permission."*

---

## Scene 4: instagram_business_manage_messages (60s)

1. After the comment auto-reply, switch to the **test user's Instagram DMs**
2. Show the automated DM received from the connected account
3. **Narrate:** *"The app also sent a private DM with the configured link using the manage_messages permission."*
4. Switch to **Convora Reach → DM Inbox** in the sidebar
5. Show the conversation in the left panel
6. Click on it — show the message thread
7. Type a reply: "Thanks for your interest! Let me know if you have questions."
8. Click **Send**
9. Switch to the test user's Instagram — show the reply appeared
10. **Narrate:** *"Business owners can view and reply to all Instagram DMs directly from the inbox. Rate limiting ensures messages are sent responsibly — 200 per hour with 12-second spacing."*

---

## Scene 5: Human Agent (20s)

1. Still in the DM Inbox
2. **Narrate:** *"With the Human Agent permission, our inbox allows agents to respond within 7 days instead of the standard 24-hour window. This is critical when the business is closed on weekends or when inquiries require internal coordination before responding."*

---

## Scene 6: instagram_business_content_publish (45s)

1. Go to **Publish** in the sidebar
2. Upload an image or paste an image URL
3. Write a caption: "Test post from Convora Reach"
4. Click **Publish to Instagram**
5. Show the success message with Media ID
6. Switch to Instagram — show the post appeared on the profile
7. **Narrate:** *"The content publish permission lets businesses publish posts directly from the dashboard without switching to Instagram."*
8. *(Delete the test post after recording)*

---

## Scene 7: instagram_business_manage_insights (30s)

1. Go to **Analytics** in the sidebar
2. Show the dashboard with:
   - Automation stats: DMs Sent, Emails Captured, Comments Replied
   - Instagram Insights: Reach, Accounts Engaged, Profile Views, Followers
   - Daily chart
   - Top Posts table
3. Toggle the period selector (7d / 30d / 90d)
4. **Narrate:** *"The insights permission provides account-level analytics — reach, engagement, and profile views — displayed alongside automation performance metrics."*

---

## Scene 8: instagram_business_tagged_content (20s)

1. **Narrate:** *"The tagged content permission allows our app to monitor when other users tag the business in posts or stories. This enables automations like sending thank-you DMs to users who tag the business, turning organic brand mentions into engagement opportunities."*

---

## Scene 9: Contacts + Email Capture (20s)

1. Go to **Contacts** in the sidebar
2. Show the contacts table (emails captured, usernames, source)
3. Click **Export CSV** to download
4. **Narrate:** *"All leads captured through automations are stored in the contacts list and can be exported as CSV for use in email marketing or CRM systems."*

---

## Scene 10: Safety Features (15s)

1. **Narrate:** *"Convora Reach includes built-in safety features: rate limiting at 200 DMs per hour with 12-second spacing, permanent opt-out when users send STOP, and HMAC signature verification on all webhooks. Privacy policy, terms of service, and data deletion instructions are available at the bottom of every page."*

---

## Recording Tips

- Clean browser, no other tabs visible
- Keep URL bar showing `reach.convora.io` throughout
- Dark mode (the app is dark by default)
- Resolution: 1920x1080 or higher
- Speak clearly and slowly
- Show Instagram app **side-by-side** when demonstrating DMs received
- Total duration: aim for **5-6 minutes**, max 7 minutes
- One continuous recording — don't splice separate clips
- Delete any test posts after recording

## App Credentials for Video

- URL: https://reach.convora.io/login
- Email: convora.io@gmail.com
- Password: admin123
- Connected IG: @convora.io
