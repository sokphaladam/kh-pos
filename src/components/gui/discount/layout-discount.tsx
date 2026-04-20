"use client";

import { TopToolbar } from "@/components/top-toolbar";
import { sheetDiscount } from "./sheet-discount";
import { useQueryDiscount } from "@/app/hooks/use-query-discount";
import { useSearchParams } from "next/navigation";
import { ListDiscount } from "./list-discount";
import { useCallback } from "react";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

export function LayoutDiscount(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const limit = Number(search.get("limit") || 30);
  const { data, isLoading, mutate } = useQueryDiscount(limit, offset);

  const onClickAdd = useCallback(async () => {
    // Handle add new discount logic here
    const res = await sheetDiscount.show({});
    if (res) {
      mutate();
    }
  }, [mutate]);

  if (isLoading) return <div></div>;

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onClickAdd}
        text={"Discount"}
        data={[]}
      />
      <div>
        {data?.result?.data && (
          <ListDiscount
            total={data.result.total || 0}
            data={data.result.data || []}
            limit={limit}
            offset={offset}
            onDelete={(v) => v && mutate()}
            onEdit={(v) => v && mutate()}
            onApplied={() => mutate()}
          />
        )}
      </div>
    </div>
  );
}
