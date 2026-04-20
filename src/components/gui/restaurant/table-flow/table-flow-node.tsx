import { table_with_order } from "@/app/hooks/use-query-table";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { table_restaurant_tables } from "@/generated/tables";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { usePermission } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import {
  BellRing,
  Circle,
  CircleCheckBig,
  HandPlatter,
  Hexagon,
  PrinterCheck,
  Square,
  TicketPercent,
  Timer,
  Users,
} from "lucide-react";
import { JSX, useMemo } from "react";
import { transferTable } from "../transfer/transfer-table";
import { useRestaurant } from "../contexts/restaurant-context";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

export interface TableNodeData extends table_restaurant_tables {
  orderCount?: number;
  orderElapsedTime?: string;
  totalOrder?: number;
  totalDiscount?: number;
  customer?: number;
  printCount?: number;
  hasOverdueCooking?: boolean;
  onTableClick?: (table: table_restaurant_tables) => void;
  onTableEdit?: (table: table_restaurant_tables) => void;
  onTableDelete?: (table: table_restaurant_tables) => void;
  onTableReset?: (table: table_restaurant_tables) => void;
  onTableQRCode?: (table: table_restaurant_tables) => void;
  permission?: WithLayoutPermissionProps;
}

export function TableFlowNode({ data, selected }: NodeProps) {
  const tableData = data as unknown as TableNodeData;
  const hasTablePermission = usePermission("table");
  const canDelelte = hasTablePermission.includes("delete");
  const canUpdate = hasTablePermission.includes("update");
  const { onRefetch, state } = useRestaurant();
  const { formatForDisplay } = useCurrencyFormat();

  // Status styling
  const { cardGradient, statusIcon, statusText } = useMemo(() => {
    if ((tableData.printCount || 0) > 0) {
      return {
        cardGradient:
          "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-700 border border-gray-200",
        statusIcon: <PrinterCheck className="h-3 w-3 text-red-500" />,
        statusColor: "bg-red-100 text-red-700 border-red-200",
        statusText: "Receipt Printed",
      };
    }

    switch (tableData.status) {
      case "available":
        return {
          cardGradient:
            "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-700 border border-gray-200",
          statusIcon: <CircleCheckBig className="h-3 w-3 text-green-500" />,
          statusColor: "bg-green-100 text-green-700 border-green-200",
          statusText: "Available",
        };
      case "order_taken":
        return {
          cardGradient:
            "bg-gradient-to-br from-blue-50 via-blue-25 to-white text-blue-700 border border-blue-200",
          statusIcon: <HandPlatter className="h-3 w-3 text-blue-500" />,
          statusColor: "bg-blue-100 text-blue-700 border-blue-200",
          statusText: "Occupied",
        };
      case "cleaning":
        return {
          cardGradient:
            "bg-gradient-to-br from-amber-50 via-amber-25 to-white text-amber-700 border border-amber-200",
          statusIcon: <BellRing className="h-3 w-3 text-amber-500" />,
          statusColor: "bg-amber-100 text-amber-700 border-amber-200",
          statusText: "Cleaning",
        };
      default:
        return {
          cardGradient:
            "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-700 border border-gray-200",
          statusIcon: <CircleCheckBig className="h-3 w-3 text-gray-500" />,
          statusColor: "bg-gray-100 text-gray-700 border-gray-200",
          statusText: "Unknown",
        };
    }
  }, [tableData]);

  // Table shape icon
  const getTableShapeIcon = (shape: string | null): JSX.Element => {
    switch (shape?.toLowerCase()) {
      case "round":
        return <Circle className="h-3 w-3" />;
      case "square":
        return <Square className="h-3 w-3" />;
      case "rectangle":
        return <Square className="h-3 w-3" />;
      case "hexagon":
        return <Hexagon className="h-3 w-3" />;
      default:
        return <Square className="h-3 w-3" />;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click when interacting with menu
    const target = e.target as HTMLElement;

    // Check for menu trigger
    if (target.closest("[data-menu-trigger]")) {
      e.stopPropagation();
      return;
    }

    // Check for menu actions
    if (target.closest("[data-menu-action]")) {
      e.stopPropagation();
      return;
    }

    // Check for button elements (menu button)
    if (target.closest("button")) {
      e.stopPropagation();
      return;
    }

    tableData.onTableClick?.(tableData);
  };

  // Fallback if data is invalid
  if (!tableData || !tableData.table_name) {
    return (
      <div className="w-48 h-32 bg-red-100 border-2 border-red-300 rounded-lg flex items-center justify-center">
        <div className="text-red-600 text-sm">Invalid table data</div>
      </div>
    );
  }

  const subMenuActions: { label: string; onClick: () => void }[] = [
    {
      label: "Qr Code",
      onClick: async () => {
        await tableData.onTableQRCode?.(tableData);
      },
    },
  ];

  if (canUpdate) {
    subMenuActions.push({
      label: "Edit",
      onClick: () => tableData.onTableEdit?.(tableData),
    });
  }

  if (canDelelte) {
    subMenuActions.push({
      label: "Delete",
      onClick: () => tableData.onTableDelete?.(tableData),
    });
  }

  const menuAction: {
    label: string;
    onClick: () => void;
    items?: { label: string; onClick: () => void }[];
  }[] =
    canDelelte || canUpdate
      ? [
          {
            label: "Table",
            onClick: () => {},
            items: subMenuActions,
          },
        ]
      : [];

  if (
    tableData.status !== "available" &&
    !(tableData as table_with_order).order
  ) {
    menuAction.push({
      label: "Reset to Available",
      onClick: () => tableData.onTableReset?.(tableData),
    });
  }

  if (
    tableData.status === "order_taken" &&
    (tableData as table_with_order).order
  ) {
    menuAction.push({
      label: "Transfer Order",
      onClick: async () => {
        if (tableData) {
          const currentTable = state.activeTables.find(
            (f) => f.tables?.id === tableData.id,
          );

          if (currentTable) {
            const res = await transferTable.show({ data: currentTable });
            if (res) {
              onRefetch?.();
            }
          }
        }
      },
    });
  }

  return (
    <>
      {/* Invisible handles for connections if needed in the future */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
      />

      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 w-full rounded-xl cursor-pointer select-none min-w-[180px] max-w-[220px]",
          cardGradient,
          selected && "ring-2 ring-blue-500 ring-opacity-50 shadow-lg",
          tableData.status === "available"
            ? "hover:shadow-md"
            : "hover:shadow-lg",
        )}
        style={{
          boxShadow: selected
            ? "0 8px 25px rgba(59, 130, 246, 0.15)"
            : tableData.status === "available"
              ? "0 2px 8px rgba(0,0,0,0.04)"
              : "0 4px 12px rgba(0,0,0,0.08)",
        }}
        onClick={handleCardClick}
      >
        {/* Status indicator bar */}
        <div
          className={cn(
            "h-1 w-full",
            (tableData.printCount || 0) > 0 && "!bg-red-400",
            tableData.status === "available" && "bg-green-400",
            tableData.status === "order_taken" && "bg-blue-400",
            tableData.status === "cleaning" && "bg-amber-400",
          )}
        />

        <div className="p-3">
          {/* Header with table info and menu */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {getTableShapeIcon(tableData.table_shape)}
                <h3 className="font-semibold text-sm leading-tight truncate">
                  {tableData.table_name}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                <span>{tableData.customer} customers</span>
              </div>
            </div>

            <BasicMenuAction value={tableData} items={menuAction} />
          </div>

          {/* Section info */}
          {tableData.section && (
            <div className="mb-2">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                {tableData.section}
              </Badge>
            </div>
          )}

          {/* Overdue cooking alert */}
          {tableData.hasOverdueCooking && (
            <div className="flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded-md bg-orange-100 border border-orange-300 animate-pulse">
              <Timer className="h-3 w-3 text-orange-600 shrink-0" />
              <span className="text-[10px] font-semibold text-orange-700 leading-tight">
                Item cooking &gt;5 min
              </span>
            </div>
          )}

          {/* Status and order info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                {statusIcon}
                <span className="text-xs font-medium">{statusText}</span>
              </div>
              {tableData.orderCount && tableData.orderCount > 0 ? (
                <div className="font-medium text-xs ml-4">
                  {tableData.orderCount} items
                </div>
              ) : null}
            </div>

            {(tableData.orderCount && tableData.orderCount > 0) ||
            tableData.totalOrder ? (
              <div className="text-xs text-right">
                {tableData.totalOrder && (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <span>{formatForDisplay(tableData.totalOrder)}</span>
                    </div>
                    {tableData.totalDiscount && tableData.totalDiscount > 0 ? (
                      <div className="flex items-center gap-1 text-orange-600 text-[10px]">
                        <TicketPercent className="h-2.5 w-2.5" />
                        <span>
                          -{formatForDisplay(tableData.totalDiscount)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
                {tableData.orderElapsedTime && (
                  <div className="text-gray-500 mt-0.5">
                    {tableData.orderElapsedTime}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Special features indicator */}
          {tableData.special_features && (
            <div className="mt-2 pt-2 border-t border-gray-200/50">
              <div
                className="text-xs text-gray-500 truncate"
                title={tableData.special_features}
              >
                {tableData.special_features}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
