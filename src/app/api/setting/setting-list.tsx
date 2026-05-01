import { table_setting } from "@/generated/tables";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const settingList = withAuthApi<
  unknown,
  unknown,
  ResponseType<table_setting[]>
>(
  async ({ userAuth, db }) => {
    const warehouseId = userAuth.admin
      ? userAuth.admin.currentWarehouseId
      : userAuth.customer?.warehouseId;

    const list = await db
      .table("setting")
      .where({ warehouse: null })
      .orWhere("warehouse", warehouseId);

    const result = list;

    return NextResponse.json(
      { success: true, result, error: "" },
      { status: 200 }
    );
  },
  ["ADMIN", "CUSTOMER"]
);
