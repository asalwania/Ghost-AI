import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  clerkSignInPath,
  clerkSignInUrl,
  clerkSignUpPath,
  clerkSignUpUrl,
  editorPath,
} from "@/lib/clerk";

const isPublicRoute = createRouteMatcher([
  "/",
  `${clerkSignInPath}(.*)`,
  `${clerkSignUpPath}(.*)`,
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isApiRoute(request)) {
      return NextResponse.next();
    }

    const { isAuthenticated, sessionStatus } = await auth();

    if (isPublicRoute(request)) {
      if (
        isAuthenticated &&
        sessionStatus === "active" &&
        request.nextUrl.pathname !== editorPath
      ) {
        return NextResponse.redirect(new URL(editorPath, request.url));
      }

      return NextResponse.next();
    }

    await auth.protect();
    return NextResponse.next();
  },
  {
    signInUrl: clerkSignInUrl,
    signUpUrl: clerkSignUpUrl,
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
