"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = { error?: string; sent?: boolean } | undefined;

export async function requestReset(
  _prevState: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your school email address." };

  // Build the return URL from the request rather than a hardcoded domain, so
  // this works in local development and behind nginx in production without a
  // second environment variable to keep in step.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const redirectTo = `${proto}://${host}/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  // Deliberately reports success even when the address is unknown. Telling an
  // anonymous caller which addresses exist turns this form into a staff
  // directory. The one exception is a rate limit, which is not about the
  // address and which the sender genuinely needs to know about — otherwise
  // they retype their address for ten minutes believing they mistyped it.
  if (error && /rate limit|too many/i.test(error.message)) {
    return {
      error:
        "Too many reset emails have been sent recently. Wait an hour, or ask IT Operations to issue a temporary password directly.",
    };
  }

  return { sent: true };
}
