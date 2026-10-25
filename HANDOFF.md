# Handoff

> Generated: 2026-10-24  
> Project: Convora Reach (Instagram DM Automation — separate from Convora CRM)  
> Session summary: Built full Instagram DM automation inside CRM, now extracting into standalone product at reach.convora.io

## Goal

Build **Convora Reach** as a standalone Instagram DM automation product (like CreatorFlow.so) at `reach.convora.io`. Separate Next.js app, own codebase, own webhook handler, own deployment. Automates comment-to-DM flows, keyword triggers, email capture, post publishing, analytics. Must pass Meta App Review for 8 permissions.

## Current State

**Working:**
- Instagram Business Login OAuth (connect via IG, no Facebook needed)
- DM sync from API (pulls conversations into DB)
- DM inbox UI (two-panel, send replies works)
- Automations CRUD UI (keyword triggers)
- Post publishing (upload image → publish to IG)
- IG Insights API (reach, profile views, followers)
- Analytics + contacts + rewind UI
- All Meta API calls tested via CLI
- Meta App "Convora Reach" (App ID: `1470298557870573`) created and published
- Deployed at `reach.convora.io` (same Vercel project as CRM — THIS is the problem)

**Broken:**
- **Webhooks fail HMAC** — shared handler tries 3 app secrets, none match. Meta backed off after 50+ 403s. No real-time comment/DM delivery.
- **Comment automation doesn't fire** — depends on webhooks
- **Analytics page errors** — API base URL mismatch (fixed in latest commit, unverified)
- **Everything tangled with CRM** — one codebase, one deployment, shared webhook endpoint

## Files in Play

| File | Why It Matters |
|------|---------------|
| `src/lib/instagram.ts` | Core IG API lib — all functions accept `apiBase?`. Copy to new project. |
| `src/app/api/webhooks/meta/route.ts` | 900+ line shared handler — root of webhook problems. Don't copy — rewrite for Reach only. |
| `src/app/api/instagram/callback/route.ts` | Generic OAuth callback. Copy pattern. |
| `src/app/api/orgs/[slug]/instagram/*/` | All Instagram API routes (sync, conversations, automations, publish, upload, insights, analytics, rewind). Copy and adapt. |
| `src/app/(dashboard)/app/[orgSlug]/instagram/*/` | All Instagram UI pages. Copy and adapt. |
| `prisma/schema.prisma` | 5 Instagram models. Copy to new project (shared DB is fine). |
| `docs/meta-app-review-answers-convora-reach.md` | App Review answers for 9 permissions — ready to submit. |
| `docs/video-recording-script-convora-reach.md` | Video script for review demo. |

## What Has Been Tried (and Why It Failed)

### Attempt 1: Shared webhook for CRM + Instagram
- **What:** Extended `/api/webhooks/meta` to handle leadgen + comments + DMs + story mentions
- **Why it failed:** One endpoint, two apps, different signing secrets. HMAC never matched for Instagram events. After 50+ 403s Meta stopped delivering.

### Attempt 2: Multiple app secrets in HMAC check
- **What:** Checked `META_APP_SECRET`, `REACH_APP_SECRET`, and `INSTAGRAM_APP_SECRET`
- **Why it failed:** None matched. Also had trailing whitespace in env var. Fixed whitespace + added `.trim()` but Meta already backed off.

### Attempt 3: Relaxed signature check
- **What:** Changed to warn-only (no 403 rejection)
- **Why it failed:** Too late — Meta already stopped delivering webhooks.

### Attempt 4: API base URL
- **What:** All Instagram lib functions used `graph.facebook.com` but IG Login tokens need `graph.instagram.com`
- **Why it partially failed:** Fixed by adding `apiBase?` param to all functions and passing `config.api_base`. Fixed DM sending but analytics/rewind still need verification.

## Current Best Theory

Build Convora Reach as a **completely separate Next.js app**:
- Own codebase at `/Users/mayur/Downloads/convora-reach/`
- Own webhook endpoint — single app secret, clean HMAC
- Copy the working Instagram lib + UI from CRM
- Same PostgreSQL DB (Instagram tables are independent)
- Own Vercel project linked to `reach.convora.io`

Open-source references to study:
- `github.com/SashenJayathilaka/SAAS-Instagram-DM-Automations` — Next.js SaaS, closest to what we want
- `github.com/paulmil11/manychat-lite-cloudflare` — minimal, good webhook pattern
- `github.com/ryanlaiyanip-ctrl/chatmany` — ManyChat alternative

## Code to Copy from CRM

The CRM codebase at `/Users/mayur/Downloads/leadflow-crm/` has working Instagram code. Copy these:

