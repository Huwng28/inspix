import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const authToken = req.cookies.get("authToken")?.value;

  // Nếu chưa có token, redirect về trang đăng nhập
  if (!authToken && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các route ngoại trừ API
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"], // Áp dụng cho tất cả route trừ API, _next, file tĩnh
};
