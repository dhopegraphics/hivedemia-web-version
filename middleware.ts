import { NextResponse } from "next/server";

export async function middleware() {
  // For now, we'll skip middleware-based auth protection
  // and rely on client-side auth state management
  // This can be enhanced later with proper server-side session handling

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login", "/auth/signup"],
};
