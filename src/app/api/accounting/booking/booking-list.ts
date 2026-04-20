import {
  AccountBooking,
  AccountBookingService,
} from "@/classes/accounting/account-booking";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getBookingList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{
    data: AccountBooking[];
    summary: {
      total_amount: number;
      total_revenue: number;
      total_expense: number;
      total_count: number;
    };
  }>,
  {
    limit: number;
    offset: number;
    startDate?: string;
    endDate?: string;
    accountType?: "expense" | "revenue";
  }
>(async ({ db, searchParams, userAuth }) => {
  const params = searchParams;
  const limit = Number(params?.limit) || 30;
  const offset = Number(params?.offset) || 0;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const accountType = params?.accountType as "expense" | "revenue" | undefined;
  const accountBookingService = new AccountBookingService(db, userAuth.admin);

  const result = await accountBookingService.getAccountBookingList({
    limit,
    offset,
    startDate,
    endDate,
    accountType,
  });

  return NextResponse.json(
    {
      success: true,
      result,
    },
    { status: 200 },
  );
});
