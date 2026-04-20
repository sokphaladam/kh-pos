import {
  AccountBookingService,
  SchemaAccountBooking,
  TypeSchemaAccountBooking,
} from "@/classes/accounting/account-booking";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const createBooking = withAuthApi<
  unknown,
  TypeSchemaAccountBooking,
  ResponseType<unknown>
>(async ({ db, userAuth, body }) => {
  const input = SchemaAccountBooking.parse(body);

  const accountBookingService = new AccountBookingService(db);

  const result = await accountBookingService.createAccountBooking(
    input,
    userAuth.admin!,
  );

  return NextResponse.json(result, { status: 200 });
});
