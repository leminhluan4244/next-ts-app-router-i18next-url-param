import { NextResponse, NextRequest } from 'next/server'
import acceptLanguage from 'accept-language'
import { fallbackLng, languages, cookieName } from './app/i18n/settings'

acceptLanguage.languages(languages)

export const config = {
  // matcher: '/:lng*'
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}

export function middleware(req: NextRequest) {
  /** 
   * If the path contains the word "icon" or "chrome", the middleware does nothing and passes it on to the next middleware or route handler in the processing chain.
  */ 
  if (req.nextUrl.pathname.indexOf('icon') > -1 || req.nextUrl.pathname.indexOf('chrome') > -1 || req.nextUrl.pathname.indexOf('images') > -1) {
    return NextResponse.next()
  }

  let lng: string | undefined | null

  /** 
   * Get the `key` of the language being used from the `cookie`
  */ 
  if (req.cookies.has(cookieName)) lng = acceptLanguage.get(req.cookies.get(cookieName)?.value)

  /** 
   * If the `cookie` doesn't contain that data, I would try to get it from the header's `Accept-Language`
  */ 
  if (!lng) lng = acceptLanguage.get(req.headers.get('Accept-Language'))

  /** 
   * Finally if the ways to get the language are not available, I will use the system default language
  */ 
  if (!lng) lng = fallbackLng

  /**
   * 
   * Check if the requested client language is in the list of supported languages
   * Check if the request's path starts with /_next. 
   * If this condition is also not true, it means the path is not a Next.js static resource.
   */
  if (
    !languages.some(loc => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL(`/${lng}${req.nextUrl.pathname}`, req.url))
  }

  /**
   * Check if the request has a "referer" header. 
   * If so, it does some language-related processing in the referer URL
   */
  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer') || '')
    const lngInReferer = languages.find((l) => refererUrl.pathname.startsWith(`/${l}`))
    const response = NextResponse.next()
    /**
     * If there is a language found in the referer URL (lngInReferer other than null or undefined), 
     * this code sets a cookie with the name cookieName whose value is the language found.
     */
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer)
    return response
  }

  return NextResponse.next()
}
