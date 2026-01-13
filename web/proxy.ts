import { NextResponse, type NextRequest } from 'next/server'

const STATIC_ASSET_EXTENSIONS = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|css|js)$/i

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  if (pathname === '/sw.js') {
    response.headers.set('Service-Worker-Allowed', '/')
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8')
    return response
  }

  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    STATIC_ASSET_EXTENSIONS.test(pathname)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
}

export const config = {
  matcher: '/:path*',
}

