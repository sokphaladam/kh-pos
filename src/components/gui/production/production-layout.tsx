import { TopToolbar } from "@/components/top-toolbar";
import React, { useCallback, useEffect, useState } from "react";
import { SheetProduction } from "./sheet-production";
import { useSearchParams } from "next/navigation";
import { RecentTrasaction } from "../dashboard/recent-transaction";
import { Card, CardContent } from "@/components/ui/card";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

export function ProductionLayout(props: WithLayoutPermissionProps) {
  const searchParams = useSearchParams();
  const offset = Number(searchParams.get("offset") || 0);
  const limit = Number(searchParams.get("limit") || 30);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    if (!!reload) {
      setTimeout(() => {
        setReload(false);
      }, 500);
    }
  }, [reload]);

  const onAddNew = useCallback(async () => {
    const res = await SheetProduction.show({});

    if (!!res) {
      setReload(true);
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onAddNew}
        text={"Production"}
        data={[]}
      />
      <div>
        <Card>
          <CardContent>
            <br />
            {!reload && (
              <RecentTrasaction
                offset={offset}
                limit={limit}
                title="Production"
                status={["COMPOSE_IN"]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
