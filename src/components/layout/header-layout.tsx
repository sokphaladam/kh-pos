"use client";
import React, { useCallback, useState } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { CommonBreadcrumb } from "../common-breadcrumb";
import { usePathname } from "next/navigation";
import { useAuthentication } from "../../../contexts/authentication-context";
import { shiftDialog } from "../gui/shift/shift-dialog";
import { cn } from "@/lib/utils";
import { ShiftDireactPrint } from "../gui/shift/print/direct-print";
import { ShiftStatus } from "../shift-status";

export function HeaderLayout() {
  const { currentShift, mutate } = useAuthentication();
  const pathname = usePathname();
  const path = pathname.split("/");
  const [printShift, setPrintShift] = useState<string | null>(null);

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

  const allowPath = ["pos"];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 sticky top-0 bg-white z-[49]">
      <div className="flex gap-2 justify-between w-full px-4">
        <div className="flex items-center gap-2">
          {!allowPath.includes(path[path.length - 1]) && (
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </>
          )}
          <CommonBreadcrumb />
        </div>
        <div
          className={cn(
            "flex gap-4",
            ![...allowPath, "restaurant"].includes(path[path.length - 1])
              ? "invisible"
              : "visible"
          )}
        >
          <ShiftStatus onClose={onCloseShift} onOpen={onOpenShift} />
        </div>
      </div>
      {printShift && (
        <ShiftDireactPrint
          shiftId={printShift}
          onPrintComplete={() => setPrintShift(null)}
        />
      )}
    </header>
  );
}
