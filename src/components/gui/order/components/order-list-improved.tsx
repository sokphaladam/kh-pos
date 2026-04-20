import { Order } from "@/classes/order";
import { Pagination } from "@/components/pagination";
import SkeletonTableList from "@/components/skeleton-table-list";
import { Card, CardFooter } from "@/components/ui/card";
import { ResponseType } from "@/lib/types";
import { useAuthentication } from "contexts/authentication-context";
import { useState } from "react";
import { DirectPrint } from "../../pos/print/direct-print";
import { sheetOrderDetail } from "../sheet-order-detail";
import { undoOrderDialog } from "../undo-order-dialog";
import { OrderTable } from "./order-table";

interface OrderListProps {
  data:
    | ResponseType<{
        totalRows: number;
        orders: Order[];
      }>
    | undefined;
  loading: boolean;
  limit: number;
  offset: number;
  onRefresh: () => void;
}

export function OrderList({
  data,
  loading,
  limit,
  offset,
  onRefresh,
}: OrderListProps) {
  const { setting } = useAuthentication();
  const [printingOrder, setPrintingOrder] = useState<string | null>(null);

  const POS = JSON.parse(
    setting?.data?.result?.find((f) => f.option === "TYPE_POS")?.value || "{}",
  ) || { system_type: "MART" };

  const handlePrintReceipt = (orderId: string) => {
    onRefresh();
    setPrintingOrder(orderId);
  };

  const handleViewDetail = async (orderId: string) => {
    await sheetOrderDetail.show({ order: orderId });
  };

  const handleOpenMart = (orderId: string) => {
    window.open(
      ["MART", "CINEMA"].includes(POS.system_type)
        ? `/admin/a/pos?id=${orderId}`
        : `/admin/restaurant?table=${orderId}`,
      "_blank",
    );
  };

  const handleReverseToDraft = async (
    orderId: string,
    invoiceNo: number,
  ): Promise<boolean> => {
    const result = await undoOrderDialog.show({
      orderId,
      invoiceNo,
    });

    if (result) {
      onRefresh();
      return true;
    }

    return false;
  };

  const orders = data?.result?.orders || [];
  const totalRows = data?.result?.totalRows || 0;
  const totalCount =
    typeof totalRows === "number"
      ? totalRows
      : Array.isArray(totalRows) && totalRows[0] && "total" in totalRows[0]
        ? (totalRows[0] as { total: number }).total
        : 0;

  const template =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[0]
      : "default";

  if (loading) {
    return <SkeletonTableList />;
  }

  return (
    <div className="space-y-4">
      <OrderTable
        orders={orders}
        onPrintReceipt={handlePrintReceipt}
        onViewDetail={handleViewDetail}
        onOpenMart={handleOpenMart}
        onReverseToDraft={handleReverseToDraft}
      />

      {/* Pagination */}
      {orders.length > 0 && (
        <Card>
          <CardFooter className="pt-6">
            <Pagination
              limit={limit}
              offset={offset}
              total={totalCount}
              totalPerPage={orders.length}
              text="orders"
            />
          </CardFooter>
        </Card>
      )}

      {/* Hidden Print Component */}
      {printingOrder && (
        <DirectPrint
          orderId={printingOrder}
          onPrintComplete={() => setPrintingOrder(null)}
          type={template as unknown as "default" | "template-i" | "template-ch"}
        />
      )}
    </div>
  );
}
