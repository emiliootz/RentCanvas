// =============================================================================
// Clerk Middleware – Route Protection
// =============================================================================
// This runs on every request. It:
//  1. Makes auth state available to all routes via clerkMiddleware
//  2. Protects /dashboard/* (tenant routes) – must be signed in
//  3. Protects /admin/* (admin routes) – must be signed in (role check happens
//     inside those pages/layouts via server-side auth)
//  4. Allows public routes: /, /sign-in, /sign-up, /api/webhooks/*

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
