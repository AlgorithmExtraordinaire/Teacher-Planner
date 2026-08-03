import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "teacher" | "grade_lead" | "admin" | "superadmin";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  grade_band: string | null;
};

/**
 * Roles with staff-admin capability. Mirrors `public.is_staff_admin()` in the
 * database — keep the two in step, and prefer these helpers to comparing role
 * strings at call sites, so adding a role never silently locks someone out.
 */
export const STAFF_ADMIN_ROLES: readonly Role[] = [
  "grade_lead",
  "admin",
  "superadmin",
];

export function isStaffAdmin(user: Profile): boolean {
  return STAFF_ADMIN_ROLES.includes(user.role);
}

/** Platform-level control: roles, system settings, schools, audit log. */
export function isSuperadmin(user: Profile): boolean {
  return user.role === "superadmin";
}

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, grade_band")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: profile.full_name,
    role: profile.role as Role,
    grade_band: profile.grade_band,
  };
});

export const requireUser = cache(async (): Promise<Profile> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

export async function requireRole(...roles: Role[]): Promise<Profile> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/** Anything an admin or grade lead may do. Superadmin inherits all of it. */
export async function requireStaffAdmin(): Promise<Profile> {
  const user = await requireUser();
  if (!isStaffAdmin(user)) redirect("/");
  return user;
}

/** Superadmin only. RLS is still the real boundary; this is the UI gate. */
export async function requireSuperadmin(): Promise<Profile> {
  const user = await requireUser();
  if (!isSuperadmin(user)) redirect("/");
  return user;
}
