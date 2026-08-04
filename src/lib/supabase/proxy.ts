import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isPublicAsset =
    path.startsWith("/_next") || path.startsWith("/favicon");
  // Machine-to-machine: called by the scheduler with a bearer secret, never by
  // a browser session. Redirecting it to /login would turn every scheduled run
  // into a silent 200 with a login page as the body.
  const isCron = path.startsWith("/api/cron");
  // The public landing page. It is the site root and must render for anyone,
  // signed in or not — bouncing it to /login would make the front door
  // unreachable to the people it exists for.
  const isLanding = path === "/";

  if (!user && !isAuthRoute && !isPublicAsset && !isCron && !isLanding) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Already signed in and asking for the login form: send them to the
  // workspace, not back to the marketing page.
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
