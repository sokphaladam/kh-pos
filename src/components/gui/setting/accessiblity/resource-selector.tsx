import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_ROLE_PERMISSIONS, Action } from "@/lib/permissions";

interface ResourceSelectorProps {
  selectedResource: string;
  onResourceChange: (resource: string) => void;
  existingPermissions: Record<string, Action[]>;
  onAddResource: (resource: string) => void; // Changed to pass resource parameter
  getResourceIcon: (resource: string) => React.ReactNode;
  getResourceDescription: (resource: string) => string;
  title?: string;
  description?: string;
  placeholder?: string;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  selectedResource,
  onResourceChange,
  existingPermissions,
  onAddResource,
  getResourceIcon,
  getResourceDescription,
  title = "Add Resource Permissions",
  description = "Select a resource and configure its permissions",
  placeholder = "Select a resource to add",
}) => {
  const resourceOptions = Object.keys(DEFAULT_ROLE_PERMISSIONS);

  // Handle resource selection and auto-add
  const handleResourceSelect = useCallback(
    (resource: string) => {
      onResourceChange(resource);
      // Auto-add the resource when selected
      if (resource && !existingPermissions[resource]) {
        onAddResource(resource);
      }
    },
    [onResourceChange, existingPermissions, onAddResource],
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <div className="space-y-4">
        <Select value={selectedResource} onValueChange={handleResourceSelect}>
          <SelectTrigger className="h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {resourceOptions
              .filter((resource) => !existingPermissions[resource])
              .sort((a, b) => a.localeCompare(b))
              .map((resource) => (
                <SelectItem key={resource} value={resource}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                      {getResourceIcon(resource)}
                    </div>
                    <div>
                      <div className="font-medium capitalize text-left">
                        {resource.replace(/-/g, " ")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getResourceDescription(resource)}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
