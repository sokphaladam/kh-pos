import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Shield, Save, X } from "lucide-react";
import { Action } from "@/lib/permissions";
import { TransformedRole } from "./types";
import { ResourceSelector } from "./resource-selector";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

interface RolePermissionToggleProps {
  disabled?: boolean;
  resource: string;
  action: Action;
  isEnabled: boolean;
  onChange: (
    resource: string,
    actions: Action | Action[],
    enabled: boolean,
  ) => void;
}

export const RolePermissionToggle: React.FC<RolePermissionToggleProps> = ({
  resource,
  disabled,
  action,
  isEnabled,
  onChange,
}) => (
  <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900 capitalize">
          Allow {action.replace("-", " ")}
        </div>
        <div className="text-xs text-gray-500">
          Allow {action.replace("-", " ")} operations
        </div>
      </div>
    </div>
    <Switch
      disabled={disabled || action === "read"} // Disable switch if disabled or action is "read"
      checked={isEnabled || action === "read"} // Always enable "read" action
      onCheckedChange={(checked) => onChange(resource, action, checked)}
    />
  </div>
);

interface RolePermissionSectionProps {
  resource: string;
  allowDelete?: boolean;
  allowUpdate?: boolean;
  resourceActions: Action[];
  actions: Action[];
  onPermissionChange: (
    resource: string,
    actions: Action | Action[],
    enabled: boolean,
  ) => void;
  onRemoveResource: (resource: string) => void;
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
}

export const RolePermissionSection: React.FC<RolePermissionSectionProps> = ({
  resource,
  resourceActions,
  actions,
  allowDelete,
  allowUpdate,
  onPermissionChange,
  onRemoveResource,
  getResourceIcon,
  getResourceDescription,
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4 px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          {getResourceIcon(resource)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 capitalize text-lg">
            {resource.replace(/-/g, " ")}
          </h3>
          <p className="text-sm text-gray-500">
            {getResourceDescription(resource)}
          </p>
        </div>
      </div>
      <Button
        disabled={!allowDelete}
        size="sm"
        variant="ghost"
        onClick={() => onRemoveResource(resource)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg p-2"
        title={`Remove ${resource.replace(/-/g, " ")} permissions`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
    <div className="bg-white rounded-xl border border-gray-200">
      {actions.map((action, index) => (
        <div key={action}>
          <RolePermissionToggle
            resource={resource}
            disabled={!allowUpdate}
            action={action}
            isEnabled={resourceActions.includes(action)}
            onChange={onPermissionChange}
          />
          {index < actions.length - 1 && (
            <div className="mx-4 border-b border-gray-100"></div>
          )}
        </div>
      ))}
    </div>
  </div>
);

interface AddPermissionFormProps {
  roleId: string;
  currentPermissions: Record<string, Action[]>;
  onPermissionChange: (
    resource: string,
    actions: Action | Action[],
    enabled: boolean,
  ) => void;
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
}

export const AddPermissionForm: React.FC<AddPermissionFormProps> = ({
  currentPermissions,
  onPermissionChange,
  getResourceIcon,
  getResourceDescription,
}) => {
  const [selectedResource, setSelectedResource] = useState("");

  const handleAddResource = (resource: string) => {
    if (resource && !currentPermissions[resource]) {
      // Initialize the resource with all actions enabled by default
      const allActions: Action[] = ["create", "read", "update", "delete"];
      onPermissionChange(resource, allActions, true);
      setSelectedResource(""); // Clear selection after adding
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <ResourceSelector
          selectedResource={selectedResource}
          onResourceChange={setSelectedResource}
          existingPermissions={currentPermissions}
          onAddResource={handleAddResource}
          getResourceIcon={getResourceIcon}
          getResourceDescription={getResourceDescription}
        />
      </div>
    </div>
  );
};

interface RoleActionsProps {
  roleId: string;
  hasChanges: boolean;
  onSave: (roleId: string) => void;
  onCancel: (roleId: string) => void;
}

export const RoleActions: React.FC<RoleActionsProps> = ({
  roleId,
  hasChanges,
  onSave,
  onCancel,
}) => {
  if (!hasChanges) return null;

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl">
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => onCancel(roleId)}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(roleId)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

interface RoleCardProps {
  role: TransformedRole;
  isCollapsed: boolean;
  hasChanges: boolean;
  currentPermissions: Record<string, Action[]>;
  action?: WithLayoutPermissionProps;
  actions: Action[];
  onToggleCollapse: () => void;
  onPermissionChange: (
    resource: string,
    actions: Action | Action[],
    enabled: boolean,
  ) => void;
  onRemoveResource: (resource: string) => void;
  onSave: (roleId: string) => void;
  onCancel: (roleId: string) => void;
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  action,
  isCollapsed,
  hasChanges,
  currentPermissions,
  actions,
  onToggleCollapse,
  onPermissionChange,
  onRemoveResource,
  onSave,
  onCancel,
  getResourceIcon,
  getResourceDescription,
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{role.role}</h2>
            {hasChanges && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                Modified
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-3 hover:bg-white rounded-xl"
        >
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          )}
        </Button>
      </div>
    </div>

    {/* Content */}
    {!isCollapsed && (
      <div className="p-6">
        {Object.keys(currentPermissions).length > 0 ? (
          Object.entries(currentPermissions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([resource, resourceActions]) => (
              <RolePermissionSection
                key={resource}
                resource={resource}
                allowDelete={action?.allowDelete}
                allowUpdate={action?.allowUpdate}
                resourceActions={resourceActions}
                actions={actions}
                onPermissionChange={onPermissionChange}
                onRemoveResource={onRemoveResource}
                getResourceIcon={getResourceIcon}
                getResourceDescription={getResourceDescription}
              />
            ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No permissions assigned
            </h3>
            <p className="text-gray-500">
              Add permissions below to get started
            </p>
          </div>
        )}

        {!!action?.allowCreate && (
          <AddPermissionForm
            roleId={role.id}
            currentPermissions={currentPermissions}
            onPermissionChange={onPermissionChange}
            getResourceIcon={getResourceIcon}
            getResourceDescription={getResourceDescription}
          />
        )}
        {action?.allowUpdate && (
          <RoleActions
            roleId={role.id}
            hasChanges={hasChanges}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
      </div>
    )}
  </div>
);
