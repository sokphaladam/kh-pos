"use client";

import { CartProvider } from "./context/cart-provider";
import { OrderHeader } from "./order-header";
import { ProductList } from "./product-list";
// import { CartSheet } from "./cart-sheet";
import { useQueryPOSInfo } from "@/app/hooks/use-query-order";
import { useQueryTableById } from "@/app/hooks/use-query-table";
import { SheetProvider } from "@/components/create-sheet";
import { WarehouseResponseType } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { RestaurantaAction } from "../../restaurant/class/restaurant";
import { ProductMenuFallback } from "./product-menu-fallback";

interface ProductMenuLayoutProps {
  inZone?: boolean;
  warehouse?: WarehouseResponseType;
}

export function ProductMenuLayout(props: ProductMenuLayoutProps) {
  const searchParams = useSearchParams();
  const { data: tableData, isLoading: isLoadingTable, isValidating } = useQueryTableById(
    searchParams.get("table") || ""
  );
  const { data: posData, isLoading: isLoadingPOS } = useQueryPOSInfo(
    searchParams.get("warehouse") || ""
  );

  if (isLoadingPOS || isLoadingTable) {
    return <ProductMenuFallback />;
  }

  const table = tableData?.result;

  const orders = RestaurantaAction.calculateOrderTotal({
    ...table?.order,
    orderId: table?.order?.orderId ?? "",
    invoiceNo: Number(table?.order?.invoiceNo ?? 0),
    customerId: table?.order?.customerId ?? "",
    orderStatus: table?.order?.orderStatus ?? "DRAFT",
    createdAt: table?.order?.createdAt ?? null,
    createdBy: table?.order?.createdBy ?? null,
    totalAmount: String(table?.order?.totalAmount ?? 0),
    items: (table?.order?.items || []).map((item) => {
      return {
        ...item,
        status: ["pending", "cooking", "served"].map((statusType, i) => {
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
            };
          }
        }),
        orderModifiers: item.orderModifiers?.filter(
          (f) => f.modifierItemId !== "notes"
        ),
        notes: item.orderModifiers?.find((f) => f.modifierItemId === "notes"),
        discounts: item.discounts?.filter((d) => d.id !== ""),
      };
    }),
    payments: [],
    printCount: table?.order?.printCount || 1,
    customer: Number(table?.order?.customer) || 1,
  });

  return (
    <>
      <CartProvider
        initialState={{
          posInfo: posData?.result,
          tables: tableData?.result,
          orders: orders,
          currentWarehouse: props.warehouse,
        }}
        processing={isValidating || isLoadingTable}
      >
        <SheetProvider slot="default" />
        <div className="min-h-screen bg-gray-50">
          <OrderHeader inZone={props.inZone} />
          <ProductList />
        </div>
      </CartProvider>
    </>
  );
}
