"use client";
import React from "react";
import { useAuthentication } from "../../../contexts/authentication-context";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";

type Permission = "ROOT" | "IMS" | "POS" | "BOM";

interface Props {
  permission: Permission[];
}

export function LayoutPermission(props: React.PropsWithChildren<Props>) {
  const { currentWarehouse } = useAuthentication();
  let allow = true; // will implement user authorization later

  if (currentWarehouse?.isMain) {
    allow = props.permission.includes("ROOT");
  }
  // else {
  //   for (const role of user?.roles || []) {
  //     if (props.permission.includes(role.application)) {
  //       allow = true;
  //       break;
  //     }
  //   }
  // }

  if (!allow) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Permission denied!</AlertTitle>
          <AlertDescription>
            Your current role are not allow to access page. Please log in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return props.children;
}
