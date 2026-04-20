import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

export type OrderStatus = "DRAFT" | "COMPLETED";

interface OrderStatusProps {
  status: OrderStatus;
  size?: "sm" | "default" | "lg";
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "default" as const,
    className: "bg-green-100 text-green-700 hover:bg-green-200",
  },
};

export function OrderStatus({ status, size = "default" }: OrderStatusProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  const IconComponent = config.icon;

  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${textSize} font-medium inline-flex items-center gap-1.5`}
    >
      <IconComponent className={iconSize} />
      {config.label}
    </Badge>
  );
}
