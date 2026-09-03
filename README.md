# House of Nannies — Trial Task

A working demo of the candidate profile sharing flow for House of Nannies. Families receive a secure, tokenized link to view a candidate profile, and can pay a placement deposit via Stripe.

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)
- A [Stripe](https://stripe.com) account (test mode)
- A [Resend](https://resend.com) account (free tier)

### Setup

1. **Clone and install:**

```bash
npm install
```

2. **Copy the env file and fill in your keys:**

```bash
cp .env.local.example .env.local
```

3. **Set up the database** — run the contents of `supabase/schema.sql` in your Supabase SQL Editor, then run `supabase/seed.sql` to create the sample candidate.

4. **Start the dev server:**

```bash
npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000) — you'll land on the internal dashboard.

### Stripe Webhooks (Local Development)

To test the deposit webhook locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret it provides into your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## How It Works

1. **Dashboard** (`/dashboard`) — Internal team page. View the candidate, generate a secure profile link, see link statuses, revoke links.
2. **Profile** (`/profile/{token}`) — Family-facing page. Clean, read-only candidate profile with a "Pay $400 Deposit" button.
3. **Notifications** — When a family opens the profile for the first time, the team gets an email. When a deposit is paid, another email.
4. **Webhook idempotency** — Every Stripe event is logged by its unique ID. Duplicates are caught by a database unique constraint before any processing happens.

## Project Structure

```
src/
  app/
    dashboard/     — Internal team dashboard
    profile/[token]/ — Family-facing profile page
    api/
      candidates/  — GET candidates
      tokens/      — POST generate, PATCH revoke
      checkout/    — POST create Stripe Checkout Session
      webhooks/stripe/ — POST Stripe webhook handler
  lib/
    supabase.ts    — Supabase client
    stripe.ts      — Stripe client
    resend.ts      — Resend client
    tokens.ts      — Secure token generation
    types.ts       — TypeScript types
supabase/
  schema.sql       — Database schema
  seed.sql         — Sample candidate data
docs/
  BUILD.md         — Full build documentation
  SUMMARY.md       — Plain-English summary
  TESTING_GUIDE.md — Step-by-step testing walkthrough
```
