import { createShowtime } from "./shotime-create";
import { deleteShowtime } from "./showtime-delete";
import { getShowtimeList } from "./showtime-list";
import { updateShowtime } from "./showtime-update";

export const GET = getShowtimeList;
export const POST = createShowtime;
export const PUT = updateShowtime;
export const DELETE = deleteShowtime;
