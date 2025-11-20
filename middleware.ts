import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // TODO: Re-enable authentication for production
  // Check if the user is accessing dashboard routes
  // const path = request.nextUrl.pathname
  // const isDashboardRoute = path.includes('/dashboard')
  // const isAuthRoute = path.includes('/dashboard/login') || path.includes('/dashboard/signup')

  // // Skip auth check for public routes and auth pages
  // if (!isDashboardRoute || isAuthRoute) {
  //   return response
  // }

  // // Only check auth for protected dashboard routes
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser()

  // // Redirect to login if accessing dashboard without authentication
  // if (!user) {
  //   const storeName = path.split('/')[1]
  //   return NextResponse.redirect(new URL(`/${storeName}/dashboard/login`, request.url))
  // }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
