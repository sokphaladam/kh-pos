import { CustomerService } from "@/classes/customer";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { schemaCustomer, SchemaCustomerType } from "../customer-create";

export const updateCustomerId = withAuthApi<
  { id: string },
  SchemaCustomerType,
  ResponseType<unknown>
>(async ({ db, params, body, userAuth }) => {
  const data = schemaCustomer.parse(body);
  const customerService = new CustomerService(db);

  const result = await customerService.updateCustomer(params?.id || "", {
    customerName: data.customerName,
    phoneNumber: data.phone,
    address: data.address || "",
    warehouseId: userAuth.admin?.currentWarehouseId || "",
    createdBy: userAuth.admin?.id || "",
    type: data.type || "general",
    extraPrice: data.extraPrice || 0,
  });

  return NextResponse.json(
    { success: true, result: result, error: "" },
    { status: 200 },
  );
});
