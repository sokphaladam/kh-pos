import { TopToolbar } from "@/components/top-toolbar";
import { createPurchaseOrderSheet } from "./create-purchase-order-sheet";
import { useQueryPurchaseOrderList } from "@/app/hooks/use-query-purchase-order";
import PurchaseOrderList from "./purchase-order-list";
import { useCallback, useMemo } from "react";
import {
  PurchaseOrderStatus,
  SupplierPurchaseOrder,
} from "@/classes/purchase-order-service";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { useSearchParams } from "next/navigation";
import SkeletonTableList from "@/components/skeleton-table-list";
import { useRouter } from "next/navigation";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

const LIMIT = 30;
export default function PurchaseOrderLayout(props: WithLayoutPermissionProps) {
  const { currentWarehouse } = useAuthentication();

  const router = useRouter();
  const searchParams = useSearchParams();

  const offset = Number(searchParams.get("offset") || 0);
  const rawStatus = searchParams.get("status");
  const status =
    rawStatus === "all" || rawStatus === null
      ? undefined
      : (rawStatus as PurchaseOrderStatus);

  const { data, mutate, isValidating, isLoading } = useQueryPurchaseOrderList({
    warehouseId: currentWarehouse?.id,
    limit: LIMIT,
    offset,
    ...(status && { status }),
  });

  const purchaseOrderList = useMemo(() => {
    if (!data?.result) return [];
    return data.result;
  }, [data]);

  const onClickAdd = useCallback(async () => {
    const result = await createPurchaseOrderSheet.show({});

    if (result) {
      const newPurchaseOrderList = data?.result ?? [];
      newPurchaseOrderList.push(result);
      mutate({ result: newPurchaseOrderList });
    }
  }, [mutate, data]);

  const onSuccess = useCallback(
    (item: SupplierPurchaseOrder | undefined) => {
      if (!item) return;
      const updatedList = purchaseOrderList;

      const index = updatedList.findIndex((item) => item.id === item.id);

      if (index > -1) {
        updatedList[index] = {
          ...updatedList[index],
          ...item,
        };
      }
      mutate({ result: updatedList });
    },
    [purchaseOrderList, mutate]
  );

  const onChangeFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }

      // Reset to first page when changing filter
      params.set("offset", "0");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );
  const Filter = useMemo(
    () => [
      {
        title: "All",
        value: "all",
      },
      {
        title: "Draft",
        value: "draft",
      },
      {
        title: "Approved",
        value: "approved",
      },

      {
        title: "Completed",
        value: "completed",
      },
      {
        title: "Closed",
        value: "closed",
      },
    ],
    []
  );
  return (
    <div className="w-full flex flex-col relative">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onClickAdd}
        text="Purchase Order"
        filter={Filter}
        activeFilterTab={status ?? "all"}
        onChangeFilter={onChangeFilter}
      />
      <div className="flex-1">
        {isLoading ? (
          <SkeletonTableList />
        ) : (
          <PurchaseOrderList
            loading={isLoading || isValidating}
            offset={offset}
            limit={LIMIT}
            data={purchaseOrderList}
            onSuccess={onSuccess}
            mutate={mutate}
          />
        )}
      </div>
    </div>
  );
}
