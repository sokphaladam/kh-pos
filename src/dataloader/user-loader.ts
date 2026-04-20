import { table_user } from "@/generated/tables";
import DataLoader from "dataloader";
import { Knex } from "knex";
import { LoaderFactory } from "./loader-factory";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export function createUserLoader(
  db: Knex
): DataLoader<string, UserInfo | null> {
  return new DataLoader(async (keys: readonly string[]) => {
    const rows: table_user[] = await db("user").whereIn("id", keys);
    const warehouseLoader = LoaderFactory.warehouseLoader(db);

    return Promise.all(
      keys.map(async (key) => {
        const user = rows.find((u) => u.id === key && u.id !== undefined);
        if (!user) return null;
        return {
          id: user.id as string,
          username: user.username,
          phoneNumber: user.phone_number,
          token: user.token,
          fullname: user.fullname ?? "",
          profile: user.profile ?? "",
          roleId: user.role_id,
          warehouseId: user.warehouse_id
            ? await warehouseLoader.load(user.warehouse_id)
            : null,
          createdAt: user.created_at,
        };
      })
    );
  });
}
