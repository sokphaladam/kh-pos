import { LoaderFactory } from "@/dataloader/loader-factory";
import { table_user } from "@/generated/tables";
import {
  UserInfo,
  UserRoles,
} from "@/lib/server-functions/get-auth-from-token";
import withDatabaseApi from "@/lib/server-functions/with-database-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const GET = withDatabaseApi<
  unknown,
  unknown,
  ResponseType<{ user: UserInfo }>,
  { warehouseId: string }
>(async ({ db, searchParams }) => {
  const warehouseId = searchParams?.warehouseId;

  if (warehouseId) {
    const row: table_user = await db
      .table("user")
      .where({
        is_system_admin: true,
        warehouse_id: warehouseId,
        is_dev: false,
        is_deleted: 0,
      })
      .first();

    if (row) {
      const roleLoader = LoaderFactory.roleLoader(db);
      const warehouseLoader = LoaderFactory.warehouseLoader(db);
      const user: UserInfo = {
        id: row.id || "",
        username: row.username,
        phoneNumber: row.phone_number,
        fullname: row.fullname || "",
        profile: row.profile || "",
        roleId: row.role_id,
        token: row.token,
        isDev: row.is_dev === 1,
        currentWarehouseId: row.warehouse_id || undefined,
        role: row.role_id
          ? ((await roleLoader.load(row.role_id)) as UserRoles)
          : undefined,
        warehouse: row.warehouse_id
          ? await warehouseLoader.load(row.warehouse_id)
          : undefined,
      };
      return NextResponse.json(
        { success: true, data: { user } },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "No system admin found for the specified warehouse",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { success: false, error: "Warehouse ID is required" },
    { status: 400 },
  );
});
