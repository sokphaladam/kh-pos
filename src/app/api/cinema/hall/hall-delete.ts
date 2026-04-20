import { CinemaHallService } from "@/classes/cinema/hall";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteHall = withAuthApi<
  { id: string },
  unknown,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const cinemaHallSerivice = new CinemaHallService(db, userAuth.admin!);

  await cinemaHallSerivice.deleteHall((body as { id: string }).id);

  return NextResponse.json(
    { success: true, result: true, error: "" },
    { status: 200 }
  );
});
