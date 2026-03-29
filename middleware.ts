import { NextResponse, type NextRequest } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Resume Generator"'
    }
  });
}

function serviceMisconfiguredResponse() {
  return new NextResponse(
    "Auth is not configured. Set APP_BASIC_AUTH (user:pass) and/or APP_API_TOKEN.",
    { status: 503 }
  );
}

function safeAtob(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

function isBasicAuthValid(req: NextRequest, expectedUserPass: string): boolean {
  const header = req.headers.get("authorization");
  if (!header) return false;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "basic" || !token) return false;
  const decoded = safeAtob(token);
  return decoded === expectedUserPass;
}

function isApiTokenValid(req: NextRequest, expectedToken: string): boolean {
  const token = req.headers.get("x-api-token");
  return Boolean(token && token === expectedToken);
}

export function middleware(req: NextRequest) {
  const expectedBasic = process.env.APP_BASIC_AUTH ?? "";
  const expectedApiToken = process.env.APP_API_TOKEN ?? "";

  const hasAnyAuthConfigured = Boolean(expectedBasic || expectedApiToken);
  if (!hasAnyAuthConfigured) {
    // Fail closed in production so we don't accidentally deploy a public endpoint.
    if (process.env.NODE_ENV === "production") return serviceMisconfiguredResponse();
    return NextResponse.next();
  }

  if (expectedBasic && isBasicAuthValid(req, expectedBasic)) return NextResponse.next();

  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  if (isApiRoute && expectedApiToken && isApiTokenValid(req, expectedApiToken)) {
    return NextResponse.next();
  }

  return unauthorizedResponse();
}

export const config = {
  matcher: ["/:path*"]
};

