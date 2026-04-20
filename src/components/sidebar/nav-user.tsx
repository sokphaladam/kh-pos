"use client";

import { usePermission } from "@/hooks/use-permissions";
import {
  ChevronsUpDown,
  DoorClosed,
  DoorOpen,
  LockOpen,
  LogOut,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useAuthentication } from "../../../contexts/authentication-context";
import { shiftDialog } from "../gui/shift/shift-dialog";
import { userChangePassword } from "../gui/user/user-change-password";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";

export function NavUser() {
  const { user, logout, currentShift, mutate } = useAuthentication();
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const hasShiftPermission = usePermission("shift");
  const canCreate = hasShiftPermission.includes("create");

  const onChangeOpen = useCallback((state: boolean) => {
    if (!state) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setOpen(state);
  }, []);

  const role = useMemo(() => {
    return user?.role ? user.role.role : "No Role";
  }, [user?.role]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={onChangeOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              aria-haspopup="true"
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user?.profile || "https://github.com/shadcn.png"}
                  alt={user?.fullname || user?.phoneNumber}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.fullname || user?.phoneNumber}
                </span>
                <span className="truncate text-xs">{role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user?.profile || "https://github.com/shadcn.png"}
                    alt={user?.phoneNumber}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.phoneNumber}
                  </span>
                  <span className="truncate text-xs">{role}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!currentShift && canCreate && (
              <DropdownMenuItem
                onClick={async () => {
                  onChangeOpen(false);
                  const res = await shiftDialog.show({ status: "OPEN" });
                  if (typeof res === "string") {
                    mutate();
                  }
                }}
              >
                <DoorOpen />
                Open Shift
              </DropdownMenuItem>
            )}
            {currentShift && canCreate && (
              <DropdownMenuItem
                onClick={async () => {
                  onChangeOpen(false);
                  const id = currentShift.shift_id;
                  const res = await shiftDialog.show({
                    status: "CLOSE",
                    id: id || undefined,
                  });
                  if (res === "CLOSE") {
                    mutate();
                  }
                }}
              >
                <DoorClosed />
                Close Shift
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={async () => {
                onChangeOpen(false);
                const res = await userChangePassword.show({});
                if (res) {
                  mutate();
                }
              }}
            >
              <LockOpen />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
