# What I Built — Plain-English Summary

## What it does

I built a small system that lets your team share a candidate's profile with a family by generating a secure link. When a family clicks the link, they see a clean profile page with the candidate's background, specialties, and certifications. When they're ready, they can pay the $400 placement deposit right there.

Behind the scenes, three things happen automatically:

1. **When the link is first opened**, the system records the exact time and sends your team an email: "A family just opened Margaret Chen's profile." The dashboard shows this status instantly.
2. **When the deposit is paid**, Stripe processes the payment and tells our system. We record it, update the candidate's status, and email the team again: "A family just paid the deposit for Margaret Chen."
3. **If a link needs to be killed** — maybe you matched the candidate elsewhere — one click on the dashboard revokes it. The family sees a warm message: "This profile is no longer available. Please contact your coordinator."
4. **Links expire automatically after 30 days.** A profile link from months ago shouldn't float around forever. If a family clicks an expired link, they see a friendly message asking them to contact their coordinator for a fresh one.

No dead ends. Every action leaves a trace.

---

## One decision I made, and why

**How I handle the case where Stripe tells us about the same payment twice.**

Stripe is built to be reliable, and part of that reliability means it sometimes sends the same payment notification more than once — on purpose, as a safety measure. If we're not careful, we could accidentally record the same deposit twice or send duplicate emails.

Here's how I solved it: every time Stripe sends us a notification, that notification has a unique tracking number (like a FedEx tracking number for a message). Before we do anything, we try to save that tracking number in our database. If it's already there — meaning we've seen this message before — we skip it entirely. If it's new, we process it normally.

This means even if Stripe sends us the same notification five times, we only act on it once. And because we keep a log of every notification, we can always go back and see exactly what happened if a question ever comes up.

I chose this approach over simpler alternatives because it works at the database level — it doesn't depend on the server remembering anything, so it survives restarts, deployments, and scaling to multiple servers without any extra work.

---

## What I'd do differently with more time

Given more time, here's where I'd take this — in order of priority:

1. **Automated tests.** The system works, but there are no automated checks to make sure it keeps working after future changes. I'd add tests for the critical paths: "does the webhook correctly ignore a duplicate payment?", "does a revoked link actually block access?", "does the deposit button disappear after payment?" These tests act as a safety net — they catch problems before your families do.

2. **An in-app activity log.** Right now, the team gets email notifications when something happens. But there's no in-app history. I'd add a timeline on the dashboard — "Margaret's profile was opened at 2:15 PM… Deposit paid at 3:40 PM" — so the team has a complete picture at a glance without checking email. Every action already leaves a trace in the database; this just surfaces it.

3. **Token analytics.** The system already tracks how many times each link is opened and when. With more time, I'd surface that as a proper engagement view: "This profile was viewed 8 times over 3 days" tells the team a family is very interested — that's a signal worth acting on.

4. **Rate limiting.** Right now, there's nothing stopping a bot from rapidly guessing token URLs. The tokens are cryptographically random (so guessing is practically impossible), but adding rate limiting on the profile page would be an extra layer of protection — standard security hardening for anything handling private family data.

5. **Real-time updates.** Currently, the dashboard requires a page refresh to show new statuses. With Supabase's real-time feature, we could make the "Opened" badge appear the moment a family clicks the link — no refresh needed. For a team actively managing multiple placements, that's the difference between checking and knowing.
