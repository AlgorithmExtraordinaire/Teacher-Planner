import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Append-only audit trail.
//
// `audit_log` has no UPDATE or DELETE policy, so entries cannot be altered or
// erased through the API by any role — including superadmin. Reads are
// superadmin-only; any authenticated actor may append their own entry.

export type AuditEntry = {
  /** Profile id of whoever performed the action. */
  actorId: string | null;
  /** Dotted verb, e.g. "proposal.approved", "workflow.enabled". */
  action: string;
  /** Table or domain object the action touched. */
  entity?: string | null;
  entityId?: string | null;
  /** Anything worth keeping for later reconstruction. */
  detail?: unknown;
};

/**
 * Record an audit entry.
 *
 * Never throws and never returns a failure the caller has to handle. An audit
 * write that fails must not block or roll back the action it was recording — a
 * missing log line is bad, a blocked approval is worse. Failures go to the
 * server log so they are still visible in `docker compose logs`.
 */
export async function recordAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      // `detail` is jsonb; the shape is caller-defined by design.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detail: (entry.detail ?? null) as any,
    });

    if (error) {
      console.error(`[audit] ${entry.action} not recorded: ${error.message}`);
    }
  } catch (e) {
    console.error(
      `[audit] ${entry.action} threw: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
}
