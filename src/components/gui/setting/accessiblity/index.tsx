"use client";

import React from "react";
import { RoleCard } from "./role-card";
import { HeaderSection, LoadingState, EmptyState } from "./layout-components";
import { useAccessibilityLayout } from "./use-accessibility-layout";
import { getResourceIcon, getResourceDescription } from "./utils";
import {
  withLayoutPermission,
  WithLayoutPermissionProps,
} from "@/hoc/with-layout-permission";

function AccessibilityLayout(props: WithLayoutPermissionProps) {
  const {
    transformedRoles,
    isLoading,
    editingPermissions,
    expandedRole,
    actions,
    getCurrentPermissions,
    handlePermissionToggle,
    handleRemoveResource,
    handleSave,
    handleCancel,
    toggleCollapse,
    openAddRoleSheet,
  } = useAccessibilityLayout();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8 max-w-6xl mx-auto">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-6xl mx-auto">
        {!!props.allowCreate && <HeaderSection onAddRole={openAddRoleSheet} />}

        <div className="space-y-8">
          {transformedRoles.map((role) => {
            const currentPerms = getCurrentPermissions(role);
            const hasChanges = !!editingPermissions[role.id];
            const isCollapsed = expandedRole !== role.id; // Role is collapsed if it's not the expanded one

            return (
              <RoleCard
                key={role.id}
                role={role}
                action={props}
                isCollapsed={isCollapsed}
                hasChanges={hasChanges}
                currentPermissions={currentPerms}
                actions={actions}
                onToggleCollapse={() => toggleCollapse(role.id)}
                onPermissionChange={(resource, actions, enabled) =>
                  handlePermissionToggle(role.id, resource, actions, enabled)
                }
                onRemoveResource={(resource) =>
                  handleRemoveResource(role.id, resource)
                }
                onSave={handleSave}
                onCancel={handleCancel}
                getResourceIcon={getResourceIcon}
                getResourceDescription={getResourceDescription}
              />
            );
          })}

          {transformedRoles.length === 0 && (
            <EmptyState
              title="No roles found"
              description="No roles are available in your system. Please create roles first."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default withLayoutPermission(AccessibilityLayout, "accessibility");
