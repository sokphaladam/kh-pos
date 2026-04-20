import React, { useState } from "react";
import { AddRoleSheetProps } from "./types";
import { PermissionForm, PermissionActions } from "./permission-components";
import { Action } from "@/lib/permissions";
import { toast } from "sonner";
import { useCreateRoleMutation } from "@/app/hooks/use-query-roles";
import {
  serializePermissions,
  getResourceIcon,
  getResourceDescription,
} from "./utils";

export const AddRoleSheet: React.FC<AddRoleSheetProps> = ({
  close,
  mutate,
}) => {
  const { trigger: createRole, isMutating: isCreating } =
    useCreateRoleMutation();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<
    Record<string, Action[]>
  >({});
  const [selectedResource, setSelectedResource] = useState("");

  const handleCreateRole = async (): Promise<boolean> => {
    if (!newRoleName.trim()) {
      toast.error("Please enter a role name");
      return false;
    }

    if (newRoleName.trim().length > 50) {
      toast.error("Role name must be 50 characters or less");
      return false;
    }

    const serialized = serializePermissions(newRolePermissions);

    try {
      await createRole({
        role: newRoleName.trim(),
        permissions: serialized,
      });

      toast.success("Role created successfully");
      mutate(); // Refresh the data
      return true; // Indicate success for sheet closing
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Error creating role");
      return false;
    }
  };

  const handleAddNewRolePermission = (resource: string) => {
    if (resource && !newRolePermissions[resource]) {
      // Initialize the resource with only 'read' permission by default
      setNewRolePermissions((prev) => ({
        ...prev,
        [resource]: ["create", "read", "update", "delete"],
      }));
      setSelectedResource(""); // Clear selection after adding
      toast.success(`Added ${resource} resource with read permission`);
    }
  };

  const handleRemoveResource = (resource: string) => {
    setNewRolePermissions((prev) => {
      const updated = { ...prev };
      delete updated[resource];
      return updated;
    });
    toast.success(`Removed ${resource} resource`);
  };

  const handleNewRolePermissionToggle = (
    resource: string,
    actions: Action | Action[],
    checked: boolean
  ) => {
    setNewRolePermissions((prev) => {
      const currentActions = prev[resource] || [];

      // Handle both single action and array of actions
      const actionsToUpdate = Array.isArray(actions) ? actions : [actions];

      let updatedActions = [...currentActions];

      if (checked) {
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

      return {
        ...prev,
        [resource]: updatedActions,
      };
    });
  };

  const resetForm = () => {
    setNewRoleName("");
    setNewRolePermissions({});
    setSelectedResource("");
  };

  const handleSave = async () => {
    const success = await handleCreateRole();
    if (success) {
      close(true);
    }
  };

  const handleCancel = () => {
    resetForm();
    close(false);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create New Role</h2>
        <p className="text-gray-500 mt-2">
          Set up permissions and access controls for a new role
        </p>
      </div>

      <div className="space-y-8">
        <PermissionForm
          newRoleName={newRoleName}
          setNewRoleName={setNewRoleName}
          selectedPermissions={newRolePermissions}
          onPermissionChange={handleNewRolePermissionToggle}
          selectedResource={selectedResource}
          setSelectedResource={setSelectedResource}
          onAddResource={handleAddNewRolePermission}
          onRemoveResource={handleRemoveResource}
          getResourceIcon={getResourceIcon}
          getResourceDescription={getResourceDescription}
        />

        <PermissionActions
          onCancel={handleCancel}
          onSave={handleSave}
          isDisabled={!newRoleName.trim() || isCreating}
        />
      </div>
    </div>
  );
};
