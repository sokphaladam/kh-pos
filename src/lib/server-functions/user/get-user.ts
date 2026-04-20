import { table_user } from "@/generated/tables";
import { Knex } from "knex";
import { UserInfo } from "../get-auth-from-token";
import { LoaderFactory } from "@/dataloader/loader-factory";

export async function getUserList(
  db: Knex,
  limit: number = 30,
  offset: number = 0,
  user: UserInfo | null
): Promise<{ data: UserInfo[]; total: number }> {
  const query = db
    .table<table_user>("user")
    .where("is_deleted", false)
    .andWhere("warehouse_id", user?.currentWarehouseId)
    .andWhere(function () {
      this.where("is_system_admin", 0).orWhere("is_dev", 0);
    });

  const { total } = await query
    .clone()
    .count("* as total")
    .first<{ total: number }>();

  const users: table_user[] = await query
    .clone()
    .limit(limit)
    .offset(offset)
    .orderBy("id", "desc");

  const roleLoader = LoaderFactory.roleLoader(db);
  const warehouseLoader = LoaderFactory.warehouseLoader(db);

  const data = await Promise.all(
    users.map(async (user) => {
      return {
        id: user.id || "",
        username: user.username || "",
        phoneNumber: user.phone_number || "",
        token: user.token || "",
        fullname: user.fullname || "",
        profile: user.profile || "",
        roleId: user.role_id || null,
        warehouse: user.warehouse_id
          ? await warehouseLoader.load(user.warehouse_id)
          : null,
        role: user.role_id ? await roleLoader.load(user.role_id) : null,
        currentWarehouseId: user.warehouse_id || null,
        isDev: Boolean(user.is_dev),
      } as UserInfo;
    })
  );

  return {
    data,
    total,
  };
}
