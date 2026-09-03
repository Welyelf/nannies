import { createSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import { notFound } from "next/navigation";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { status: paymentStatus } = await searchParams;
  const supabase = createSupabaseAdmin();

  // Look up the token and join to candidate
  const { data: tokenRecord } = await supabase
    .from("profile_tokens")
    .select("*, candidates(*)")
    .eq("token", token)
    .single();

  if (!tokenRecord) {
    notFound();
  }

  // Check if revoked
  if (tokenRecord.revoked) {
    return <ExpiredPage reason="revoked" />;
  }

  // Check if expired
  if (new Date(tokenRecord.expires_at) < new Date()) {
    return <ExpiredPage reason="expired" />;
  }

  const candidate = tokenRecord.candidates;

  // Track the open — update count on every view, set opened_at only on first
  const isFirstOpen = !tokenRecord.opened_at;
  const now = new Date().toISOString();

  await supabase
    .from("profile_tokens")
    .update({
      opened_at: tokenRecord.opened_at || now,
      last_opened_at: now,
      opened_count: tokenRecord.opened_count + 1,
    })
    .eq("id", tokenRecord.id);

  // On first open: send notification email and update candidate status
  if (isFirstOpen) {
    await supabase
      .from("profile_tokens")
      .update({ notification_sent: true })
      .eq("id", tokenRecord.id);

    await supabase
      .from("candidates")
      .update({ status: "viewed" })
      .eq("id", candidate.id)
      .in("status", ["draft", "shared"]);

    try {
      await getResend().emails.send({
        from: "House of Nannies <onboarding@resend.dev>",
        to: process.env.TEAM_EMAIL!,
        subject: `Profile Opened — ${candidate.first_name} ${candidate.last_name}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1a1a1a; font-weight: normal;">Profile Viewed</h2>
            <p style="color: #444; line-height: 1.6;">
              A family just opened <strong>${candidate.first_name} ${candidate.last_name}</strong>&rsquo;s
              profile for the first time.
            </p>
            <p style="color: #444; line-height: 1.6;">
              Opened at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
            <p style="color: #888; font-size: 14px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #b8860b;">View in the Manor</a>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send open notification:", emailError);
    }
  }

  return (
    <ProfileClient
      candidate={candidate}
      token={token}
      depositPaid={candidate.deposit_paid}
      paymentStatus={paymentStatus}
    />
  );
}

function ExpiredPage({ reason }: { reason: "revoked" | "expired" }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-2xl text-stone-800 mb-3">
          This Profile Is No Longer Being Shared
        </h1>
        <p className="text-stone-500 leading-relaxed">
          {reason === "revoked"
            ? "This profile is no longer being shared. Reach out to us at House of Nannies and we're happy to help."
            : "This profile link has expired, but we're still here. Reach out to us at House of Nannies and we'll get you an updated link right away."}
        </p>
        <div className="mt-8 pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            House of Nannies · New York Area
          </p>
        </div>
      </div>
    </div>
  );
}
