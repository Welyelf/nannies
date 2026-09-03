export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  headline: string;
  bio: string;
  experience_years: number;
  specialties: string[];
  certifications: string[];
  hourly_rate: string | null;
  photo_url: string | null;
  status: string;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileToken {
  id: string;
  candidate_id: string;
  token: string;
  revoked: boolean;
  revoked_at: string | null;
  expires_at: string;
  opened_at: string | null;
  last_opened_at: string | null;
  opened_count: number;
  notification_sent: boolean;
  created_at: string;
}

export interface ProfileTokenWithCandidate extends ProfileToken {
  candidates: Candidate;
}

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  candidate_id: string | null;
  processed: boolean;
  payload: Record<string, unknown>;
  created_at: string;
}
