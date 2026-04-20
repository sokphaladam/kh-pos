import { table_user } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { generateId, generateUserToken } from "@/lib/generate-id";
import { Knex } from "knex";
import bcrypt from "bcryptjs";

interface UserProps {
  id?: string;
  username: string;
  password: string;
  warehouseId: string;
  createdBy: string;
  fullName?: string;
  phoneNumber?: string;
  profile?: string;
  roleId: string;
  isSystemAdmin?: boolean;
  isDev?: boolean;
}

export class UserService {
  constructor(protected tx: Knex) {}

  async createUser({
    username,
    password,
    warehouseId,
    createdBy,
    fullName,
    phoneNumber,
    profile,
    roleId,
    id,
    isSystemAdmin,
    isDev,
  }: UserProps) {
    const now = Formatter.getNowDateTime();
    const userId = id ?? generateId();
    const token = generateUserToken();
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.tx.table<table_user>("user").insert({
      id: userId,
      username,
      password: hashedPassword,
      warehouse_id: warehouseId,
      created_by: createdBy,
      created_at: now,
      fullname: fullName,
      phone_number: phoneNumber,
      profile,
      token,
      role_id: roleId,
      is_system_admin: isSystemAdmin ? 1 : 0,
      is_dev: isDev ? 1 : 0,
    });
    return userId;
  }

  async deleteUserByWarehouseId(warehouseId: string) {
    await this.tx
      .table<table_user>("user")
      .where({ warehouse_id: warehouseId })
      .where("is_deleted", 0)
      .update({
        is_deleted: 1,
      });
  }
}
