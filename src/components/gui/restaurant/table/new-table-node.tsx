import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import React, { useCallback } from "react";
import { sheetCreateTable } from "./sheet-create-table";

interface Props {
  onCompleted?: () => void;
}

export function NewTableNode(props: Props) {
  const onClickNewTable = useCallback(async () => {
    const res = await sheetCreateTable.show({});
    if (res) {
      props.onCompleted?.();
    }
  }, [props]);

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-md hover:shadow-lg transition-all w-full rounded-xl border min-w-[122px] max-w-[200px] lg:max-w-[250px] border-dotted hover:border-dashed duration-300",
        "hover:bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-400 hover:text-gray-500 border border-gray-100",
        "flex flex-row justify-center cursor-pointer h-[108px]"
      )}
      onClick={onClickNewTable}
    >
      <div className="flex flex-row justify-center items-center text-center p-4">
        <div className="flex flex-col gap-4 justify-between">
          <div className="font-bold text-lg">
            <Plus />
          </div>
        </div>
      </div>
    </Card>
  );
}
