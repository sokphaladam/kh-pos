"use client";
import { usePermission } from "@/hooks/use-permissions";
import { Resource } from "@/lib/permissions";

export interface WithLayoutPermissionProps {
  allowCreate: boolean;
  allowUpdate: boolean;
  allowDelete: boolean;
  allowViewOnly: boolean;
}
export function withLayoutPermission<P = Record<string, never>>(
  WrappedComponent: React.ComponentType<WithLayoutPermissionProps & P>,
  resource: Resource,
) {
  const WithLayoutPermission = (props: P) => {
    const action = usePermission(resource);
    const permissionProps: WithLayoutPermissionProps = {
      allowCreate: action.includes("create"),
      allowUpdate: action.includes("update"),
      allowDelete: action.includes("delete"),
      allowViewOnly: action.includes("read"), // Changed from "view-only" to "read"
    };

    return <WrappedComponent {...permissionProps} {...props} />;
  };

  WithLayoutPermission.displayName = `withLayoutPermission(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithLayoutPermission;
}
