import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Keeps the Supabase session cookie fresh and sends signed-out visitors
 * to the login page.
 *
 * getSession() only reads the cookie; it calls Supabase only when the
 * access token has expired and needs refreshing. That keeps every click
 * and prefetch free of an extra network round trip. It isn't the
 * security check — the admin layout, every page helper and every Server
 * Action verify the user with getUser() on the server.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Unconfigured deployment: let the page render its setup instructions.
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      }
    }
  })

  const { pathname } = request.nextUrl

  try {
    if (pathname === "/admin/login") {
      // Verified check here (rare page) so a stale cookie can't bounce
      // between /admin and the login page.
      const { data } = await supabase.auth.getUser()
      if (data.user) return NextResponse.redirect(new URL("/admin", request.url))
      return response
    }

    const { data } = await supabase.auth.getSession()
    if (!data.session && pathname.startsWith("/admin")) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // Supabase unreachable: don't block here; the page's own session
    // check shows a proper error.
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"]
}
