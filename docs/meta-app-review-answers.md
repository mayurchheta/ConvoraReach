# Meta App Review Answers — Convora Reach

App: **Convora Reach** (App ID: 1470298557870573)
Instagram App ID: 1265737819063214
Domain: reach.convora.io

---

## 1. Human Agent

**Description:**

Convora Reach is an Instagram DM automation platform that helps businesses manage Instagram conversations at scale. The Human Agent feature is essential because our users' sales and support teams cannot always respond within the standard 24-hour messaging window.

Here is how it works: When an Instagram user engages with a business — by commenting a keyword on a post, replying to a story, or sending a DM — our automation sends an instant response (a link, product info, or a lead capture message). The user often follows up with questions about pricing, availability, custom orders, or support issues. These follow-up conversations require a human agent to respond, not another automated message.

The Human Agent feature is necessary in these real scenarios:

1. Weekend and holiday closures: A user comments "PRICE" on a Friday evening post and receives the automated pricing link. They reply with "Can I get a bulk discount?" — the sales team is off until Monday and cannot respond within 24 hours.

2. Complex inquiries: A user asks about custom product specifications that require the sales agent to check with the manufacturing team, which takes 2-3 business days.

3. Multi-timezone businesses: Our platform serves businesses whose customers are in different time zones. A message received at 11 PM local time may not be seen until the next business day, leaving very little of the 24-hour window for a thoughtful response.

With the Human Agent feature, our DM Inbox allows the assigned sales agent to reply within 7 days using the human_agent message tag. This ensures no lead is lost due to timing constraints, directly increasing conversion rates for businesses using our platform.

---

## 2. instagram_business_basic

**Description:**

Convora Reach uses instagram_business_basic as the foundational permission for our Instagram automation platform. When a business connects their Instagram Professional account via Instagram Business Login, we use this permission to:

1. Read the account's user_id and username to identify and display the connected account in our settings dashboard
2. Display the connected Instagram profile information (username, account type) so the business owner can confirm the correct account is linked
3. Retrieve the Instagram-scoped user ID (IGSID) which is required as the sender identity for all subsequent API calls — sending DMs, replying to comments, publishing posts, and fetching insights

This permission is also a required dependency for all other Instagram permissions requested.

**Testing instructions for reviewer:**

1. Go to https://reach.convora.io/login
2. Log in with:
   - Email: `meta-tester@reach.convora.io`
   - Password: `MetaReview2026!`
3. Click **Settings** in the sidebar
4. Click **"Connect with Instagram"** (purple button)
5. Complete the Instagram Business Login flow with your Instagram Professional test account
6. After redirect, the settings page displays the connected account's username and account ID

---

## 3. instagram_business_manage_messages

**Description:**

Convora Reach uses instagram_business_manage_messages to power our core Instagram DM automation and inbox features:

1. Comment-to-DM Automation: When someone comments a specific keyword on an Instagram post (e.g., "LINK", "INFO", "PRICE"), our system automatically sends them a private DM with the business's configured response — a product link, pricing info, or a lead capture message.

2. Story Reply Automation: When someone replies to an Instagram story, our system can automatically send a DM with configured content based on keyword matching.

3. DM Keyword Triggers: When someone sends a DM containing a specific keyword, our system auto-replies with the configured message and link.

4. Email Capture Flow: Optionally, the automation asks for the user's email address before sending the link. The user replies with their email, our system validates it, stores it as a lead, and then sends the link.

5. Follow Gate: Optionally, the automation checks if the user follows the business account before sending the DM. If they don't follow, it asks them to follow first.

6. DM Inbox: Business owners view, manage, and reply to all Instagram DM conversations directly within Convora Reach's two-panel inbox interface.

7. Rate Limiting & Opt-Out: We enforce rate limits (200 DMs/hour, 12-second spacing) and permanently honor STOP/unsubscribe requests.

**Testing instructions for reviewer:**

1. Log in at https://reach.convora.io/login with test credentials above
2. Go to **Automations** → Create new automation with keyword trigger
3. Comment the keyword on a post from the connected account (from a different IG account)
4. The commenter receives an automated DM within 30 seconds
5. Go to **DM Inbox** to view the conversation and send a manual reply

---

## 4. instagram_business_manage_comments

**Description:**

Convora Reach uses instagram_business_manage_comments to power our comment automation features:

1. Reading Comments via Webhooks: When someone comments on a business's Instagram post, our webhook receives the comment text and commenter's ID. We match the comment text against configured keyword triggers.

2. Auto-Replying to Comments: When a keyword match is found, our system posts a public reply to the comment (e.g., "Check your DMs! Sending you the link now.").

