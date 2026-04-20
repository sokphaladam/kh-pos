import { useAuthentication } from "../../contexts/authentication-context";
import { Action, Resource, checkUserAction } from "../lib/permissions";

// Hook to check if user has specific permission
export function usePermission(resource?: Resource): Action[] {
  const { user } = useAuthentication();

  if (!user?.role || !resource) {
    return [];
  }

  if (user.role.role === "OWNER") {
    return ["create", "read", "update", "delete"];
  }

  const permission = user.role.permissions;

  return checkUserAction(
    resource,
    permission as Record<string, Action[]> | null
  );
}
