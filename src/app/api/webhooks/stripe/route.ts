import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { getResend } from "@/lib/resend";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Idempotency: attempt to insert the event. If the stripe_event_id
  // already exists (unique constraint), this is a duplicate — skip processing.
  const { error: insertError } = await supabase
    .from("webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      // Unique constraint violation — duplicate event, already processed
      console.log(`Duplicate webhook event ${event.id}, skipping.`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to log webhook event:", insertError.message);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const candidateId = session.metadata?.candidate_id;

    if (!candidateId) {
      console.error("No candidate_id in session metadata");
      return NextResponse.json({ received: true });
    }

    // Update the webhook_events row with the candidate_id for audit
    await supabase
      .from("webhook_events")
      .update({ candidate_id: candidateId })
      .eq("stripe_event_id", event.id);

    // Conditional update: only mark as paid if not already paid.
    // Second safety net beyond the event-level idempotency.
    const { data: updated } = await supabase
      .from("candidates")
      .update({
        deposit_paid: true,
        deposit_paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
        status: "deposit_paid",
      })
      .eq("id", candidateId)
      .eq("deposit_paid", false)
      .select("first_name, last_name")
      .single();

    if (updated) {
      try {
        await getResend().emails.send({
          from: "House of Nannies <onboarding@resend.dev>",
          to: process.env.TEAM_EMAIL!,
          subject: `Deposit Paid — ${updated.first_name} ${updated.last_name}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="color: #1a1a1a; font-weight: normal;">Deposit Received</h2>
              <p style="color: #444; line-height: 1.6;">
                A family has just paid the <strong>$400 placement deposit</strong> for
                <strong>${updated.first_name} ${updated.last_name}</strong>.
              </p>
              <p style="color: #444; line-height: 1.6;">
                Payment was processed at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
              <p style="color: #888; font-size: 14px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #b8860b;">View in the Manor</a>
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send deposit notification email:", emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
