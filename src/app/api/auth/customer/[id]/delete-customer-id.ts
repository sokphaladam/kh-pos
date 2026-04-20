import { CustomerService } from "@/classes/customer";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteCustomerId = withAuthApi<
  { id: string },
  unknown,
  ResponseType<unknown>
>(async ({ db, params }) => {
  const customerService = new CustomerService(db);

  const res = customerService.deleteCustomer(params?.id || "");

  return NextResponse.json(
    { success: true, result: res, error: "" },
    { status: 200 },
  );
});
