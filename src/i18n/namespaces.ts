/**
 * Every translation namespace maps 1:1 to a messages/{locale}/{namespace}.json file.
 * Add a new entry here whenever a new namespace file is created.
 */
export const namespaces = [
  "common",
  "nav",
  "auth",
  "pos",
  "dashboard",
  "product",
  "productGroup",
  "category",
  "modifier",
  "discount",
  "order",
  "purchaseOrder",
  "supplier",
  "supplierProductPrice",
  "replenishment",
  "restaurant",
  "transaction",
  "shift",
  "returnOrder",
  "backlog",
  "warehouse",
  "users",
  "setting",
  "accounting",
  "cinema",
  "delivery",
  "production",
  "slot",
  "transferStock",
  "report",
  "boardMember",
  "transfer",
  "device",
  "invoice",
  "print",
  "publicMenu",
] as const;

export type Namespace = (typeof namespaces)[number];
