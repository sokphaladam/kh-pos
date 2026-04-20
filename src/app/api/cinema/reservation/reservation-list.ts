import { CinemaReservationService } from "@/classes/cinema/reservation";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getReservationList = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown>,
  {
    limit: number;
    offset: number;
    status?: string;
    date?: string;
    showtimeId?: string;
  }
>(
  async ({ db, userAuth, searchParams }) => {
    const params = searchParams;
    const limit = params?.limit || 30;
    const offset = params?.offset || 0;
    const status = params?.status
      ? (params.status || "").split(",")
      : undefined;
    const date = params?.date || undefined;
    const showtimeId = params?.showtimeId || undefined;
    const authUser = (userAuth.admin ?? userAuth.customer) as NonNullable<
      typeof userAuth.admin
    >;
    const reservationService = new CinemaReservationService(db, authUser);

    const res = await reservationService.reservationList({
      limit,
      offset,
      date,
      status,
      showtimeId,
    });

    return NextResponse.json(
      {
        success: true,
        result: res,
        error: "",
      },
      { status: 200 },
    );
  },
  ["PUBLIC"],
);
