import React, { useEffect } from "react";
import { useAuthentication } from "../../contexts/authentication-context";

export default function PrivateRoutes({ children }: React.PropsWithChildren) {
  const { isAuthenticated } = useAuthentication();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/admin/login";
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
