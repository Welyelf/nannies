import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { generateSecureToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdmin();
  const candidateId = request.nextUrl.searchParams.get("candidate_id");

  let query = supabase
    .from("profile_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (candidateId) {
    query = query.eq("candidate_id", candidateId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdmin();

  const body = await request.json();
  const { candidate_id } = body;

  if (!candidate_id) {
    return NextResponse.json(
      { error: "candidate_id is required" },
      { status: 400 }
    );
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", candidate_id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 }
    );
  }

  const token = generateSecureToken();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("profile_tokens")
    .insert({
      candidate_id,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("candidates")
    .update({ status: "shared" })
    .eq("id", candidate_id)
    .eq("status", "draft");

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile/${token}`;

  return NextResponse.json({ ...data, profile_url: profileUrl }, { status: 201 });
}
