/* eslint-disable @next/next/no-img-element */
import { useQueryBindUserList } from "@/app/hooks/use-query-bind-user";
import { Warehouse } from "@/dataloader/warehouse-loader";
import { ChevronsUpDown, Building2, Building } from "lucide-react";
import { useCallback, useState } from "react";
import { useAuthentication } from "../../../contexts/authentication-context";
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
import Link from "next/link";

interface BindUserItem {
  userId: string;
  group: number;
  isMain: boolean;
  user: {
    token: string;
    warehouseId: Warehouse | null;
  };
}

export function HeadSidebar() {
  const { currentWarehouse, setting, user, login } = useAuthentication();
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const { data: bindUserList } = useQueryBindUserList(user!.id!);

  const logo = setting?.data?.result
    ?.find((f) => f.option === "INVOICE_RECEIPT")
    ?.value?.split(",")[2];

  const bindUsers = (bindUserList?.result as BindUserItem[] | undefined) ?? [];
  const hasMultipleWarehouses = bindUsers.length > 1;

  const intergratesRaw = setting?.data?.result?.find(
    (f) => f.option === "BRAND_INTEGRATION",
  )?.value;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intergrates: any[] = intergratesRaw ? JSON.parse(intergratesRaw) : [];

  const onChangeOpen = useCallback((state: boolean) => {
    if (!state) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setOpen(state);
  }, []);

  const triggerContent = (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <img
          src={logo}
          alt=""
          className="size-8 object-contain aspect-square"
        />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{currentWarehouse?.name}</span>
        <span className="truncate text-xs">
          {currentWarehouse?.isMain ? "Main" : "Sub Warehouse"}
        </span>
      </div>
      {hasMultipleWarehouses && <ChevronsUpDown className="ml-auto size-4" />}
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {hasMultipleWarehouses ? (
          <DropdownMenu open={open} onOpenChange={onChangeOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {triggerContent}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel>Switch Warehouse</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {bindUsers
                .filter(
                  (item) => item.user.warehouseId?.id !== currentWarehouse?.id,
                )
                .map((item) => (
                  <DropdownMenuItem
                    key={item.userId}
                    onClick={() => login(item.user.token)}
                  >
                    <Building2 className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span>{item.user.warehouseId?.name ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.isMain ? "Main" : "Sub"}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              {intergrates.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {intergrates.map((item, index) => {
                    return (
                      <DropdownMenuItem key={index} asChild>
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Building className="mr-2 size-4" />
                          <div className="flex flex-col">
                            <span>{item.name ?? "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">
                              Brand Integration
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            {triggerContent}
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
