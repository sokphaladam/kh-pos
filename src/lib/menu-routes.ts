import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

// Type for menu route mapping
export interface MenuRoute {
  path: string;
  resource: string;
}

/**
 * Centralized menu routes configuration
 * This should match the URLs defined in app-menu-items.ts
 *
 * IMPORTANT: When adding/removing/modifying menu items in app-menu-items.ts:
 * 1. Update this list to maintain consistency
 * 2. Ensure the resource names match those in DEFAULT_ROLE_PERMISSIONS
 * 3. Test both client-side menu filtering and server-side route protection
 *
 * This configuration is used by:
 * - middleware.ts: For route protection and smart redirects
 * - Permission validation and first accessible route finding
 */
const MENU_ROUTES_CONFIG: MenuRoute[] = [
  { path: "/admin/dashboard", resource: "dashboard" },
  { path: "/admin/product", resource: "product" },
  { path: "/admin/category", resource: "category" },
  { path: "/admin/discount", resource: "discount" },
  { path: "/admin/modifier", resource: "modifier" },
  { path: "/admin/production", resource: "production" },
  { path: "/admin/warehouse", resource: "warehouse" },
  { path: "/admin/slot", resource: "slot" },
  { path: "/admin/transaction", resource: "transaction" },
  { path: "/admin/order", resource: "order" },
  { path: "/admin/a/transfer", resource: "transfer" },
  { path: "/admin/return", resource: "return" },
  { path: "/admin/backlog", resource: "backlog" },
  { path: "/admin/shift", resource: "shift" },
  { path: "/admin/supplier", resource: "supplier" },
  { path: "/admin/purchase-order", resource: "purchase-order" },
  { path: "/admin/replenishment", resource: "replenishment" },
  { path: "/admin/reports/expiry", resource: "expiry" },
  { path: "/admin/setting", resource: "setting" },
  { path: "/admin/users", resource: "users" },
  { path: "/admin/setting/payment", resource: "payment" },
  { path: "/admin/cinema/pricing-template", resource: "pricing-template" },
];

// Validate and export menu routes
export const MENU_ROUTES = MENU_ROUTES_CONFIG.filter((item) => {
  const hasPermission = item.resource in DEFAULT_ROLE_PERMISSIONS;
  if (!hasPermission) {
    console.warn(
      `⚠️  Resource '${item.resource}' for path '${item.path}' not found in DEFAULT_ROLE_PERMISSIONS`
    );
  }
  return hasPermission;
});
