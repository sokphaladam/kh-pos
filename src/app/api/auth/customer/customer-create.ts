import { CustomerService } from "@/classes/customer";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const schemaCustomer = z.object({
  customerName: z.string(),
  phone: z.string(),
  address: z.string().optional(),
  type: z.enum(["general", "delivery"]).optional(),
  extraPrice: z.number().optional(),
});

export type SchemaCustomerType = z.infer<typeof schemaCustomer>;

export const createCustomer = withAuthApi<
  unknown,
  SchemaCustomerType,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const data = schemaCustomer.parse(body);
  const customerService = new CustomerService(db);

  const res = await customerService.createCustomer({
    customerName: data.customerName,
    phoneNumber: data.phone,
    address: data.address || "",
    warehouseId: userAuth.admin?.currentWarehouseId || "",
    createdBy: userAuth.admin?.id || "",
    type: data.type || "general",
    extraPrice: data.extraPrice || 0,
  });

  return NextResponse.json(
    { success: true, result: res, error: "" },
    { status: 200 },
  );
});
