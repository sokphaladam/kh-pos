import { table_product_discount } from "@/generated/tables";
import { UserInfo } from "./server-functions/get-auth-from-token";
import { Supplier } from "./server-functions/supplier";

export interface APIResponse<Body> {
  error?: string;
  result: Body;
}

export interface ResponseType<T> {
  success: boolean;
  result?: T;
  error?: string;
  message?: string;
}

export interface UserInput {
  id?: string;
  password: string;
  username: string;
  phoneNumber: string;
  profile: string;
  fullname: string;
  roleId: string;
  warehouseId: string;
}

export interface LoginResponseType {
  token?: string;
  error?: string;
  message?: string;
}

export interface MeResponseType {
  error?: string;
  message?: string;
  user?: UserInfo;
}

export interface WarehouseInput {
  id?: string;
  name: string;
  isMain: boolean;
  slot: WarehouseSlotInput[];
}

export interface WarehouseSlotInput {
  id?: string;
  slotName: string;
  slotCapacity: number;
  slotStatus: "ACTIVE" | "INACTIVE";
}

export interface WarehouseResponseType {
  id: string;
  name: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  slot: WarehouseSlotResponseType[];
  lat: string;
  lng: string;
  address?: string;
}

export interface WarehouseSlotResponseType {
  id: string;
  slotName: string;
  warehouseId: string;
  slotCapacity: number;
  slotStatus: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleType {
  id?: string;
  role: string;
  permissions?: Record<string, string>;
  createdAt?: string;
}

export interface UserRolesResponseType {
  id: string;
  userId: string;
  roleId: string;
  application: "IMS" | "POS" | "BOM";
  applicationId: string;
  createdAt: string;
}

export interface SupplierProductPriceInput {
  id?: string;
  supplierId: string;
  productVariantId: string;
  price: number;
  scheduledPrice?: number;
  scheduledAt?: string;
}

export interface SupplierProductPriceType {
  id: string;
  supplierId: string;
  productVariantId: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
}

export interface DiscountInput {
  id: string;
  title: string;
  description?: string;
  discountType: "AMOUNT" | "PERCENTAGE";
  value: number;
  warehouseId: string;
}

export interface DiscountType {
  id: string;
  title: string;
  description: string;
  discountType: "AMOUNT" | "PERCENTAGE";
  value: number;
  warehouseId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: unknown;
  updatedBy?: unknown;
  warehouse?: unknown;
  applied?: table_product_discount[];
}