**Copy as-is (working):**
- `src/lib/instagram.ts` — API lib (all functions accept `apiBase?`). Core of the product.
- `src/app/(dashboard)/app/[orgSlug]/instagram/inbox/page.tsx` — DM inbox UI (two-panel)
- `src/app/(dashboard)/app/[orgSlug]/instagram/automations/page.tsx` — Automation manager UI
- `src/app/(dashboard)/app/[orgSlug]/instagram/analytics/page.tsx` — Analytics dashboard
- `src/app/(dashboard)/app/[orgSlug]/instagram/contacts/page.tsx` — Contacts list + CSV export
- `src/app/(dashboard)/app/[orgSlug]/instagram/publish/page.tsx` — Post publisher with image upload
- `src/app/(dashboard)/app/[orgSlug]/instagram/page.tsx` — Settings/connection page
- `src/app/api/orgs/[slug]/instagram/sync/route.ts` — DM sync from API
- `src/app/api/orgs/[slug]/instagram/conversations/*/` — Conversation APIs
- `src/app/api/orgs/[slug]/instagram/automations/*/` — Automation CRUD APIs
- `src/app/api/orgs/[slug]/instagram/publish/route.ts` — Content publishing API
- `src/app/api/orgs/[slug]/instagram/upload/route.ts` — Image upload API
- `src/app/api/orgs/[slug]/instagram/insights/route.ts` — Native IG insights API
- `src/app/api/orgs/[slug]/instagram/analytics/route.ts` — Automation analytics API
- `src/app/api/orgs/[slug]/instagram/rewind/route.ts` — Rewind API
- `src/app/api/instagram/callback/route.ts` — OAuth callback (generic, org from state param)

**Rewrite from scratch (broken in CRM):**
- Webhook handler — the CRM's `src/app/api/webhooks/meta/route.ts` is 900+ lines handling both leadgen + Instagram. Build a clean dedicated handler for Instagram only.

**Prisma models to copy (from `prisma/schema.prisma`):**
- `instagram_automations` — keyword triggers + follow gate + email capture config
- `instagram_conversations` — DM conversations with pending_automation_id state
- `instagram_messages` — individual DM messages with ig_message_id unique
- `instagram_contacts` — captured leads/emails from automations
- `instagram_automation_logs` — analytics tracking per automation trigger

Plus you'll need: `organizations` (workspaces), `user_profiles` (auth), `org_memberships` (roles), `org_integrations` (stores IG tokens).

## Next Steps

1. Study the 3 open-source repos for architecture patterns (especially SashenJayathilaka's)
2. Create new Next.js app in this directory (`/Users/mayur/Downloads/convora-reach/`)
3. Create new PostgreSQL database: `convora_reach`
4. Set up Prisma with Instagram models + auth models
5. Copy `src/lib/instagram.ts` from CRM
6. Build dedicated webhook handler at `/api/webhooks/instagram` — single secret, clean HMAC with `dd87032bd070273c95af46f5aff90fb5`
6. Build OAuth flow at `/api/auth/instagram/callback`
7. Copy and adapt all Instagram UI pages
8. Deploy to Vercel, link to `reach.convora.io`
9. Update Convora Reach webhook URL in Meta Dashboard
10. Test: comment → webhook → auto-reply + DM
11. Record video, submit App Review

## Key Constraints

- **Meta App:** Convora Reach, App ID `1470298557870573`, IG App ID `1265737819063214`
- **App Secret:** `dd87032bd070273c95af46f5aff90fb5` (for webhook HMAC)
- **IG App Secret:** `30c179cb8dea923d56788c596f39e84f` (for OAuth token exchange)
- **Webhook verify token:** `Ep6V8u7PsoCz9LrPlqYn4GZQaAwAnCmN6qZ4qI9E`
- **Domain:** `reach.convora.io` (CNAME to Vercel already configured)
- **Database:** NEW `convora_reach` on PostgreSQL at `72.60.101.180:5432`. Create: `psql -h 72.60.101.180 -U leadflow_user -d postgres -c "CREATE DATABASE convora_reach OWNER leadflow_user;"`. Separate from CRM's `leadflow_crm`.
- **DB connection:** `postgresql://leadflow_user:LeadFlowCRM2026Secure@72.60.101.180:5432/convora_reach`
- **GitHub repo:** Create `mayurchheta/ConvoraReach` (new)
- **Vercel project:** Create new project `convora-reach`, link `reach.convora.io` domain to it (remove from current CRM project first)
- **Connected test account:** @convora.io (Business, IG user ID: `17841472248648287`)
- **Git author for deploys:** `convora <convora.io@gmail.com>`
- **8 permissions:** instagram_business_basic, manage_messages, manage_comments, content_publish, manage_insights, tagged_content, profile_management, Human Agent
- **Policy pages** already live at reach.convora.io/privacy, /terms, /data-deletion
- **Review answers** ready in `docs/meta-app-review-answers-convora-reach.md`
- **UI style:** Like CreatorFlow.so, dark mode support, shadcn/ui (base-ui backed, NO asChild)
- **Vercel account:** convora.io@gmail.com
- **GitHub:** mayurchheta/ConvoraCRM (existing), need new repo for Reach
