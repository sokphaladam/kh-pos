export type Action = "create" | "read" | "update" | "delete";

export type Resource =
  | "users"
  | "warehouse"
  | "dashboard"
  | "board-member-dashboard"
  | "product"
  | "category"
  | "order"
  | "supplier"
  | "setting"
  | "role"
  | "shift"
  | "transfer"
  | "replenishment"
  | "purchase-order"
  | "stock-counting"
  | "slot"
  | "discount"
  | "payment"
  | "pricing-template"
  | "composition"
  | "accessibility"
  | "modifier"
  | "production"
  | "transaction"
  | "backlog"
  | "expiry"
  | "restaurant"
  | "order-preparation"
  | "table"
  | "sale-breakdown"
  | "pos"
  | "sale-report"
  | "void-order"
  | "guest-number"
  | "expiry"
  | "stock-report"
  | "end-of-day"
  | "cinema-showtime-sale"
  | "sale-item-report"
  | "showtime"
  | "hall-seat"
  | "ticket"
  | "digital"
  | "settlement"
  | "product-group"
  | "board-member-sale-report";

export const actions: Action[] = ["create", "update", "delete", "read"];

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<Resource, Action[]> = {
  users: actions,
  warehouse: actions,
  dashboard: actions,
  product: actions,
  category: actions,
  order: actions,
  supplier: actions,
  setting: actions,
  role: actions,
  shift: actions,
  transfer: actions,
  replenishment: actions,
  "purchase-order": actions,
  "stock-counting": actions,
  slot: actions,
  discount: actions,
  payment: actions,
  "pricing-template": actions,
  composition: actions,
  accessibility: actions,
  modifier: actions,
  production: actions,
  transaction: actions,
  backlog: actions,
  expiry: actions,
  restaurant: actions,
  "order-preparation": actions,
  table: actions,
  "sale-breakdown": actions,
  pos: actions,
  "sale-report": actions,
  "void-order": actions,
  "guest-number": actions,
  "stock-report": actions,
  "end-of-day": actions,
  "cinema-showtime-sale": actions,
  "sale-item-report": actions,
  "board-member-dashboard": actions,
  showtime: actions,
  "hall-seat": actions,
  ticket: actions,
  digital: actions,
  settlement: actions,
  "product-group": actions,
  "board-member-sale-report": actions,
};

export function hasPermission(resource: Resource, action: Action[]): boolean {
  return action.some((a) => DEFAULT_ROLE_PERMISSIONS[resource].includes(a));
}

export function checkUserAction(
  resource: Resource,
  permission: Record<string, Action[]> | null = null,
): Action[] {
  if (!permission || !permission[resource]) {
    return ["read"];
  }
  return DEFAULT_ROLE_PERMISSIONS[resource].filter(
    (a) => permission?.[resource]?.includes(a) ?? false,
  );
}
