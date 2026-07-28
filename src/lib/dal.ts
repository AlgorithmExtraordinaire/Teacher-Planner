import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "teacher" | "grade_lead" | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  grade_band: string | null;
};

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
