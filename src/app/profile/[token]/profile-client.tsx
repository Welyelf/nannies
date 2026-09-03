"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Candidate } from "@/lib/types";

interface ProfileClientProps {
  candidate: Candidate;
  token: string;
  depositPaid: boolean;
  paymentStatus?: string;
}

export default function ProfileClient({
  candidate,
  token,
  depositPaid,
  paymentStatus,
}: ProfileClientProps) {
  const [loading, setLoading] = useState(false);

  async function handlePayDeposit() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidate.id,
          token,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Subtle branded header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <p className="text-sm text-stone-400 tracking-widest uppercase">
            House of Nannies
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Payment status banner */}
        {paymentStatus === "success" && (
          <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-green-800 text-sm font-medium">
              Thank you — your deposit has been received.
            </p>
            <p className="text-green-700 text-xs mt-1">
              Our team will be in touch shortly to confirm next steps.
            </p>
          </div>
        )}

        {paymentStatus === "cancelled" && (
          <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-amber-800 text-sm">
              Payment was not completed. You can try again below when you&apos;re ready.
            </p>
          </div>
        )}

        {/* Candidate intro */}
        <div className="mb-10">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">
            Candidate Profile
          </p>
          <h1 className="font-heading text-3xl text-stone-900 mb-2">
            {candidate.first_name} {candidate.last_name?.charAt(0)}.
          </h1>
          <p className="text-lg text-stone-600">{candidate.headline}</p>
        </div>

        <Separator className="mb-10" />

        {/* About */}
        <section className="mb-10">
          <h2 className="font-heading text-lg text-stone-800 mb-4">About</h2>
          <p className="text-stone-600 leading-relaxed">{candidate.bio}</p>
        </section>

        {/* Experience & Rate */}
        <section className="mb-10 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">
              Experience
            </p>
            <p className="text-stone-800 font-medium">
              {candidate.experience_years} years
            </p>
          </div>
          {candidate.hourly_rate && (
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">
                Rate
              </p>
              <p className="text-stone-800 font-medium">{candidate.hourly_rate}</p>
            </div>
          )}
        </section>

        {/* Specialties */}
        <section className="mb-10">
          <h2 className="font-heading text-lg text-stone-800 mb-4">
            Specialties
          </h2>
          <div className="flex flex-wrap gap-2">
            {candidate.specialties.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-sm font-normal px-3 py-1 bg-stone-100 text-stone-700 border-0"
              >
                {s}
              </Badge>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="mb-10">
          <h2 className="font-heading text-lg text-stone-800 mb-4">
            Certifications
          </h2>
          <ul className="space-y-2">
            {candidate.certifications.map((c) => (
              <li key={c} className="flex items-start gap-2 text-stone-600">
                <svg
                  className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </section>

        <Separator className="mb-10" />

        {/* Deposit Section */}
        <section className="mb-12">
          {depositPaid || paymentStatus === "success" ? (
            <div className="text-center py-8 px-6 rounded-xl bg-green-50 border border-green-100">
              <svg
                className="w-12 h-12 text-green-600 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="font-heading text-xl text-green-800 mb-1">
                Deposit Received
              </h3>
              <p className="text-green-700 text-sm">
                Thank you. Our team will reach out to confirm your match and next
                steps.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 px-6 rounded-xl bg-stone-100 border border-stone-200">
              <h3 className="font-heading text-xl text-stone-800 mb-2">
                Ready to Proceed?
              </h3>
              <p className="text-stone-600 text-sm mb-6 max-w-md mx-auto">
                A $400 placement deposit secures this candidate for your family.
                The deposit is applied toward placement fees.
              </p>
              <Button
                onClick={handlePayDeposit}
                disabled={loading}
                size="lg"
                className="bg-stone-900 hover:bg-stone-800 text-white px-8 text-base"
              >
                {loading ? "Redirecting to payment..." : "Pay $400 Deposit"}
              </Button>
              <p className="text-xs text-stone-400 mt-3">
                Secure payment via Stripe. You&apos;ll be redirected to complete
                payment.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            House of Nannies · Westchester · Manhattan · Greenwich · The Hamptons
          </p>
          <p className="text-xs text-stone-300 mt-1">
            This profile was shared exclusively for your family.
          </p>
        </footer>
      </main>
    </div>
  );
}
