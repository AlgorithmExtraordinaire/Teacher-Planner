import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role Supabase client.
 *
 * This bypasses Row Level Security completely, so it is deliberately NOT the
 * default client. Use it only from a trusted server entry point that has
 * already authenticated its caller by some other means.
 *
 * Two callers qualify:
 *
 *   1. The cron runner, which verifies `CRON_SECRET` before it gets here.
 *   2. Staff password resets in `admin/staff/actions.ts`, which call
 *      `requireStaffAdmin()` first and then touch ONLY the Auth admin API.
 *
 * (2) is a deliberate amendment to the original "never from a Server Action"
 * rule. Creating and repairing accounts is not something any user session may
 * do — no RLS policy can grant it — so an admin-initiated reset has no other
 * route. The narrowness is what keeps it safe: that action reads no school
 * data through this client and writes none. Anything that touches learner
 * records must still go through `@/lib/supabase/server` so RLS stays in force.
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
