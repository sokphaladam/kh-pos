"use client";
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "../ui/sidebar";
import { NavSidebar } from "./nav-sidebar";
import { NavUser } from "./nav-user";
import { HeadSidebar } from "./head-sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <HeadSidebar />
      </SidebarHeader>
      <SidebarContent className={cn("!overflow-y-auto flex flex-col")}>
        <NavSidebar />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
