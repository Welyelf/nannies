"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Candidate, ProfileToken } from "@/lib/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

function getTokenStatus(token: ProfileToken) {
  if (token.revoked) return { label: "Revoked", variant: "destructive" as const };
  if (new Date(token.expires_at) < new Date()) return { label: "Expired", variant: "secondary" as const };
  if (token.opened_at) return { label: "Opened", variant: "default" as const };
  return { label: "Active", variant: "outline" as const };
}

export default function DashboardPage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [tokens, setTokens] = useState<ProfileToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const candidatesRes = await fetch("/api/candidates");
      const candidates = await candidatesRes.json();
      const c = candidates[0];
      if (!c) return;
      setCandidate(c);

      const tokensRes = await fetch(`/api/tokens?candidate_id=${c.id}`);
      const tokensData = await tokensRes.json();
      setTokens(tokensData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerateLink() {
    if (!candidate) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.id }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    try {
      const res = await fetch(`/api/tokens/${tokenId}`, { method: "PATCH" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to revoke:", err);
    }
  }

  function handleCopyLink(token: string) {
    const url = `${window.location.origin}/profile/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 font-heading text-lg">Loading the Manor...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">No candidates found. Please run the seed SQL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl text-stone-900 tracking-tight">
              The Manor
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              House of Nannies — Internal Operations
            </p>
          </div>
          <Badge
            variant={candidate.deposit_paid ? "default" : "outline"}
            className="text-xs"
          >
            {candidate.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Candidate Card */}
        <Card className="border-stone-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-heading text-xl text-stone-900 font-normal">
                  {candidate.first_name} {candidate.last_name}
                </CardTitle>
                <p className="text-stone-600 mt-1">{candidate.headline}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-500">
                  {candidate.experience_years} years experience
                </p>
                {candidate.hourly_rate && (
                  <p className="text-sm font-medium text-stone-700 mt-0.5">
                    {candidate.hourly_rate}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-stone-600 text-sm leading-relaxed">
              {candidate.bio}
            </p>

            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.specialties.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs font-normal">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
                  Certifications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.certifications.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs font-normal">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Deposit Status */}
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">
                  Deposit Status
                </p>
                <p className="text-sm text-stone-700 mt-1">
                  {candidate.deposit_paid ? (
                    <span className="text-green-700 font-medium">
                      Paid on {formatDate(candidate.deposit_paid_at)}
                    </span>
                  ) : (
                    <span className="text-amber-700">Pending</span>
                  )}
                </p>
              </div>
              {candidate.stripe_payment_intent_id && (
                <p className="text-xs text-stone-400 font-mono">
                  {candidate.stripe_payment_intent_id}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Links */}
        <Card className="border-stone-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg text-stone-900 font-normal">
                Profile Links
              </CardTitle>
              <Button
                onClick={handleGenerateLink}
                disabled={generating}
                className="bg-stone-900 hover:bg-stone-800 text-white text-sm"
              >
                {generating ? "Generating..." : "Send Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <p className="text-sm text-stone-500 py-4 text-center">
                No profile links generated yet. Click &ldquo;Send Profile&rdquo; to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {tokens.map((t) => {
                  const status = getTokenStatus(t);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-stone-50 border border-stone-100"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                          {t.opened_count > 0 && (
                            <span className="text-xs text-stone-500">
                              Viewed {t.opened_count} time{t.opened_count !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 font-mono truncate">
                          /profile/{t.token.slice(0, 16)}...
                        </p>
                        <div className="flex gap-4 mt-1 text-xs text-stone-500">
                          <span>Created {formatDate(t.created_at)}</span>
                          {t.opened_at && (
                            <span>First opened {formatDate(t.opened_at)}</span>
                          )}
                          {t.last_opened_at && t.opened_count > 1 && (
                            <span>Last viewed {formatDate(t.last_opened_at)}</span>
                          )}
                          <span>Expires {formatDate(t.expires_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!t.revoked && new Date(t.expires_at) > new Date() && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(t.token)}
                              className="text-xs"
                            >
                              {copiedToken === t.token ? "Copied!" : "Copy Link"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(t.id)}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
