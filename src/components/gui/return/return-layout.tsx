import { TopToolbar } from "@/components/top-toolbar";
import React from "react";
import { ReturnList } from "./return-list";

export function ReturnLayout() {
  return (
    <div className="w-full flex flex-col gap-4 relative">
      <TopToolbar text={"Order Return"} data={null} />
      <div className="w-full">
        <ReturnList />
      </div>
    </div>
  );
}
