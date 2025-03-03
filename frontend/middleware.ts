import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proxy API requests to the backend
  if (pathname.startsWith('/api/')) {
    // Create a new URL for the backend
    const url = new URL(pathname, 'http://localhost:4242')
    url.search = request.nextUrl.search
    
    // Create a headers object to include in the rewrite
    const requestHeaders = new Headers(request.headers)
    
    // Forward the request to the backend
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next()
}

// Configure matcher for API routes
export const config = {
  matcher: ['/api/:path*'],
} 