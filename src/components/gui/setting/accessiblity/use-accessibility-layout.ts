import { useState, useMemo } from "react";
import { useQueryRoles } from "@/app/hooks/use-query-roles";
import { useUpdateUserRole } from "@/app/hooks/use-query-roles";
import { Action, actions } from "@/lib/permissions";
import { toast } from "sonner";
import { transformRoles, serializePermissions } from "./utils";
import { AddRoleSheetOptions, TransformedRole } from "./types";
import { createSheet } from "@/components/create-sheet";
import { AddRoleSheet } from "./add-role-sheet";

export const useAccessibilityLayout = () => {
  const { data: roles, isLoading, mutate } = useQueryRoles();
  const { trigger: updateRole, isMutating: isUpdating } = useUpdateUserRole();
  const transformedRoles = useMemo(
    () => (roles ? transformRoles(roles) : []),
    [roles]
  );

  const [editingPermissions, setEditingPermissions] = useState<
    Record<string, Record<string, Action[]>>
  >({});
  const [newPermissionInputs, setNewPermissionInputs] = useState<
    Record<string, string>
  >({});
  // Changed to store single expanded role ID instead of set of collapsed roles
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const getCurrentPermissions = (role: TransformedRole) => {
    return editingPermissions[role.id] || role.permissions;
  };

  const handlePermissionToggle = (
    roleId: string,
    resource: string,
    actions: Action | Action[],
    enabled: boolean
  ) => {
    const currentPerms =
      editingPermissions[roleId] ||
      transformedRoles.find((r) => r.id === roleId)?.permissions ||
      {};

    const currentResourceActions = currentPerms[resource] || [];

    // Handle both single action and array of actions
    const actionsToUpdate = Array.isArray(actions) ? actions : [actions];

    let updatedActions = [...currentResourceActions];

    if (enabled) {
      // Add all actions that aren't already present
      actionsToUpdate.forEach((action) => {
        if (!updatedActions.includes(action)) {
          updatedActions.push(action);
        }
      });
    } else {
      // Remove all specified actions
      updatedActions = updatedActions.filter(
        (a) => !actionsToUpdate.includes(a)
      );
    }

    setEditingPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...currentPerms,
        [resource]: updatedActions,
      },
    }));
  };

  const handleRemoveResource = (roleId: string, resource: string) => {
    const currentPerms =
      editingPermissions[roleId] ||
      transformedRoles.find((r) => r.id === roleId)?.permissions ||
      {};

    // Create a new permissions object without the specified resource
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [resource]: _, ...updatedPerms } = currentPerms;

    setEditingPermissions((prev) => ({
      ...prev,
      [roleId]: updatedPerms,
    }));

    toast.success(`Removed ${resource.replace(/-/g, " ")} permissions`);
  };

  const handleSave = async (roleId: string) => {
    const permissionsToSave = editingPermissions[roleId];
    if (!permissionsToSave) return;

    const currentRole = transformedRoles.find((r) => r.id === roleId);
    if (!currentRole) {
      toast.error("Role not found");
      return;
    }

    const serialized = serializePermissions(permissionsToSave);

    try {
      await updateRole({
        id: roleId,
        role: currentRole.role,
        permissions: serialized,
      });

      setEditingPermissions((prev) => {
        const newState = { ...prev };
        delete newState[roleId];
        return newState;
      });
      mutate();
      toast.success("Permissions updated successfully");
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Error updating permissions");
    }
  };

  const handleCancel = (roleId: string) => {
    setEditingPermissions((prev) => {
      const newState = { ...prev };
      delete newState[roleId];
      return newState;
    });
    setNewPermissionInputs((prev) => {
      const newState = { ...prev };
      delete newState[roleId];
      return newState;
    });
  };

  const handleAddPermission = (roleId: string) => {
    const input = newPermissionInputs[roleId]?.trim();
    if (!input) {
      toast.error(
        "Please enter a permission in format: resource:action1,action2"
      );
      return;
    }

    const [resource, actionsStr] = input.split(":");
    if (!resource || !actionsStr) {
      toast.error(
        "Invalid format. Use: resource:action1,action2 (e.g., user:create,update)"
      );
      return;
    }

    const newActions = actionsStr.split(",").map((a) => a.trim()) as Action[];
    const validActions = newActions.filter((a) => actions.includes(a));

    if (validActions.length === 0) {
      toast.error(
        "No valid actions found. Valid actions: create, read, update, delete"
      );
      return;
    }

    const currentPerms =
      editingPermissions[roleId] ||
      transformedRoles.find((r) => r.id === roleId)?.permissions ||
      {};

    setEditingPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...currentPerms,
        [resource.trim()]: validActions,
      },
    }));

    setNewPermissionInputs((prev) => ({
      ...prev,
      [roleId]: "",
    }));

    toast.success(
      `Added ${validActions.join(", ")} permissions for ${resource}`
    );
  };

  const handleInputChange = (roleId: string, value: string) => {
    setNewPermissionInputs((prev) => ({
      ...prev,
      [roleId]: value,
    }));
  };

  const toggleCollapse = (roleId: string) => {
    // If the same role is clicked, collapse it (set to null)
    // If a different role is clicked, expand that one and collapse others
    setExpandedRole((prev) => (prev === roleId ? null : roleId));
  };

  const openAddRoleSheet = async () => {
    try {
      await createSheet<AddRoleSheetOptions, boolean>(AddRoleSheet).show({
        mutate,
      });
    } catch {
      // Sheet was cancelled
    }
  };

  return {
    // Data
    transformedRoles,
    isLoading,
    isUpdating,
    mutate,
    editingPermissions,
    newPermissionInputs,
    expandedRole,
    actions,

    // Computed
    getCurrentPermissions,
    openAddRoleSheet,

    // Actions
    handlePermissionToggle,
    handleRemoveResource,
    handleSave,
    handleCancel,
    handleAddPermission,
    handleInputChange,
    toggleCollapse,
  };
};
