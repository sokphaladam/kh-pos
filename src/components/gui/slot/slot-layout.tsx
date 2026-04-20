"use client";

import { TopToolbar } from "@/components/top-toolbar";
import React, { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuerySlotList } from "@/app/hooks/use-query-slot";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { SlotList } from "./slot-list";
import { createSlotSheet } from "./sheet-slot-create";
import SkeletonTableList from "@/components/skeleton-table-list";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

export function SlotLayout(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const { currentWarehouse } = useAuthentication();
  const offset = Number(search.get("offset") || 0);
  const limit = Number(search.get("limit") || 30);
  const keyword = search.get("search_name") || "";

  const { data, isLoading, mutate, isValidating } = useQuerySlotList({
    limit,
    offset,
    warehouseId: currentWarehouse?.id || "",
    keyword,
  });

  const onAddNew = useCallback(async () => {
    const res = await createSlotSheet.show({
      edit: undefined,
    });

    if (res) {
      mutate();
    }
  }, [mutate]);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onAddNew}
        text={"Slot"}
      />
      <div>
        {(isValidating || isLoading) && <SkeletonTableList />}
        {!isValidating && !isLoading && data?.result.data && (
          <SlotList
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
