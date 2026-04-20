"use client";
import { useUserList } from "@/app/hooks/use-query-user";
import { LayoutPermission } from "@/components/gui/layout-permission";
import { createUserSheet } from "@/components/gui/user/sheet-user-create";
import { UserList } from "@/components/gui/user/user-list";
import SkeletonTableList from "@/components/skeleton-table-list";
import { TopToolbar } from "@/components/top-toolbar";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsersLayout(props: WithLayoutPermissionProps) {
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const { data, isLoading, mutate, isValidating } = useUserList(10, offset);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      mutate()
        .then()
        .finally(() => setLoading(false));
    }
  }, [loading, mutate]);

  if (isLoading || isValidating) {
    return <SkeletonTableList />;
  }

  return (
    <LayoutPermission permission={["ROOT"]}>
      <div className="w-full">
        <TopToolbar
          disabled={!props.allowCreate}
          onAddNew={async () => {
            const result = await createUserSheet.show({
              edit: undefined,
            });
            if (result) {
              setLoading(true);
            }
          }}
          text={"User"}
          data={(data?.result?.data as UserInfo[]).map((x: UserInfo) => ({
            ...x,
          }))}
        />
        <UserList
          data={data?.result?.data as UserInfo[]}
          onEdit={() => mutate()}
          onDelete={() => mutate()}
          limit={10}
          offset={offset}
          total={data?.result?.total || 0}
        />
      </div>
    </LayoutPermission>
  );
}
