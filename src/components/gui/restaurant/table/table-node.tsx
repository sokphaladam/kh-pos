import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BellRing, CircleCheckBig, HandPlatter, Salad } from "lucide-react";
import { JSX } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TableNode({ data }: any) {
  let cardGradient =
    "text-foreground border border-border";
  let icon: JSX.Element | undefined = (
    <CircleCheckBig className="h-4 w-4 text-success" />
  );
  if (data.status === "Attend table") {
    cardGradient =
      "text-destructive border border-destructive/20";
    icon = <BellRing className="h-4 w-4 text-destructive" />;
  }
  if (data.status === "Approved order") {
    cardGradient =
      "text-warning border border-warning/20";
    icon = <HandPlatter className="h-4 w-4 text-warning" />;
  }
  if (data.status === "Food delivered") {
    cardGradient =
      "text-success border border-success/20";
    icon = <Salad className="h-4 w-4 text-success" />;
  }
  if (data.status === "Check payment") {
    cardGradient =
      "text-success border border-success/20";
    icon = <CircleCheckBig className="h-4 w-4 text-success" />;
  }
  if (data.status === "Available table") {
    cardGradient =
      "text-muted-foreground/70 border border-border";
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
            <div className="invisible md:visible bg-card/70 text-muted-foreground text-xs font-light px-2 py-1 rounded-lg text-nowrap shadow-sm border border-border">
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
