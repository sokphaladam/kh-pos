import { OrderItemStatusType } from "@/dataloader/order-status-item.loader";
import { StatusMark, type StatusMarkStatus } from "@/components/ui/status-mark";
import { cn } from "@/lib/utils";

const STEPS: {
  key: "pending" | "cooking" | "served";
  label: string;
  mark: StatusMarkStatus;
  className: string;
}[] = [
  {
    key: "pending",
    label: "Pending",
    mark: "pending",
    className: "border-border bg-muted text-muted-foreground",
  },
  {
    key: "cooking",
    label: "Cooking",
    mark: "running",
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  {
    key: "served",
    label: "Served",
    mark: "done",
    className: "border-success/30 bg-success/10 text-success",
  },
];

export function RestaurantItemStatus({
  status,
}: {
  status?: OrderItemStatusType[];
}) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-1.5">
      {STEPS.map((step) => {
        const qty = status?.find((f) => f.status === step.key)?.qty ?? 0;
        if (qty <= 0) return null;
        return (
          <span
            key={step.key}
            className={cn(
              "inline-flex items-center gap-1 text-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
              step.className,
            )}
          >
            <StatusMark status={step.mark} size={12} strokeWidth={2.5} />
            {step.label}
            <span className="tabular-nums">{qty}</span>
          </span>
        );
      })}
    </div>
  );
}
