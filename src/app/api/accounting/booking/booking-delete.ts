import { AccountBookingService } from "@/classes/accounting/account-booking";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteBooking = withAuthApi<
  { id: string },
  unknown,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const id = (body as { id: string }).id;

  const accountBookingService = new AccountBookingService(db);

  const result = await accountBookingService.deleteAccountBooking(
    id,
    userAuth.admin!,
  );
  return NextResponse.json(result, { status: 200 });
});
