import { Customer, CustomerService } from "@/classes/customer";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getCustomerId = withAuthApi<
  { id: string },
  unknown,
  ResponseType<{ data: Customer }>
>(async ({ db, params }) => {
  const customerService = new CustomerService(db);

  const result = await customerService.getCustomerById(params?.id || "");

  if (!result) {
    return NextResponse.json(
      { success: false, result: undefined, error: "Customer not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true, result: { data: result }, error: "" },
    { status: 200 }
  );
});
