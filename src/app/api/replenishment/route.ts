import { createReplenishment } from "./create-replenishment";
import { deleteReplenishment } from "./delete-replenishment";
import { getReplenishment } from "./get-replenishment";
import { updateReplenishment } from "./update-replenishment";

export const POST = createReplenishment;

export const PUT = updateReplenishment;

export const GET = getReplenishment;

export const DELETE = deleteReplenishment;
