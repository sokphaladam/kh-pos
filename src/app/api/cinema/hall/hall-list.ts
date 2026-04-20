import { CinemaHall, CinemaHallService } from "@/classes/cinema/hall";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getHallList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: CinemaHall[]; total: number }>,
  { limit: number; offset: number; status?: string }
>(async ({ db, userAuth, searchParams }) => {
  const params = searchParams;
  const limit = params?.limit || 30;
  const offset = params?.offset || 0;
  const status = params?.status ? (params.status || "").split(",") : undefined;
  const cinemaHall = new CinemaHallService(db, userAuth.admin!);

  const result = await cinemaHall.getHallList(limit, offset, status);

  return NextResponse.json(
    { success: true, result, error: "" },
    { status: 200 }
  );
});
