import { CinemaReservationService } from "@/classes/cinema/reservation";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const sendReservationSocket = withAuthApi<
  unknown,
  { ids: string[] },
  ResponseType<boolean>
>(async ({ db, body, userAuth }) => {
  const ids = body?.ids;

  const cinemaReservation = new CinemaReservationService(db, userAuth.admin!);

  const res = await cinemaReservation.sendReservationTicketToPrinter(ids || []);

  return NextResponse.json({ 
    success: res.success, 
    result: res.success, 
    error: res.error 
  }, { status: 200 });
});
