import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role Supabase client.
 *
 * This bypasses Row Level Security completely, so it is deliberately NOT the
 * default client. Use it only from a trusted server entry point that has
 * already authenticated its caller by some other means — currently just the
 * cron runner, which verifies `CRON_SECRET` before it gets here.
 *
 * Never import this from a Server Component, a Server Action, or anything
 * reachable by a browser session: those all carry a user JWT and must keep
 * going through `@/lib/supabase/server` so RLS stays in force.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — the scheduled runner cannot write alerts.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    // No cookies, no session persistence — this client is request-scoped.
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
