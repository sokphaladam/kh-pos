/* eslint-disable @next/next/no-img-element */
import { useAuthentication } from "../../../contexts/authentication-context";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export function HeadSidebar() {
  const { currentWarehouse, setting } = useAuthentication();

  const logo = setting?.data?.result
    ?.find((f) => f.option === "INVOICE_RECEIPT")
    ?.value?.split(",")[2];
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <img src={logo} alt="" className="size-8 object-cover" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {currentWarehouse?.name}
            </span>
            <span className="truncate text-xs">
              {currentWarehouse?.isMain ? "Main" : "Sub Warehouse"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
