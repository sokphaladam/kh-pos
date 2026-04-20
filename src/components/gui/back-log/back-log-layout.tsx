import { useQueryBacklog } from "@/app/hooks/use-query-back-log";
import { TopToolbar } from "@/components/top-toolbar";
import { useSearchParams } from "next/navigation";
import { BackLogList } from "./back-log-list";
import SkeletonTableList from "@/components/skeleton-table-list";

export function BackLogLayout() {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const { data, isLoading, isValidating, mutate } = useQueryBacklog(offset, 30);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar text={"Back Log"} data={[]} />
      <div>
        {(isValidating || isLoading) && <SkeletonTableList />}
        {!isValidating && !isLoading && (
          <BackLogList
            data={data?.result?.data || []}
            offset={offset}
            total={data?.result?.total || 0}
            onCompleted={mutate}
          />
        )}
      </div>
    </div>
  );
}
