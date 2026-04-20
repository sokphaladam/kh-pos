"use client";

import { useMe } from "@/app/hooks/use-query-user";
import { CommonDialogProvider } from "@/components/common-dialog";
import { DialogProvider } from "@/components/create-dialog";
import { SheetProvider } from "@/components/create-sheet";
import { ErrorBoundary } from "@/components/error-boundary";
import { LayoutLoading } from "@/components/layout-loading";
import { HeaderLayout } from "@/components/layout/header-layout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { safeNavigate } from "@/lib/client-utils";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthenticationProvider } from "../../../contexts/authentication-context";

interface AdminClientWrapperProps {
  children: React.ReactNode;
}

export function AdminClientWrapper({ children }: AdminClientWrapperProps) {
  const pathname = usePathname();
  const { data, isLoading, isValidating } = useMe();

  useEffect(() => {
    if (
      !isLoading &&
      !isValidating &&
      !data?.user &&
      !!Cookies.get("session")
    ) {
      // Clear invalid session cookie
      Cookies.remove("session", { path: "/" });
      safeNavigate("/admin/login");
    } else {
      if (data?.user) {
        const expires = new Date(
          new Date().getTime() + 1000 * 60 * 60 * 24 * 365
        );
        const isProduction = process.env.NODE_ENV === "production";

        // Keep cookie options consistent with login
        const cookieOptions = {
          expires,
          secure: isProduction, // Only secure in production (HTTPS)
          sameSite: "lax" as const,
          path: "/",
        };

        // Update session cookie to keep it fresh
        Cookies.set("session", JSON.stringify(data.user), cookieOptions);
      }
    }
  }, [data, isLoading, isValidating]);

  if (isLoading) {
    return <LayoutLoading />;
  }

  const user = data?.user;
  const allowPath = [
    "pos",
    "restaurant",
    "sale-report",
    "stock-report",
    "setting",
  ];

  let render = null;

  if (user) {
    if (user.id) {
      const path = pathname.split("/");
      if (allowPath.includes(path[path.length - 1])) {
        render = children;
      } else {
        render = (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <HeaderLayout />
              <div className="flex flex-1 relative p-4 bg-muted/40">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        );
      }
    } else {
      render = <LayoutLoading />;
    }
  } else {
    render = (
      <Suspense
        fallback={
          <div suppressHydrationWarning>
            <LayoutLoading />
          </div>
        }
      >
        {children}
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <CommonDialogProvider>
        <AuthenticationProvider user={user}>
          {render}
          <DialogProvider slot="default" />
          <SheetProvider slot="default" />
        </AuthenticationProvider>
      </CommonDialogProvider>
    </ErrorBoundary>
  );
}
