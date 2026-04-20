import { Showtime, ShowtimeService } from "@/classes/cinema/showtime";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const getShowtimeList = withAuthApi<
  unknown,
  unknown,
  ResponseType<{ data: Showtime[]; total: number }>,
  {
    limit: number;
    offset: number;
    status?: string;
    showDate?: string;
    movieId?: string;
  }
>(
  async ({ db, userAuth, searchParams }) => {
    const params = searchParams;
    const limit = params?.limit || 30;
    const offset = params?.offset || 0;
    const status = params?.status ? params?.status.split(",") : undefined;
    const showDate = params?.showDate || undefined;
    const movieId = params?.movieId || undefined;
    const authUser = (userAuth.admin ?? userAuth.customer) as NonNullable<
      typeof userAuth.admin
    >;
    const showtimeService = new ShowtimeService(db, authUser);

    const result = await showtimeService.listShowtimes(
      limit,
      offset,
      status,
      showDate,
      movieId,
    );

    return NextResponse.json(
      { success: true, result, error: "" },
      { status: 200 },
    );
  },
  ["PUBLIC"],
);
