import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPrefixes: Record<string, string> = {
    "/farmer/(app)": "farmer",
    "/driver/(app)": "driver",
    "/admin": "admin",
  };

  const isFarmerApp = path.startsWith("/farmer") && !path.startsWith("/farmer/login") && !path.startsWith("/farmer/register");
  const isDriverApp = path.startsWith("/driver") && !path.startsWith("/driver/login") && !path.startsWith("/driver/register");
  const isAdminApp = path.startsWith("/admin") && !path.startsWith("/admin/login");

  if ((isFarmerApp || isDriverApp || isAdminApp) && !user) {
    const loginPath = isFarmerApp ? "/farmer/login" : isDriverApp ? "/driver/login" : "/admin/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_registered")
      .eq("id", user.id)
      .single();

    if (isFarmerApp && profile?.role !== "farmer") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isDriverApp && profile?.role !== "driver") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isAdminApp && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if ((isFarmerApp || isDriverApp) && profile && !profile.is_registered && !path.includes("register")) {
      const registerPath = isFarmerApp ? "/farmer/register" : "/driver/register";
      return NextResponse.redirect(new URL(registerPath, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
