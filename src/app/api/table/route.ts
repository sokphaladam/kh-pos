import { createTable } from "./table-create";
import { deleteTable } from "./table-delete";
import { listTable } from "./table-list";
import { updateTable } from "./table-update";

export const POST = createTable;
export const GET = listTable;
export const PUT = updateTable;
export const DELETE = deleteTable;
