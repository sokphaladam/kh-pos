import { LoaderFactory } from "@/dataloader/loader-factory";
import { Warehouse } from "@/dataloader/warehouse-loader";
import {
  table_customer,
  table_user,
  table_user_role,
} from "@/generated/tables";
import { Knex } from "knex";
import { Formatter } from "../formatter";

export interface UserAuth {
  admin: UserInfo | undefined;
  customer: CustomerInfo | undefined;
}

export interface CustomerInfo {
  id: string;
  name: string;
  phoneNumber: string;
  warehouseId: string;
  isWalkin: boolean;
  lat?: number;
  lng?: number;
  email?: string | null;
  photo?: string | null;
  emailKey?: string | null;
}

export interface UserRoles {
  id: string;
  role: string; // ADMIN, MANAGER, USER...
  userId: string;
  roleId: string;
  createdAt: string;
  permissions: Record<string, unknown> | null;
}
export interface UserInfo {
  id: string;
  username: string;
  phoneNumber: string;
  token: string;
  role?: UserRoles;
  profile: string;
  fullname: string;
  roleId: string | null;
  warehouse?: Warehouse | null;
  currentWarehouseId?: string;
  isDev?: boolean;
}

export default async function getAuthFromToken(
  db: Knex,
  token: string,
): Promise<UserInfo | null> {
  const user: table_user = await db("user")
    .where({ token, is_deleted: false })
    .first();

  if (!user || !token) {
    return null;
  }
  // get user role
  const userRole: table_user_role = await db("user_role")
    .where({ id: user.role_id })
    .first();
  const warehouseLoader = LoaderFactory.warehouseLoader(db);
  return {
    id: user.id,
    username: user.username,
    phoneNumber: user.phone_number,
    token: user.token,
    fullname: user.fullname,
    profile: user.profile,
    roleId: user.role_id,
    currentWarehouseId: user.warehouse_id,
    warehouse: user.warehouse_id
      ? await warehouseLoader.load(user.warehouse_id)
      : null,
    role: mapUserRole(userRole, user.id || ""),
    isDev: Boolean(user.is_dev),
  } as UserInfo;
}

export function mapUserRole(role: table_user_role, userId: string): UserRoles {
  return {
    id: role.id || "",
    role: role.role || "",
    userId: userId,
    roleId: role.id || "",
    createdAt: role.created_at || "",
    permissions: role.permissions,
  };
}

export async function getCustomerAuthFromToken(
  db: Knex,
  token: string,
): Promise<CustomerInfo | null> {
  const now = Formatter.getNowDateTime();
  const customer: table_customer & { lat: number; lng: number } = await db(
    "customer",
  )
    .innerJoin("customer_token", "customer.id", "customer_token.customer_id")
    .where({
      "customer_token.token": token,
      "customer_token.is_revoked": 0,
      "customer.is_active": 1,
    })
    .whereRaw(
      `(customer_token.expires_at IS NULL OR customer_token.expires_at > ?)`,
      [now],
    )
    .select(["customer.*", "customer_token.lat", "customer_token.lng"])
    .first();

  if (!customer || !token) {
    return null;
  }

  return {
    id: customer.id,
    name: customer.customer_name,
    phoneNumber: customer.phone,
    warehouseId: customer.pos_warehouse_id,
    isWalkin: customer.customer_name === "Walk In",
    lat: customer.lat,
    lng: customer.lng,
    email: customer.email,
    photo: customer.photo,
    emailKey: customer.email_key,
  } as CustomerInfo;
}
