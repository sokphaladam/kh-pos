import { MENU_ROUTES } from "@/lib/menu-routes";
import { NextRequest, NextResponse } from "next/server";
import { getNextAdminCookies } from "./lib/cookies/cookies-server";

// Constants for frequently used paths
const ALLOWED_PATHS = ["/login", "/storybook", "/menu"];
const LOGIN_PATH = "/admin/login";
const REGISTER_PATH = "/admin/register";
const DASHBOARD_PATH = "/admin/dashboard";
const BOARD_MEMBER_DASHBOARD_PATH = "/admin/board-member-dashboard";
const FORBIDDEN_PATH = "/admin/forbidden";

let hasUserChecked = false;

// Helper function to extract resource name from URL path
function getResourceFromPath(pathname: string): string | null {
  const urlParts = pathname.split("/").filter(Boolean);
  if (urlParts.length >= 2 && urlParts[0] === "admin") {
    // Handle special nested routes
    if (urlParts[1] === "reports" && urlParts[2]) {
      // For /admin/reports/expiry -> return "expiry"
      return urlParts[2];
    }
    if (urlParts[1] === "setting" && urlParts[2]) {
      // For /admin/setting/payment -> return "payment"
      return urlParts[2];
    }
    if (urlParts[1] === "a" && urlParts[2]) {
      // For /admin/a/transfer -> return "transfer"
      return urlParts[2];
    }
    if (urlParts[1] === "cinema") {
      return urlParts[2];
    }

    // For regular routes like /admin/product -> return "product"
    const resource = urlParts[1];
    return resource;
  }
  return null;
}

// Check if user has permission to access a route
function hasRoutePermission(
  pathname: string,
  permissions: Record<string, string>,
  userRole?: string,
): boolean {
  if (userRole === "OWNER") {
    return true;
  }

  const resource = getResourceFromPath(pathname);
  if (
    !resource ||
    resource === "forbidden" ||
    resource === "login" ||
    resource === "register"
  ) {
    return true;
  }

  const resourcePermissions = permissions[resource];

  if (!resourcePermissions) {
    return false;
  }

  const permissionList = resourcePermissions.split(",").map((p) => p.trim());

  const hasAccess =
    permissionList.includes("read") || permissionList.includes("view-only");

  return hasAccess;
}

function getFirstAccessibleRoute(
  permissions: Record<string, string>,
  userRole?: string,
): string {
  // OWNER always goes to dashboard
  if (userRole === "OWNER") {
    return DASHBOARD_PATH;
  }

  // BOARD_MEMBER always goes to board member dashboard
  if (userRole === "BOARD MEMBER" && permissions["board-member-dashboard"]) {
    return BOARD_MEMBER_DASHBOARD_PATH;
  }

  // Check each menu item in order
  for (const item of MENU_ROUTES) {
    const resourcePermissions = permissions[item.resource];

    if (resourcePermissions) {
      const permissionList = resourcePermissions
        .split(",")
        .map((p) => p.trim());
      if (
        permissionList.includes("read") ||
        permissionList.includes("view-only")
      ) {
        return item.path;
      }
    }
  }

  // Fallback to dashboard if no accessible routes found
  return DASHBOARD_PATH;
}

async function checkHasUser(request: NextRequest): Promise<boolean> {
  if (hasUserChecked) return true;

  try {
    const origin = `http://${request.nextUrl.host}`; // Force HTTP protocol
    const response = await fetch(`${origin}/api/user/has-user`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data.result === true) {
      hasUserChecked = true;
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in checkHasUser:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for RSC payloads and internal Next.js requests to prevent payload exposure
  const isRSCRequest = request.headers.get("RSC") === "1";
  const isNextDataRequest = pathname.includes("/_next/data/");

  if (isRSCRequest || isNextDataRequest) {
    return NextResponse.next();
  }

  const cookies = await getNextAdminCookies();

  // Handle null or undefined permissions more carefully
  const rawPermissions = cookies?.role?.permissions;

  const permissions: Record<string, string> = {};

  if (rawPermissions && typeof rawPermissions === "object") {
    Object.keys(rawPermissions).forEach((key) => {
      const value = rawPermissions[key];
      if (typeof value === "string") {
        permissions[key] = value;
      } else if (Array.isArray(value)) {
        // If it's an array, join it with commas
        permissions[key] = value.join(",");
      }
    });
  }

  const userRole = cookies?.role?.role;

  try {
    const hasUser = await checkHasUser(request);

    if (!hasUser) {
      // Use redirect instead of rewrite to avoid RSC payload issues
      if (pathname !== REGISTER_PATH) {
        return NextResponse.redirect(new URL(REGISTER_PATH, request.url));
      }
      return NextResponse.next();
    }

    if (!cookies && !ALLOWED_PATHS.includes(pathname)) {
      // Use redirect instead of rewrite to avoid RSC payload issues
      if (pathname !== LOGIN_PATH) {
        return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
      }
      return NextResponse.next();
    }

    if (cookies && ["/login", "/"].includes(pathname)) {
      if (pathname === "/") {
        // Redirect to first accessible route instead of always dashboard
        const firstAccessibleRoute = getFirstAccessibleRoute(
          permissions,
          userRole,
        );
        return NextResponse.redirect(
          new URL(firstAccessibleRoute, request.url),
        );
      }

      if (pathname === "/login") {
        // Redirect to first accessible route when user is already logged in
        const firstAccessibleRoute = getFirstAccessibleRoute(
          permissions,
          userRole,
        );
        return NextResponse.redirect(
          new URL(firstAccessibleRoute, request.url),
        );
      }

      if (pathname === "/menu") {
        return NextResponse.next();
      }
    }

    // Check route permissions for authenticated users
    if (
      cookies &&
      pathname.startsWith("/admin/") &&
      pathname !== FORBIDDEN_PATH
    ) {
      const hasPermission = hasRoutePermission(pathname, permissions, userRole);
      console.log(hasPermission);
      if (!hasPermission) {
        // Redirect to forbidden page
        const response = NextResponse.redirect(
          new URL(FORBIDDEN_PATH, request.url),
        );
        response.headers.set("x-permission-denied", "true");
        return response;
      }
    }

    const response = NextResponse.next();
    response.headers.set("x-middleware-executed", "true");
    // Ensure we're not accidentally exposing RSC payloads
    response.headers.delete("x-nextjs-data");
    return response;
  } catch (error) {
    console.error("Error in middleware:", error);
    const response = NextResponse.next();
    response.headers.set("x-middleware-error", "true");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (Next.js data fetching)
     * - favicon.ico (favicon file)
     * - sitemap.xml
     * - robots.txt
     */
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
