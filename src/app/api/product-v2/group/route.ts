import { createProductGroup } from "./create-group";
import { deleteProductGroup } from "./delete-group";
import { getGroupList } from "./get-group-list";
import { updateProductGroup } from "./update-group";

export const GET = getGroupList;
export const POST = createProductGroup;
export const PUT = updateProductGroup;
export const DELETE = deleteProductGroup;
