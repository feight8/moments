import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Resolves the authenticated user from a server-side request.
 *
 * Checks the Authorization: Bearer <token> header first (sent explicitly by
 * the client for reliability), then falls back to the cookie-based session.
 * This handles cases where the SSR cookie propagation hasn't settled yet.
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<{ user: User | null; error: Error | null }> {
  const supabase = await createClient();

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const { data, error } = await supabase.auth.getUser(token);
  return { user: data.user, error: error as Error | null };
}
