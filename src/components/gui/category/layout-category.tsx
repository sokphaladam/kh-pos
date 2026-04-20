import { useQueryCategory } from "@/app/hooks/use-query-category";
import { TopToolbar } from "@/components/top-toolbar";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { Category } from "@/lib/server-functions/category/create-category";
import { useAuthentication } from "contexts/authentication-context";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import CategoryList from "./category-list";
import { createCategorySheet } from "./sheet-categtory-create";

const LIMIT = 30;
export default function LayoutCategory(props: WithLayoutPermissionProps) {
  const { currentWarehouse } = useAuthentication();
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const searchQuery = search.get("s") || "";
  const { categories, mutate } = useQueryCategory(LIMIT, offset, searchQuery);

  const onSuccess = useCallback(
    (data: Category | null, id?: string) => {
      const udpatedCat = categories?.data ?? [];
      if (id) {
        const deleteIndex = udpatedCat.findIndex((item) => item.id === id);
        udpatedCat.splice(deleteIndex, 1);
      } else {
        const index = udpatedCat.findIndex((item) => item.id === data?.id);

        if (index > -1) {
          udpatedCat[index] = {
            ...udpatedCat[index],
            ...data,
          };
        }
      }
      mutate();
    },
    [mutate, categories]
  );

  return (
    <div className="w-full">
      <TopToolbar
        disabled={!props.allowCreate}
        searchEnabled
        onAddNew={
          currentWarehouse?.isMain
            ? async () => {
                if (props.allowCreate) {
                  createCategorySheet.show({}).then((r) => onSuccess(r));
                }
              }
            : undefined
        }
        text="Category"
      />
      <CategoryList
        onSuccess={onSuccess}
        data={categories?.data || []}
        offset={offset}
        total={categories?.total || 0}
        {...props}
      />
    </div>
  );
}
