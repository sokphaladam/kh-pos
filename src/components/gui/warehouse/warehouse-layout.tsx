"use client";
import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import { TopToolbar } from "@/components/top-toolbar";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { WarehouseList } from "./warehouse-list";

import SkeletonTableList from "@/components/skeleton-table-list";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { createWarehouseSheetV2 } from "./sheet-warehouse-create-v2";

export function WarehouseLayout(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const limit = Number(search.get("limit") || 30);
  const { data, isLoading, mutate, isValidating } = useWarehouseList(
    Math.max(limit, 100),
    offset
  );

  const onAddNew = useCallback(async () => {
    const res = await createWarehouseSheetV2.show({
      edit: undefined,
    });
    if (res !== null) {
      mutate();
    }
  }, [mutate]);

  if (isLoading || isValidating) return <SkeletonTableList />;

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onAddNew}
        text={"Warehouse"}
      />
      <div>
        {data?.result?.data && (
          <WarehouseList
            total={data.result?.total || 0}
            data={data?.result?.data || []}
            limit={limit}
            offset={offset}
            onDelete={(v) => v && mutate()}
            onEdit={(v) => v && mutate()}
          />
        )}
      </div>
    </div>
  );
}
