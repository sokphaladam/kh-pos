import { createSlot } from "./create-slot";
import { deleteSlot } from "./delete-slot";
import { slotList } from "./slot-list";
import { updateSlot } from "./update-slot";

export const DELETE = deleteSlot;

export const GET = slotList;

export const POST = createSlot;

export const PUT = updateSlot;
