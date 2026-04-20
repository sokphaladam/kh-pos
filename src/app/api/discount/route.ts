import { createDiscount } from "./create-discount";
import { deleteDiscount } from "./delete-discount";
import { getDiscount } from "./get-discount";
import { updateDiscount } from "./update-discount";

export const POST = createDiscount;
export const GET = getDiscount;
export const PUT = updateDiscount;
export const DELETE = deleteDiscount;
