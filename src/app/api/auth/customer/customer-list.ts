import { Customer, CustomerService } from "@/classes/customer";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getCustomerList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: Customer[]; total: number }>,
  {
    limit: number;
    offset: number;
    phone?: string;
    type?: "general" | "delivery";
  }
>(async ({ db, userAuth, searchParams }) => {
  const params = searchParams;
  const limit = params?.limit || 30;
  const offset = params?.offset || 0;
  const phone = params?.phone || undefined;
  const type = params?.type || undefined;

  const customerService = new CustomerService(db);

  const result = await customerService.getCustomerList({
    limit,
    offset,
    warehouseId: userAuth.admin?.currentWarehouseId || "",
    phone,
    type,
  });

  return NextResponse.json(
    { success: true, result, error: "" },
    { status: 200 },
  );
});
