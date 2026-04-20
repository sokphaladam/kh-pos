import { createModifier } from "./create-modifier";
import { deleteModifier } from "./delete-modifier";
import { listModifier } from "./list-modifier";
import { updateModifier } from "./update-modifier";

export const POST = createModifier;
export const PUT = updateModifier;
export const DELETE = deleteModifier;
export const GET = listModifier;
