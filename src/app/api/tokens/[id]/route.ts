import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("profile_tokens")
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("revoked", false)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Token not found or already revoked" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
