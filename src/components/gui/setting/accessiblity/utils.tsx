import { Action } from "@/lib/permissions";
import { Role } from "@/lib/server-functions/get-role-list";
import {
  Building2,
  ChefHat,
  FileText,
  Package,
  Shield,
  ShoppingCart,
  User,
  Users,
  Warehouse,
} from "lucide-react";
import React from "react";
import { TransformedRole } from "./types";

export const getResourceIcon = (resource: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    user: <User className="h-5 w-5" />,
    product: <Package className="h-5 w-5" />,
    order: <ShoppingCart className="h-5 w-5" />,
    warehouse: <Warehouse className="h-5 w-5" />,
    report: <FileText className="h-5 w-5" />,
    customer: <Users className="h-5 w-5" />,
    supplier: <Building2 className="h-5 w-5" />,
    accessibility: <Shield className="h-5 w-5" />,
    "order-preparation": <ChefHat className="h-5 w-5" />,
  };
  return iconMap[resource] || <Shield className="h-5 w-5" />;
};

export const getResourceDescription = (resource: string): string => {
  const descriptions: Record<string, string> = {
    user: "Manage user accounts, roles, and authentication",
    product: "Handle product catalog, inventory, and variants",
    order: "Process orders, payments, and order management",
    warehouse: "Control warehouse operations and stock movements",
    report: "Access reporting and analytics features",
    customer: "Manage customer information and relationships",
    supplier: "Handle supplier data and purchase orders",
    accessibility: "Configure accessibility and permission settings",
    "order-preparation":
      "Control order preparation status updates (pending, cooking, served)",
  };
  return (
    descriptions[resource] ||
    `Manage ${resource.replace(/-/g, " ")} permissions`
  );
};

export function transformRoles(roles: Role[]): TransformedRole[] {
  return roles.map((role) => {
    const permissions: Record<string, Action[]> = {};

    if (!!role.permissions) {
      try {
        for (const [key, value] of Object.entries(role.permissions)) {
          permissions[key] = (value as string)
            .split(",")
            .map((perm) => perm.trim()) as Action[];
        }
      } catch (error) {
        console.error("Error parsing permissions for role:", role.role, error);
      }
    }

    return {
      id: role.id,
      role: role.role,
      permissions,
    };
  });
}

export function serializePermissions(
  permissions: Record<string, Action[]>
): string {
  const serialized: Record<string, string> = {};

  for (const [resource, actionArray] of Object.entries(permissions)) {
    if (actionArray.length > 0) {
      serialized[resource] = actionArray.join(",");
    }
  }

  return JSON.stringify(serialized);
}
