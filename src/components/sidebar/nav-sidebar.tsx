"use client";

import React from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../ui/sidebar";
import { useAppMenuRestaurant, useMenuItems } from "./app-menu-items";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  ChevronRight,
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  FileBarChart,
  Settings,
  Utensils,
  Clapperboard,
  BookUser,
} from "lucide-react";
import { useAuthentication } from "../../../contexts/authentication-context";
import { ItemMenuProp } from "./app-menu-root";
import { usePathname } from "next/navigation";

// Function to get section icons
function getSectionIcon(title: string) {
  const iconMap: Record<string, React.ElementType> = {
    Dashboard: LayoutDashboard,
    Inventory: Package,
    Supply: Truck,
    "Order Management": ShoppingCart,
    Report: FileBarChart,
    Setting: Settings,
    Application: Utensils,
    "Active Tables": Utensils,
    POS: LayoutDashboard, // fallback
    Cinema: Clapperboard,
    Accounting: BookUser,
  };

  return iconMap[title] || LayoutDashboard; // default fallback
}

// Helper function to check if an item is active
function isItemActive(item: ItemMenuProp, pathname: string): boolean {
  return pathname.toLowerCase() === item.url.toLowerCase();
}

export function NavSidebar() {
  const { currentWarehouse } = useAuthentication();
  const { items } = useMenuItems();
  const { state, isMobile, setOpenMobile, openMobile } = useSidebar();
  const pathname = usePathname();

  const path = pathname.split("/");

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const restaurants = path[2] === "restaurant" ? useAppMenuRestaurant() : [];

  const menus = (path[2] === "restaurant" ? restaurants : items)
    .map((m) => ({
      ...m,
      items: m.items.filter((menu) => {
        if (menu.onlyMain) {
          return currentWarehouse?.isMain;
        }
        return true;
      }),
    }))
    .filter((m) => m.items.length > 0);

  // When collapsed, show all items as individual menu items with icons
  if (state === "collapsed") {
    const allItems = menus.flatMap((menu) => menu.items);

    return (
      <SidebarGroup>
        <SidebarMenu>
          {allItems.map((item, idx) => {
            // Check if this item is currently active
            const isActive = isItemActive(item, pathname);

            // For collapsed state, show main items and first subitem if it has subitems
            if (item.subitems && item.subitems.length > 0) {
              // Show the main item
              return (
                <SidebarMenuItem key={`${item.title}-${idx}`}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={
                      isActive
                        ? "bg-blue-500 text-white shadow-none"
                        : "bg-transparent shadow-none hover:bg-gray-200"
                    }
                  >
                    <Link
                      href={item.url}
                      target={item.newTab ? "_blank" : "_self"}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(!openMobile);
                        }
                      }}
                    >
                      <item.icon size={16} />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={`${item.title}-${idx}`}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={
                    isActive
                      ? "bg-blue-500 text-white shadow-none"
                      : "bg-transparent shadow-none hover:bg-gray-200"
                  }
                >
                  <Link
                    href={item.url}
                    target={item.newTab ? "_blank" : "_self"}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(!openMobile);
                      }
                    }}
                  >
                    <item.icon size={16} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return menus.map((menu, index) => {
    // Special handling for Dashboard - make it standalone since it only has one item
    if (menu.title === "Dashboard" && menu.items.length === 1) {
      const dashboardItem = menu.items[0];
      const isActive = pathname.startsWith(dashboardItem.url);

      return (
        <SidebarGroup key={index}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={
                  isActive
                    ? "bg-blue-500 text-white shadow-none"
                    : "bg-transparent shadow-none hover:bg-gray-200"
                }
              >
                <Link
                  href={dashboardItem.url}
                  target={dashboardItem.newTab ? "_blank" : "_self"}
                  onClick={() => {
                    if (isMobile && state === "expanded") {
                      setOpenMobile(!openMobile);
                    }
                  }}
                >
                  <LayoutDashboard size={16} />
                  <span className="font-bold">{dashboardItem.title}</span>
                  <ChevronRight className="ml-auto" size={16} />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      );
    }

    // Check if any item in this section should be open
    const shouldSectionBeOpen = menu.items.some((item) => {
      if (pathname.startsWith(item.url)) return true;
      if (item.subitems) {
        return item.subitems.some((sub) => pathname.startsWith(sub.url));
      }
      return false;
    });

    return (
      <Collapsible
        asChild
        className="group/collapsible"
        key={index}
        defaultOpen={shouldSectionBeOpen}
      >
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="cursor-pointer hover:bg-gray-200 bg-transparent shadow-none rounded-md px-2 py-1 flex items-center gap-2">
              {React.createElement(getSectionIcon(menu.title), { size: 16 })}
              {menu.title}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <SidebarMenu>
              {menu.items.map((item, idx) => {
                // Check if this item is currently active
                const isActive = isItemActive(item, pathname);

                if (item.subitems && item.subitems.length > 0) {
                  return (
                    <Collapsible
                      asChild
                      className="group/collapsible"
                      key={idx}
                      defaultOpen={isActive}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={
                              isActive
                                ? "bg-blue-500 text-white"
                                : "bg-transparent shadow-none hover:bg-blue-200"
                            }
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subitems.map((subItem) => {
                              let main = true;

                              if (subItem.onlyMain) {
                                main = currentWarehouse?.isMain || false;
                              }

                              const isSubActive =
                                pathname.toLowerCase() ===
                                subItem.url.toLowerCase();

                              return (
                                <SidebarMenuSubItem
                                  key={subItem.title}
                                  className={
                                    main ? "visible ml-6" : "hidden ml-6"
                                  }
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    className={
                                      isSubActive
                                        ? "bg-blue-500 text-white"
                                        : "bg-transparent shadow-none hover:bg-blue-200"
                                    }
                                  >
                                    <Link
                                      href={subItem.url}
                                      target={
                                        subItem.newTab ? "_blank" : "_self"
                                      }
                                      onClick={() => {
                                        if (isMobile && state === "expanded") {
                                          setOpenMobile(!openMobile);
                                        }
                                      }}
                                    >
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={idx} className="ml-4">
                    <SidebarMenuButton
                      asChild
                      className={
                        isActive
                          ? "bg-blue-500 text-white shadow-none"
                          : "bg-transparent shadow-none hover:bg-gray-200"
                      }
                    >
                      <Link
                        href={item.url}
                        target={item.newTab ? "_blank" : "_self"}
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(!openMobile);
                          }
                        }}
                      >
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  });
}
