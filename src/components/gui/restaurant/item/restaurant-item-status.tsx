import { OrderItemStatusType } from "@/dataloader/order-status-item.loader";
import { cn } from "@/lib/utils";

export function RestaurantItemStatus({
  status,
}: {
  status?: OrderItemStatusType[];
}) {
  const pending = status?.find((f) => f.status === "pending");
  const cooking = status?.find((f) => f.status === "cooking");
  const served = status?.find((f) => f.status === "served");
  return (
    <div className="flex flex-row gap-2 items-center flex-wrap">
      {pending && pending.qty > 0 && (
        <span
          className={cn(
            "capitalize text-xs px-2 rounded bg-stone-700 text-white text-nowrap"
          )}
        >
          Pending: {pending.qty}
        </span>
      )}
      {cooking && cooking.qty > 0 && (
        <span
          className={cn(
            "capitalize text-xs px-2 rounded bg-orange-700 text-white text-nowrap"
          )}
        >
          Cooking: {cooking.qty}
        </span>
      )}
      {served && served.qty > 0 && (
        <span
          className={cn(
            "capitalize text-xs px-2 rounded bg-green-700 text-white text-nowrap"
          )}
        >
          Served: {served.qty}
        </span>
      )}
    </div>
  );
}
