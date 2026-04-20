import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BellRing, CircleCheckBig, HandPlatter, Salad } from "lucide-react";
import { JSX } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TableNode({ data }: any) {
  let cardGradient =
    "bg-gradient-to-br from-white to-gray-100 text-gray-900 border border-gray-200";
  let icon: JSX.Element | undefined = (
    <CircleCheckBig className="h-4 w-4 text-emerald-500" />
  );
  if (data.status === "Attend table") {
    cardGradient =
      "bg-gradient-to-br from-rose-100 via-rose-50 to-white text-rose-700 border border-rose-100";
    icon = <BellRing className="h-4 w-4 text-rose-500" />;
  }
  if (data.status === "Approved order") {
    cardGradient =
      "bg-gradient-to-br from-amber-100 via-amber-50 to-white text-amber-700 border border-amber-100";
    icon = <HandPlatter className="h-4 w-4 text-amber-500" />;
  }
  if (data.status === "Food delivered") {
    cardGradient =
      "bg-gradient-to-br from-green-100 via-green-50 to-white text-green-700 border border-green-100";
    icon = <Salad className="h-4 w-4 text-green-500" />;
  }
  if (data.status === "Check payment") {
    cardGradient =
      "bg-gradient-to-br from-emerald-100 via-emerald-50 to-white text-emerald-700 border border-emerald-100";
    icon = <CircleCheckBig className="h-4 w-4 text-emerald-500" />;
  }
  if (data.status === "Available table") {
    cardGradient =
      "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-400 border border-gray-100";
    icon = undefined;
  }
  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-md transition-shadow w-full rounded-xl border min-w-[200px]",
        cardGradient
      )}
      style={{
        boxShadow:
          data.status === "Available table"
            ? "0 2px 8px 0 rgba(0,0,0,0.03)"
            : "0 4px 12px 0 rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex flex-row justify-between p-4">
        <div className="flex flex-col gap-4 justify-between">
          <div className="font-bold text-lg">Table {data.table}</div>
          <div className="font-light text-xs text-wrap md:text-nowrap opacity-80">
            {data.items === 0 ? "No Order" : `Ordered ${data.items} items`}
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-4 justify-between">
          {data.status !== "Available table" ? (
            <div className="invisible md:visible bg-white/70 text-gray-500 text-xs font-light px-2 py-1 rounded-lg text-nowrap shadow-sm border border-gray-200">
              {data.elapsed}
            </div>
          ) : (
            <div></div>
          )}
          <div>{icon}</div>
        </div>
      </div>
    </Card>
  );
}
