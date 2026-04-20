import { createHall } from "./hall-create";
import { deleteHall } from "./hall-delete";
import { getHallList } from "./hall-list";
import { updateHall } from "./hall-update";

export const GET = getHallList;
export const POST = createHall;
export const PUT = updateHall;
export const DELETE = deleteHall;