3. Triggering DM Automation: The matched comment simultaneously triggers a private DM to the commenter.

4. Rewind Feature: Businesses can retroactively process comments on past posts. Our system fetches all comments on a selected post, matches keywords, and sends DMs to commenters who haven't been contacted yet.

**Testing instructions for reviewer:**

1. Log in at https://reach.convora.io/login with test credentials
2. Go to **Automations** → Create a "Comment Keyword" automation
3. Set keywords, comment reply, and DM message
4. From a different Instagram account, comment the keyword on a post
5. The comment receives an auto-reply and the commenter receives a DM
6. Go to **Settings** → scroll to Rewind section to retroactively process past comments

---

## 5. instagram_business_content_publish

**Description:**

Convora Reach uses instagram_business_content_publish to allow businesses to publish Instagram posts directly from our platform. This is part of our unified Instagram management experience.

How it works:
1. Navigate to **Publish** in the sidebar
2. Upload an image or paste a publicly accessible image URL
3. Write a caption (up to 2,200 characters with live character counter)
4. Click "Publish to Instagram"
5. The post appears on the Instagram feed

**Testing instructions for reviewer:**

1. Log in and go to **Publish**
2. Upload a test image or paste an image URL
3. Write a caption and click Publish
4. Verify the post appears on the connected Instagram account's feed

---

## 6. instagram_business_manage_insights

**Description:**

Convora Reach uses instagram_business_manage_insights to display analytics in our dashboard:

1. Account-level metrics: Reach, Accounts Engaged, Profile Views (daily breakdown over 7d/30d/90d)
2. Follower count tracking
3. Per-media insights: Reach, Impressions, Likes, Comments for top posts
4. Automation analytics: DMs sent, emails captured, comment replies, trigger counts with daily charts

**Testing instructions for reviewer:**

1. Log in and go to **Analytics**
2. Toggle period selector (7d / 30d / 90d)
3. View Instagram Insights section (reach, engagement, followers)
4. View automation performance charts and per-automation breakdown

---

## 7. instagram_business_tagged_content

**Description:**

Convora Reach uses instagram_business_tagged_content to help businesses track posts where they are tagged or mentioned by other Instagram users. Our tagged content API endpoint fetches tagged media so businesses can monitor brand mentions and trigger engagement automations such as sending thank-you DMs to users who tag them.

---

## 8. instagram_business_profile_management

**Description:**

Convora Reach uses instagram_business_profile_management to display the connected account's full profile information — username, bio, website, profile picture, follower/following counts, and media count. This data is displayed in the dashboard and analytics pages to give business owners a complete view of their Instagram presence.

---

## Reviewer Testing Instructions

### App Access

- **App URL:** https://reach.convora.io
- **Login page:** https://reach.convora.io/login
- **Login email:** `meta-tester@reach.convora.io`
- **Login password:** `MetaReview2026!`

### Navigation Guide

After login, you are redirected to the Dashboard. Use the sidebar:

| Page | What it does |
|------|-------------|
| **Dashboard** | Overview stats and quick access links |
| **DM Inbox** | View and reply to Instagram DM conversations |
| **Automations** | Create and manage keyword triggers |
| **Analytics** | Automation + Instagram account performance |
| **Contacts** | Captured leads (emails, usernames), CSV export |
| **Publish** | Publish photo posts to Instagram |
| **Settings** | Connect/disconnect Instagram, sync DMs, rewind |
| **Profile** | Edit user profile, change password |

### OAuth Flow

1. Click **Settings** in the sidebar
2. Click **"Connect with Instagram"**
3. Instagram's authorization page opens — sign in with your test Professional account
4. Grant all permissions on the consent screen
5. Redirected back — settings page shows the connected account

### Privacy & Compliance

- **Privacy Policy:** https://reach.convora.io/privacy (lists all 8 permissions and data usage)
- **Terms of Service:** https://reach.convora.io/terms (lists all permissions, rate limiting, acceptable use)
- **Data Deletion:** https://reach.convora.io/data-deletion (step-by-step instructions)
- **Contact:** https://reach.convora.io/contact

### Safety Features

- Rate limiting: 200 DMs/hour maximum, 12-second spacing between messages
- Opt-out: Users can send "STOP" or "unsubscribe" to permanently opt out of automated messages
- Idempotency: Each comment/message is processed only once (deduplication via unique constraints)
- HMAC verification: All webhook payloads verified with SHA-256 signature

### Important Notes

- Do NOT provide Instagram account credentials — the reviewer connects their own test account
- The app requires an Instagram Professional account (Business or Creator)
- All data is scoped to the connected account only (multi-tenant isolation)
