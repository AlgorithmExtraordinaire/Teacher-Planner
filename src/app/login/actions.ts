"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Default to the workspace. "/" is the public landing page, so sending a
  // freshly signed-in user there would look like the login had failed.
  const nextRaw = String(formData.get("next") ?? "/dashboard");
  const next = nextRaw === "/" ? "/dashboard" : nextRaw;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  // Only ever redirect within this origin — an absolute URL in `next` would
  // be an open redirect.
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Bounce back to the public landing page rather than the login form, so
  // signing out returns you to the front door.
  redirect("/");
}
