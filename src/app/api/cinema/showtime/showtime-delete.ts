import { ShowtimeService } from "@/classes/cinema/showtime";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const deleteShowtime = withAuthApi<
  { id: string },
  unknown,
  ResponseType<unknown>
>(async ({ db, body, userAuth }) => {
  const showtimeService = new ShowtimeService(db, userAuth.admin!);
  await showtimeService.deleteShowtime((body as { id: string }).id);

  return NextResponse.json(
    { success: true, result: true, error: "" },
    { status: 200 }
  );
});
