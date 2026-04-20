import { Knex } from "knex";
import { NextRequest } from "next/server";
import { v5 } from "uuid";
import bcrypt from "bcryptjs";
import { Formatter } from "../../formatter";
import { UserInput } from "../../types";
import { table_user } from "@/generated/tables";
import { UserInfo } from "../get-auth-from-token";

export default async function createUser(
  req: NextRequest,
  db: Knex,
  input: UserInput,
  currentUser: UserInfo | null
) {
  const hashedPassword = await bcrypt.hash(input.password, 10);
  // const userId = v4();
  const token =
    v5(input.phoneNumber, v5.URL).split("-").join("") + new Date().getTime();
  const now = Formatter.getNowDateTime();

  const user: table_user = {
    id: input.id,
    phone_number: input.phoneNumber,
    username: input.username,
    password: hashedPassword,
    token,
    created_at: now,
    fullname: input.fullname,
    profile: input.profile,
    role_id: input.roleId || "",
    warehouse_id: input.warehouseId || "",
    created_by: currentUser?.id || null,
  };

  await db.table("user").insert(user);

  return {
    ...input,
    id: input.id || "",
    token,
    roleId: null,
    warehouse: null,
    currentWarehouseId: input.warehouseId,
  } as UserInfo;
}
