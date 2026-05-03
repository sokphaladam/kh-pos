"use client";
import { useQueryCategory } from "@/app/hooks/use-query-category";
import { useQueryPOSInfo } from "@/app/hooks/use-query-order";
import { useQueryTable } from "@/app/hooks/use-query-table";
import { CommonDialogProvider } from "@/components/common-dialog";
import { DialogProvider } from "@/components/create-dialog";
import { SheetProvider } from "@/components/create-sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DirectPrint } from "../pos/print/direct-print";
import { RestaurantaAction } from "./class/restaurant";
import {
  RestaurantProvider,
  useRestaurant,
} from "./contexts/restaurant-context";
import { RestaurantHeader } from "./restaurant-header";
import { RestaurantMenu } from "./restaurant-menu";
import TableFlowLayout from "./table-flow/table-flow-layout";

export function RestaurantContent(
  props: WithLayoutPermissionProps & {
    autoRefresh: boolean;
    setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  },
) {
  const { state, printingOrder, setPrintingOrder } = useRestaurant();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setting } = useAuthentication();

  useEffect(() => {
    const find = state.activeTables.find(
      (f) => f.tables?.id === params.get("table"),
    );
    if (!find) {
      const param = new URLSearchParams(params.toString());
      param.delete("table");
      router.push(`${pathname}?${param.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const template =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[0]
      : "default";

  const printAction = useMemo(() => {
    if (printingOrder) {
      return (
        <DirectPrint
          orderId={printingOrder.split("@").at(0) || ""}
          onPrintComplete={() => {
            setPrintingOrder(null);
            if (printingOrder.split("@").at(1) !== "stay") {
              const param = new URLSearchParams(params.toString());
              param.delete("table");
              router.push(`${pathname}?${param.toString()}`);
            }
          }}
          type={template as unknown as "default" | "template-i" | "template-ch"}
        />
      );
    }

    return <></>;
  }, [params, pathname, printingOrder, router, setPrintingOrder, template]);

  return (
    <>
      <div className={cn("relative w-full h-screen")}>
        {params.get("table") ? (
          <RestaurantMenu {...props} />
        ) : (
          <TableFlowLayout
            {...props}
            autoRefresh={props.autoRefresh}
            setAutoRefresh={props.setAutoRefresh}
          />
        )}
      </div>
      {printAction}
    </>
  );
}

export function RestaurantLayout(props: WithLayoutPermissionProps) {
  const { currentWarehouse } = useAuthentication();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryTable = useQueryTable(autoRefresh);
  const queryCategory = useQueryCategory(100, 0);
  const queryPOSInfo = useQueryPOSInfo(currentWarehouse?.id || "");

  if (
    queryTable.isLoading ||
    queryCategory.isLoading ||
    queryPOSInfo.isLoading
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  const tables = queryTable.data?.result || [];
  const categories = queryCategory.categories?.data || [];
  const posInfo = queryPOSInfo.data?.result;
  const activeTables = tables?.filter(
    (f) => !!f.order || f.status === "order_taken",
  );

  const data = {
    tables: tables || [],
    categories: categories || [],
    posInfo: posInfo || {
      posCustomerId: "",
      posSlotId: "",
    },
    currentWarehouse: currentWarehouse || undefined,
    activeTables:
      activeTables && activeTables.length > 0
        ? activeTables.map((x) => {
            const orders = RestaurantaAction.calculateOrderTotal({
              ...x.order,
              customerLoader: x.order?.customerLoader,
              customer: x.order?.customer,
              orderId: x.order?.orderId ?? "",
              invoiceNo: Number(x.order?.invoiceNo ?? 0),
              customerId: x.order?.customerId ?? "",
              orderStatus: x.order?.orderStatus ?? "DRAFT",
              createdAt: x.order?.createdAt ?? null,
              createdBy: x.order?.createdBy ?? null,
              totalAmount: String(x.order?.totalAmount ?? 0),
              items: (x.order?.items || []).map((item) => {
                return {
                  ...item,
                  status: ["pending", "cooking", "served"].map(
                    (statusType, i) => {
                      if (item.status?.[i]) {
                        return item.status[i];
                      } else {
                        return {
                          qty: 0,
                          orderItemId: item.orderDetailId,
                          status: statusType as
                            | "pending"
                            | "cooking"
                            | "served"
                            | "ready"
                            | "cancelled",
                          createdAt: item.status?.[i]?.createdAt || null,
                          createdBy: item.status?.[i]?.createdBy || null,
                        };
                      }
                    },
                  ),
                  orderModifiers: item.orderModifiers?.filter(
                    (f) => f.modifierItemId !== "notes",
                  ),
                  notes: item.orderModifiers?.find(
                    (f) => f.modifierItemId === "notes",
                  ),
                  discounts: item.discounts?.filter((d) => d.id !== ""),
                };
              }),
              payments: [],
              printCount: x.order?.printCount || 0,
            });
            return {
              tables: x,
              orders,
            };
          })
        : [],
  };
  return (
    <TooltipProvider>
      <RestaurantProvider
        processing={queryTable.isValidating || queryTable.isLoading}
        initialState={data}
        onRefetch={queryTable.mutate}
      >
        <CommonDialogProvider>
          <SheetProvider slot="default" />
          <DialogProvider slot="default" />
        </CommonDialogProvider>
        <div className="overflow-hidden">
          <RestaurantHeader />
          <div className="flex flex-1 relative p-4 bg-muted/40">
            <RestaurantContent
              {...props}
              autoRefresh={autoRefresh}
              setAutoRefresh={setAutoRefresh}
            />
          </div>
        </div>
      </RestaurantProvider>
    </TooltipProvider>
  );
}
