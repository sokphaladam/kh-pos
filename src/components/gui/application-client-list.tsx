"use client";

import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import { useAuthentication } from "../../../contexts/authentication-context";

export function ApplicationClientList() {
  const { user } = useAuthentication();
  const { isLoading: isLoadingIMS } = useWarehouseList(1, 0, [
    user?.currentWarehouseId + "",
  ]);

  if (isLoadingIMS) {
    return <></>;
  }

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {/* {list.map((item, idx) => {
        return (
          <Link key={idx} href={`/admin/a/ims/${item.id}`}>
            <div className="border p-4 shadow-sm rounded-md text-xs bg-secondary flex flex-row items-center gap-2">
              {item.type === "IMS" && (
                <Warehouse
                  className={cn(
                    "h-4 w-4",
                    `${item.isMain ? "text-amber-500" : ""}`
                  )}
                />
              )}
              {item.name}
            </div>
          </Link>
        );
      })} */}
    </div>
  );
}
