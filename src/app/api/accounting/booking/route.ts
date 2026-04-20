import { createBooking } from "./booking-create";
import { deleteBooking } from "./booking-delete";
import { getBookingList } from "./booking-list";

export const POST = createBooking;
export const GET = getBookingList;
export const DELETE = deleteBooking;
