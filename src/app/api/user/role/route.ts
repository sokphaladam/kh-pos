import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
} from "@/lib/server-functions/get-role-list";

export const GET = getRoleList;
export const POST = createRole;
export const PUT = updateRole;
export const DELETE = deleteRole;
