import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X, Shield } from "lucide-react";
import { Action } from "@/lib/permissions";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { RolePermissionToggle } from "./role-card";
import { ResourceSelector } from "./resource-selector";

interface PermissionFormProps {
  newRoleName: string;
  setNewRoleName: (value: string) => void;
  selectedPermissions: Record<string, Action[]>;
  onPermissionChange: (
    resource: string,
    actions: Action | Action[],
    enabled: boolean
  ) => void;
  selectedResource: string;
  setSelectedResource: (value: string) => void;
  onAddResource: (resource: string) => void; // Updated signature
  onRemoveResource: (resource: string) => void;
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({
  newRoleName,
  setNewRoleName,
  selectedPermissions,
  onPermissionChange,
  selectedResource,
  setSelectedResource,
  onAddResource,
  onRemoveResource,
  getResourceIcon,
  getResourceDescription,
}) => {
  const handleAddResource = (resource: string) => {
    onAddResource(resource);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label
            htmlFor="roleName"
            className="text-lg font-semibold text-gray-900"
          >
            Role Name
          </Label>
          <Input
            id="roleName"
            placeholder="Enter role name (e.g., Manager, Staff)"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            maxLength={50}
            className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          <ResourceSelector
            selectedResource={selectedResource}
            onResourceChange={setSelectedResource}
            existingPermissions={selectedPermissions}
            onAddResource={handleAddResource}
            getResourceIcon={getResourceIcon}
            getResourceDescription={getResourceDescription}
          />

          {/* Show permissions for added resources */}
          {Object.keys(selectedPermissions).length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                Configure Permissions
              </h4>
              {Object.entries(selectedPermissions).map(
                ([resource, resourceActions]) => (
                  <div key={resource} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          {getResourceIcon(resource)}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 capitalize">
                            {resource.replace(/-/g, " ")}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {getResourceDescription(resource)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveResource(resource)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {DEFAULT_ROLE_PERMISSIONS[
                        resource as keyof typeof DEFAULT_ROLE_PERMISSIONS
                      ]?.map((action) => (
                        <RolePermissionToggle
                          key={action}
                          resource={resource}
                          action={action}
                          isEnabled={resourceActions.includes(action)}
                          onChange={onPermissionChange}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PermissionCardProps {
  resource: string;
  resourceActions: Action[];
  actions: Action[];
  onRemove: (resource: string) => void;
  onToggle: (
    resource: string,
    actions: Action | Action[],
    checked: boolean
  ) => void;
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  resource,
  resourceActions,
  actions,
  onRemove,
  onToggle,
  getResourceIcon,
  getResourceDescription,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            {getResourceIcon(resource)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">
              {resource.replace(/-/g, " ")}
            </h3>
            <p className="text-sm text-gray-500">
              {getResourceDescription(resource)}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(resource)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-1">
        {actions.map((action, index) => (
          <div key={action}>
            <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                </div>
                <label className="text-sm font-medium capitalize text-gray-900">
                  {action.replace("-", " ")}
                </label>
              </div>
              <Switch
                checked={resourceActions.includes(action)}
                onCheckedChange={(checked) =>
                  onToggle(resource, action, checked)
                }
              />
            </div>
            {index < actions.length - 1 && (
              <div className="mx-4 border-b border-gray-100"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface PermissionListProps {
  permissions: Record<string, Action[]>;
  actions: Action[];
  onRemove: (resource: string) => void;
  onToggle: (
    resource: string,
    actions: Action | Action[],
    checked: boolean
  ) => void;
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
}

export const PermissionList: React.FC<PermissionListProps> = ({
  permissions,
  actions,
  onRemove,
  onToggle,
  getResourceIcon,
  getResourceDescription,
}) => {
  if (Object.keys(permissions).length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No permissions added yet
        </h3>
        <p className="text-gray-600">
          Add resources to configure permissions for this role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(permissions).map(([resource, resourceActions]) => (
        <PermissionCard
          key={resource}
          resource={resource}
          resourceActions={resourceActions}
          actions={actions}
          onRemove={onRemove}
          onToggle={onToggle}
          getResourceIcon={getResourceIcon}
          getResourceDescription={getResourceDescription}
        />
      ))}
    </div>
  );
};

interface PermissionActionsProps {
  onCancel: () => void;
  onSave: () => void;
  isDisabled: boolean;
}

export const PermissionActions: React.FC<PermissionActionsProps> = ({
  onCancel,
  onSave,
  isDisabled,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="h-10 px-6 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={isDisabled}
          className="h-10 px-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Save className="h-4 w-4" />
          Create Role
        </Button>
      </div>
    </div>
  );
};
