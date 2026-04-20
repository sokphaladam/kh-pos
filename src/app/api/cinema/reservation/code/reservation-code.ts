import {
  CinemaReservationService,
  SeatReservation,
} from "@/classes/cinema/reservation";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getReservationByCode = withAuthApi<
  unknown,
  unknown,
  ResponseType<SeatReservation[]>,
  {
    code?: string;
    customerPhone?: string;
  }
>(async ({ db, userAuth, searchParams }) => {
  const params = searchParams;
  const code = params?.code || "";
  const customerPhone = params?.customerPhone || "";
  const reservationService = new CinemaReservationService(db, userAuth.admin!);

  const res = await reservationService.getReservationByCode({
    code,
    customerPhone,
  });

  return NextResponse.json(
    {
      success: true,
      result: res ?? undefined,
      error: undefined,
    },
    { status: 200 },
  );
});
