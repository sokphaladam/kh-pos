"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  ExternalLink,
  Grid3X3,
  LogOut,
  RefreshCcw,
  ShoppingCart,
  Store,
} from "lucide-react";
import moment from "moment-timezone";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { ShiftDireactPrint } from "../shift/print/direct-print";
import { shiftDialog } from "../shift/shift-dialog";
import { useRestaurant } from "./contexts/restaurant-context";
import { cn } from "@/lib/utils";

export function RestaurantHeader() {
  const { currentShift, mutate, user, logout } = useAuthentication();
  const { state, onRefetch, isRequest, loading } = useRestaurant();
  const [printShift, setPrintShift] = useState<string | null>(null);
  const route = useRouter();
  const params = useSearchParams();

  const onOpenShift = useCallback(async () => {
    const res = await shiftDialog.show({ status: "OPEN" });
    if (typeof res === "string") {
      mutate();
    }
  }, [mutate]);

  const onCloseShift = useCallback(async () => {
    const id = currentShift?.shift_id;
    if (id) {
      const res = await shiftDialog.show({
        status: "CLOSE",
        id: id || undefined,
      });
      if (res === "CLOSE") {
        mutate();
        setPrintShift(id);
      }
    }
  }, [currentShift, mutate]);

  const handleOrderList = () => {
    route.push("/admin/order");
  };

  const handleViewAllTables = () => {
    route.push("/admin/restaurant");
    onRefetch?.(); // Force refetch of table data
  };

  // const handleSecondWindow = () => {
  //   openSecondWindow?.();
  // };

  const currentTable = state.activeTables.find(
    (t) => t.tables?.id === params.get("table") || "",
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900">
                Point of Sale
              </h1>
              <p className="text-xs text-slate-500">
                L-POS - Restaurant Management ({currentTable?.orders?.invoiceNo}
                )
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefetch?.()}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <RefreshCcw
                  className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4",
                    isRequest || loading ? "animate-spin" : "",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh</p>
            </TooltipContent>
          </Tooltip>
          {/* Table Selection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-auto px-4 text-xs sm:text-sm border-none py-0 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {currentTable?.tables?.id ? (
                  // Show icon with table name when specific table is selected
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">
                      Table {currentTable.tables.table_name}
                    </span>
                    <span className="sm:hidden">
                      {currentTable.tables.table_name}
                    </span>
                  </div>
                ) : (
                  // Show only icon when "View All Tables" is selected
                  <div className="">
                    <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline"></span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 overflow-y-auto h-64"
            >
              <DropdownMenuItem
                onClick={() => handleViewAllTables()}
                className={
                  !currentTable?.tables?.id ? "bg-blue-50 text-blue-700" : ""
                }
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                View All Tables
              </DropdownMenuItem>
              {state.activeTables?.map((x) => (
                <DropdownMenuItem
                  key={x.tables?.id}
                  onClick={() =>
                    route.push(`/admin/restaurant?table=${x.tables?.id}`)
                  }
                  className={
                    currentTable?.tables?.id === x.tables?.id
                      ? "bg-blue-50 text-blue-700"
                      : ""
                  }
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Table {x.tables?.table_name || ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOrderList}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Orders</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {}}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-green-50 hover:text-green-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open second window</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 sm:h-6 w-px bg-slate-300 mx-0.5 sm:mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={currentShift ? onCloseShift : onOpenShift}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 relative hover:bg-slate-50 transition-colors"
              >
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <div
                  className={`absolute top-0 right-0 h-2 w-2 rounded-full border border-white ${
                    currentShift ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">
                  {currentShift ? "Shift Active" : "No Active Shift"}
                </p>
                {currentShift && (
                  <p className="text-xs text-muted-foreground">
                    Started{" "}
                    {moment(new Date(currentShift.opened_at + "")).fromNow()}
                  </p>
                )}
                <p className="text-xs mt-1">
                  Click to {currentShift ? "end" : "start"} shift
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-9 px-2 sm:px-3 gap-2 hover:bg-slate-50 transition-colors"
              >
                <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                  {user?.profile && (
                    <AvatarImage src={user.profile} alt={user.fullname} />
                  )}
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {user?.fullname
                      ?.split(" ")
                      .map((n) => n.charAt(0).toUpperCase())
                      .join("")
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {user?.fullname || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.fullname}
                  </p>
                  {user?.role?.role && (
                    <p className="text-xs leading-none text-blue-600 mt-1">
                      {user.role.role}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {printShift && (
        <ShiftDireactPrint
          shiftId={printShift}
          onPrintComplete={() => setPrintShift(null)}
        />
      )}
    </>
  );
}
