import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  const isCron = req.nextUrl.pathname.startsWith("/api/cron");
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");

  if (isCron || isAuthApi) {
    return NextResponse.next();
  }

  if (!req.auth && !isLogin) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (req.auth && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
