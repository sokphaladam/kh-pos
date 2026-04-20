"use client";
import { POSTableList } from "./pos-table-list";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { POSContextProvider } from "./context/pos-context";
import { cn } from "@/lib/utils";
import { POSRightSide } from "./pos-right-side";
import { useWindowSize } from "@/components/use-window-size";
import { POSTab } from "./tab/pos-tab";
import { POSTabContextProvider } from "./context/pos-tab-context";
import { POSHeader } from "./pos-header";

export interface CartProps extends ProductSearchResult {
  qty: number;
}

export function POSContent({ id }: { id?: string }) {
  const { height } = useWindowSize();
  return (
    <POSContextProvider id={id}>
      <div className="flex-1 -m-4">
        <div className="flex-1 relative flex">
          <div className={cn("w-full md:p-4")} style={{ height: height - 100 }}>
            <POSTableList />
          </div>
          <div className="w-[550px] p-4 pl-0 hidden md:block">
            <POSRightSide />
          </div>
        </div>
      </div>
    </POSContextProvider>
  );
}

export function LayoutPos() {
  return (
    <POSTabContextProvider>
      <div className="h-screen flex flex-col">
        <POSHeader />
        <div className="flex-1">
          <POSTab />
        </div>
      </div>
    </POSTabContextProvider>
  );
}
