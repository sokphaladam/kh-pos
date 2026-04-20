import { useQueryModifier } from "@/app/hooks/use-query-modifier";
import { TopToolbar } from "@/components/top-toolbar";
import { useSearchParams } from "next/navigation";
import { ModifierList } from "./modifier-list";
import { modifierForm } from "./sheet-modifier-form";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

export function ModifierLayout(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const { data, isLoading, mutate, isValidating } = useQueryModifier({
    limit: 30,
    offset,
  });

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={
          isValidating || isLoading
            ? undefined
            : async () => {
                // createCategorySheet.show({}).then((r) => onSuccess(r));
                const res = await modifierForm.show({});
                if (!!res) {
                  mutate();
                }
              }
        }
        text="Modifier"
      />
      <ModifierList
        data={(data?.result?.data || []).map((x) => {
          return {
            ...x,
            id: x.modifierId,
          };
        })}
        offset={offset}
        total={isLoading ? 0 : data?.result?.total || 0}
        onSuccess={mutate}
      />
    </div>
  );
}
