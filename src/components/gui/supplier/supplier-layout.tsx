"use client";
import { useQuerySupplierList } from "@/app/hooks/use-query-supplier";
import { createSupplierSheet } from "@/components/gui/supplier/create-supplier-sheet";
import SupplierList from "@/components/gui/supplier/supplier-list";
import { useCallback } from "react";
import { Supplier as ISupplier } from "@/lib/server-functions/supplier";
import { toast } from "sonner";
import { TopToolbar } from "@/components/top-toolbar";
import { useSearchParams } from "next/navigation";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

const LIMIT = 30;
export default function SupplierLayout(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const searchQuery = search.get("s") || "";
  const { supplier, total, mutate } = useQuerySupplierList(
    LIMIT,
    offset,
    searchQuery
  );

  const onCreateNewSupplier = useCallback(async () => {
    await createSupplierSheet.show({}).then((r) => {
      if (!r) return;
      // Refresh the data by calling mutate without parameters
      mutate();
    });
  }, [mutate]);

  const onSuccess = useCallback(
    (data: ISupplier | null, id?: string) => {
      if (id) {
        toast.success("Removed supplier");
      }
      // Refresh the data
      mutate();
    },
    [mutate]
  );

  return (
    <div className="w-full">
      <TopToolbar
        disabled={!props.allowCreate}
        searchEnabled
        onAddNew={onCreateNewSupplier}
        text="Supplier"
      />
      <SupplierList
        onSuccess={onSuccess}
        totalSupplier={total}
        offset={offset}
        limit={LIMIT}
        data={supplier ?? []}
      />
    </div>
  );
}
