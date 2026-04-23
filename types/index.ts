// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** A historical event as returned by the public API (year is never included). */
export interface PublicEvent {
  id: string;
  description: string;
  slug: string;
  imageUrl: string | null;
}

/** A historical event as stored in the database (year included, server-side only). */
export interface Event extends PublicEvent {
  year: number;
  additionalContext: string | null;
  revealImageUrl: string | null;
  created_at: string;
}

/** Today's puzzle as returned by GET /api/daily. */
export interface DailyPuzzle {
  date: string; // YYYY-MM-DD
  events: PublicEvent[];
}

// ---------------------------------------------------------------------------
// Game session types (client-side only, never persisted mid-game)
// ---------------------------------------------------------------------------

export interface Guess {
  eventId: string;
  guessYear: number;
}

/** Response from POST /api/guess — returned immediately after each locked-in guess. */
export interface GuessResult {
  eventId: string;
  guessYear: number;
  correctYear: number;
  score: number;
  isPerfect: boolean;
  additionalContext: string | null;
  revealImageUrl: string | null;
}

/** A fully scored guess stored in user_results and returned by POST /api/submit. */
export interface ScoredGuess {
  eventId: string;
  guessYear: number;
  correctYear: number;
  score: number;
  isPerfect: boolean;
  description: string;
  imageUrl: string | null;
  additionalContext: string | null;
  revealImageUrl: string | null;
}

/** Full session result returned by POST /api/submit and GET /api/results. */
export interface SessionResult {
  date: string;
  guesses: ScoredGuess[];
  totalScore: number;
  maxScore: number;
  perfectCount: number;
  streak: number;
}

// ---------------------------------------------------------------------------
// Supabase database row types
// ---------------------------------------------------------------------------

export interface DbEvent {
  id: string;
  description: string;
  year: number;
  slug: string;
  image_url: string | null;
  reveal_image_url: string | null;
  additional_context: string | null;
  created_at: string;
}

export interface DbDailyPuzzle {
  id: string;
  date: string;
  event_ids: string[];
  created_at: string;
}

export interface DbUserResult {
  id: string;
  user_id: string;
  puzzle_date: string;
  guesses: ScoredGuess[];
  total_score: number;
  completed_at: string;
}

export interface DbUserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string;
  updated_at: string;
}

export interface DbUserPlus {
  user_id: string;
  plan: "monthly" | "lifetime";
  status: "active" | "cancelled" | "expired";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStreakShield {
  user_id: string;
  month_key: string;
  shields_remaining: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Groups types
// ---------------------------------------------------------------------------

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  joinedAt: string;
  isOwner: boolean;
}

export interface GroupMemberScore {
  userId: string;
  displayName: string;
  isOwner: boolean;
  /** null = hasn't played yet (or viewer hasn't played) */
  totalScore: number | null;
  emojiRow: string | null;
  perfectCount: number | null;
}

export interface GroupScoresResponse {
  groupId: string;
  groupName: string;
  puzzleDate: string;
  /** true once the requesting user has submitted today's puzzle */
  viewerHasPlayed: boolean;
  members: GroupMemberScore[];
}
