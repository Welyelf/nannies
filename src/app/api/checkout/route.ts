import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdmin();
  const body = await request.json();
  const { candidate_id, token } = body;

  if (!candidate_id || !token) {
    return NextResponse.json(
      { error: "candidate_id and token are required" },
      { status: 400 }
    );
  }

  const { data: tokenRecord } = await supabase
    .from("profile_tokens")
    .select("id, revoked, expires_at, candidates(id, first_name, last_name, deposit_paid)")
    .eq("token", token)
    .single();

  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (tokenRecord.revoked) {
    return NextResponse.json({ error: "Token has been revoked" }, { status: 403 });
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token has expired" }, { status: 403 });
  }

  const candidate = tokenRecord.candidates as unknown as {
    id: string;
    first_name: string;
    last_name: string;
    deposit_paid: boolean;
  };

  if (candidate.deposit_paid) {
    return NextResponse.json(
      { error: "Deposit has already been paid" },
      { status: 400 }
    );
  }

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Placement Deposit — ${candidate.first_name} ${candidate.last_name}`,
            description:
              "Refundable placement deposit for House of Nannies candidate match.",
          },
          unit_amount: 40000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      candidate_id,
      token_id: tokenRecord.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${token}?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${token}?status=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
