import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#f7f9fc] px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold text-ink">
          Teacher Planner
        </h1>
        <p className="text-sm text-body">
          Swakopmund Christian Academy
        </p>
      </div>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
