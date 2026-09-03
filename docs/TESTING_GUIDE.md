# Testing Guide — How to Click Through the Demo

This guide walks you through every step of the demo so you can see the full flow working end to end. No technical setup needed on your side — just click the links and follow along.

**Demo URL:** [will be added after deployment]

---

## Before You Start

A couple of things to know:

- **Stripe is in test mode.** No real money is charged. You'll use a test card number (provided below).
- **Email notifications go to my address.** Resend's free tier only allows sending to the account owner's email, so I can't send directly to your inbox during this demo. I've included screenshots of every email that gets sent so you can see exactly what they look like. In production, this would be configured to send to your team's address.

---

## Step 1: The Dashboard (Internal View)

Open the demo URL. You'll land on **The Manor** — the internal dashboard.

You'll see:
- Margaret Chen's full profile — name, headline, bio, specialties, certifications, rate
- Her current status (e.g., "DRAFT")
- A **"Send Profile"** button
- An empty "Profile Links" section

This is what your team would see day to day.

---

## Step 2: Generate a Profile Link

Click **"Send Profile."**

A new link appears in the Profile Links section with:
- An **"Active"** badge
- The token URL (truncated for display)
- Creation date and expiry date (30 days from now)
- **"Copy Link"** and **"Revoke"** buttons

Click **"Copy Link"** to copy the tokenized URL to your clipboard.

Notice: the candidate's status in the header changes from "DRAFT" to "SHARED" — the system tracked that a link was sent.

---

## Step 3: Open the Profile (As a Family Would)

Paste the copied link into a new browser tab (or incognito window to simulate a family).

You'll see:
- A clean, read-only profile page for **"Margaret C."** (first name + last initial only — protecting the candidate until the family moves forward)
- Her headline, bio, experience, rate, specialties, and certifications
- A **"Pay $400 Deposit"** section at the bottom
- The House of Nannies branding in the header and footer

**Behind the scenes, two things just happened:**
1. An email was sent to the team: "A family just opened Margaret Chen's profile." (Full name in the internal email, last initial only on the family-facing page.)
2. The database recorded the exact time this link was first opened.

---

## Step 4: Check the Dashboard Again

Go back to the dashboard tab and **refresh the page.**

You'll see the link's status has changed:
- Badge now shows **"Opened"**
- "First opened" timestamp appears
- "Viewed 1 time" counter

If you open the profile link again, the view count increments and "Last viewed" updates — the system tracks every visit, not just the first.

---

## Step 5: Pay the Deposit (Stripe Test Mode)

On the profile page, click **"Pay $400 Deposit."**

You'll be redirected to a Stripe Checkout page. Use these test details:

| Field | Value |
|-------|-------|
| Card number | **4242 4242 4242 4242** |
| Expiry | Any future date (e.g., **12/30**) |
| CVC | Any 3 digits (e.g., **123**) |
| Name | Anything |
| Country | United States |
| ZIP | Any 5 digits (e.g., **10001**) |

Click **"Pay"** to complete the test payment.

You'll be redirected back to the profile page. You should see:
- A green **"Thank you — your deposit has been received"** banner
- The deposit section now shows **"Deposit Received"** with a confirmation message instead of the pay button

**Behind the scenes:**
1. Stripe sent a webhook to our system confirming the payment.
2. The system logged the webhook event (for idempotency — more on this below).
3. Margaret's record was updated: `deposit_paid = true`.
4. A second email was sent to the team: "A family just paid the $400 deposit for Margaret Chen."

---

## Step 6: Verify on the Dashboard

Go back to the dashboard and refresh.

You'll see:
- Candidate status changed to **"DEPOSIT PAID"**
- Deposit Status section now shows **"Paid on [date/time]"** in green
- The Stripe payment intent ID is displayed for audit

---

## Step 7: Test Link Revocation

Generate a **second** profile link by clicking "Send Profile" again.

Copy the new link, but **before opening it**, click **"Revoke"** next to it.

Now try to open that revoked link. You'll see:

> **"This Profile Is No Longer Being Shared"**
> "This profile is no longer being shared. Reach out to us at House of Nannies and we're happy to help."

No cold dead end — just a warm message that sounds like your brand.

---

## Step 8: The Webhook Edge Case (Idempotency)

This is the part the trial specifically asks about: **what happens if Stripe sends the same payment notification twice?**

Here's what the system does:

1. Every notification from Stripe has a unique ID (like `evt_1abc...`).
2. When we receive it, we try to save that ID in our `webhook_events` table.
3. If the ID already exists (because we've seen it before), the database rejects the duplicate and we skip all processing — no double-marking, no duplicate emails.
4. This happens at the database level, so it works regardless of server restarts, deployments, or multiple servers running at once.

You can verify this in the Supabase dashboard by checking the `webhook_events` table — every Stripe event received is logged there with its unique ID, event type, and timestamp.

---

## What the Emails Look Like

Since Resend's free tier sends to my address only, here's what the team emails contain:

**On profile open:**
- Subject: "Profile Opened — Margaret Chen"
- Body: "A family just opened Margaret Chen's profile for the first time. Opened at [time] ET."
- Link back to the Manor dashboard

**On deposit paid:**
- Subject: "Deposit Paid — Margaret Chen"
- Body: "A family has just paid the $400 placement deposit for Margaret Chen. Payment was processed at [time] ET."
- Link back to the Manor dashboard

Both emails use a clean, serif-font layout consistent with the brand.

---

## Quick Reference

| What to test | Where | What to look for |
|---|---|---|
| Generate a link | Dashboard → "Send Profile" | New link appears with "Active" badge |
| Open as family | Paste link in new tab | Clean profile, "Margaret C." (last initial only) |
| First-open tracking | Dashboard (refresh) | "Opened" badge, view count, timestamp |
| Pay deposit | Profile page → "Pay $400 Deposit" | Use card 4242 4242 4242 4242 |
| Deposit confirmation | Profile page (after payment) | Green "Deposit Received" state |
| Dashboard reflects payment | Dashboard (refresh) | "DEPOSIT PAID" status, payment timestamp |
| Revoke a link | Dashboard → "Revoke" | Revoked link shows warm dead-end message |
| Expired link | (Links expire after 30 days) | Same warm messaging, different wording |
