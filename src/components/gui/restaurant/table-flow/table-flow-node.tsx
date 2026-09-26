import { table_with_order } from "@/app/hooks/use-query-table";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { table_restaurant_tables } from "@/generated/tables";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { usePermission } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import {
  Handle,
  NodeProps,
  Position,
  ReactFlowState,
  useStore,
} from "@xyflow/react";
import {
  BellRing,
  Circle,
  CircleCheckBig,
  HandPlatter,
  Hexagon,
  LucideIcon,
  PrinterCheck,
  Square,
  TicketPercent,
  Timer,
  Users,
} from "lucide-react";
import { memo, useCallback } from "react";
import { transferTable } from "../transfer/transfer-table";
import { invoiceQRCode } from "./invoice-qr-code";
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
  serviceChargeAmount?: string;
  serviceChargePercentage?: string;
}

// Level of detail by zoom. The selector returns a primitive, so a node only
// re-renders when the zoom crosses a threshold, not on every pan/zoom frame.
type DetailLevel = "compact" | "summary" | "full";
const COMPACT_ZOOM = 0.5;
const FULL_ZOOM = 0.75;
const detailLevelSelector = (s: ReactFlowState): DetailLevel => {
  const zoom = s.transform[2];
  if (zoom < COMPACT_ZOOM) return "compact";
  if (zoom < FULL_ZOOM) return "summary";
  return "full";
};

interface StatusStyle {
  cardGradient: string;
  barColor: string;
  compactColor: string;
  Icon: LucideIcon;
  iconColor: string;
  text: string;
}

const NEUTRAL_CARD = "bg-card text-foreground border border-border";

const STATUS_STYLES: Record<string, StatusStyle> = {
  printed: {
    cardGradient: NEUTRAL_CARD,
    barColor: "bg-destructive/70",
    compactColor: "bg-destructive/10 text-destructive border-destructive",
    Icon: PrinterCheck,
    iconColor: "text-destructive",
    text: "Receipt Printed",
  },
  available: {
    cardGradient: NEUTRAL_CARD,
    barColor: "bg-success/70",
    // Available is the resting state: keep it neutral so busy tables stand out
    compactColor: "bg-card text-foreground border-border [&_.status-label]:text-success",
    Icon: CircleCheckBig,
    iconColor: "text-success",
    text: "Available",
  },
  order_taken: {
    cardGradient: "bg-info/5 text-foreground border border-info/40",
    barColor: "bg-info/70",
    compactColor: "bg-info/10 text-info border-info",
    Icon: HandPlatter,
    iconColor: "text-info",
    text: "Occupied",
  },
  cleaning: {
    cardGradient: "bg-warning/5 text-foreground border border-warning/40",
    barColor: "bg-warning/70",
    compactColor: "bg-warning/10 text-warning border-warning",
    Icon: BellRing,
    iconColor: "text-warning",
    text: "Cleaning",
  },
  unknown: {
    cardGradient: NEUTRAL_CARD,
    barColor: "bg-muted-foreground",
    compactColor: "bg-muted/40 text-muted-foreground border-input",
    Icon: CircleCheckBig,
    iconColor: "text-muted-foreground",
    text: "Unknown",
  },
};

function getStatusStyle(data: TableNodeData): StatusStyle {
  if ((data.printCount || 0) > 0) return STATUS_STYLES.printed;
  return STATUS_STYLES[data.status ?? ""] ?? STATUS_STYLES.unknown;
}

const SHAPE_ICONS: Record<string, LucideIcon> = {
  round: Circle,
  square: Square,
  rectangle: Square,
  hexagon: Hexagon,
};

function TableShapeIcon({ shape }: { shape: string | null }) {
  const Icon = SHAPE_ICONS[shape?.toLowerCase() ?? ""] ?? Square;
  return <Icon className="h-3 w-3" />;
}

function hasOrderAmount(data: TableNodeData) {
  return (data.orderCount ?? 0) > 0 || !!data.totalOrder;
}

function TableFlowNodeComponent({ data, selected }: NodeProps) {
  const tableData = data as unknown as TableNodeData;
  const detailLevel = useStore(detailLevelSelector);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Ignore clicks coming from the menu trigger / menu actions / buttons
      const target = e.target as HTMLElement;
      if (
        target.closest("[data-menu-trigger]") ||
        target.closest("[data-menu-action]") ||
        target.closest("button")
      ) {
        e.stopPropagation();
        return;
      }
      tableData.onTableClick?.(tableData);
    },
    [tableData],
  );

  // Fallback if data is invalid
  if (!tableData || !tableData.table_name) {
    return (
      <div className="w-48 h-32 bg-destructive/15 border-2 border-destructive/30 rounded-lg flex items-center justify-center">
        <div className="text-destructive text-sm">Invalid table data</div>
      </div>
    );
  }

  const status = getStatusStyle(tableData);

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

      {detailLevel === "compact" ? (
        <CompactTableCard
          tableData={tableData}
          status={status}
          selected={selected}
          onClick={handleCardClick}
        />
      ) : (
        <DetailedTableCard
          tableData={tableData}
          status={status}
          selected={selected}
          showMenu={detailLevel === "full"}
          onClick={handleCardClick}
        />
      )}
    </>
  );
}

export const TableFlowNode = memo(TableFlowNodeComponent);

interface CardProps {
  tableData: TableNodeData;
  status: StatusStyle;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

// Zoomed-out view: large, flat, no shadows/gradients/animations so many tables
// stay cheap to paint and still readable at low zoom.
function CompactTableCard({ tableData, status, selected, onClick }: CardProps) {
  const { formatForDisplay } = useCurrencyFormat();
  const total =
    (tableData.totalOrder ?? 0) + Number(tableData.serviceChargeAmount || 0);

  return (
    <div
      className={cn(
        "w-[200px] h-[120px] rounded-xl border-[3px] cursor-pointer select-none flex flex-col items-center justify-center gap-1 px-2",
        status.compactColor,
        selected && "ring-4 ring-ring/40",
        tableData.hasOverdueCooking && "border-warning bg-warning/15 text-warning",
      )}
      onClick={onClick}
    >
      <div className="font-bold text-3xl leading-tight truncate max-w-full">
        {tableData.table_name}
      </div>
      {hasOrderAmount(tableData) && total > 0 ? (
        <div className="font-semibold text-xl leading-tight truncate max-w-full">
          {formatForDisplay(total)}
        </div>
      ) : (
        <div className="status-label font-medium text-lg leading-tight">
          {status.text}
        </div>
      )}
    </div>
  );
}

function DetailedTableCard({
  tableData,
  status,
  selected,
  showMenu,
  onClick,
}: CardProps & { showMenu: boolean }) {
  const { formatForDisplay } = useCurrencyFormat();
  const StatusIcon = status.Icon;

  return (
    <Card
      className={cn(
        "overflow-hidden w-full rounded-xl cursor-pointer select-none min-w-[180px] max-w-[220px]",
        status.cardGradient,
        showMenu && "transition-shadow duration-200",
        selected && "ring-2 ring-info ring-opacity-50 shadow-lg",
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
      onClick={onClick}
    >
      {/* Status indicator bar */}
      <div className={cn("h-1 w-full", status.barColor)} />

      <div className="p-3">
        {/* Header with table info and menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <TableShapeIcon shape={tableData.table_shape} />
              <h3 className="font-semibold text-sm leading-tight truncate">
                {tableData.table_name}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{tableData.customer} customers</span>
            </div>
          </div>

          {showMenu ? (
            <TableNodeMenu tableData={tableData} />
          ) : (
            // Keep the same footprint as the menu button to avoid layout shift
            <div className="h-9 w-9 shrink-0" />
          )}
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
          <div
            className={cn(
              "flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded-md bg-warning/15 border border-warning/30",
              showMenu && "animate-pulse",
            )}
          >
            <Timer className="h-3 w-3 text-warning shrink-0" />
            <span className="text-[10px] font-semibold text-warning leading-tight">
              Item cooking &gt;5 min
            </span>
          </div>
        )}

        {/* Status and order info */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <StatusIcon className={cn("h-3 w-3", status.iconColor)} />
              <span className="text-xs font-medium">{status.text}</span>
            </div>
            {tableData.orderCount && tableData.orderCount > 0 ? (
              <div className="font-medium text-xs ml-4">
                {tableData.orderCount} items
              </div>
            ) : null}
          </div>

          {hasOrderAmount(tableData) ? (
            <div className="text-xs text-right">
              {tableData.totalOrder && (
                <div className="flex flex-col items-end gap-0.5">
                  {tableData.totalDiscount && tableData.totalDiscount > 0 ? (
                    <div className="flex items-center gap-1 text-warning text-[10px]">
                      <TicketPercent className="h-2.5 w-2.5" />
                      <span>-{formatForDisplay(tableData.totalDiscount)}</span>
                    </div>
                  ) : null}
                  {tableData.serviceChargeAmount &&
                  Number(tableData.serviceChargeAmount) > 0 ? (
                    <div className="flex items-center gap-1 text-purple-600 text-[10px]">
                      <span>
                        +
                        {formatForDisplay(
                          Number(tableData.serviceChargeAmount),
                        )}
                      </span>
                      <span className="text-muted-foreground/70">
                        (SC {tableData.serviceChargePercentage}%)
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1 text-success font-medium">
                    <span>
                      {formatForDisplay(
                        tableData.totalOrder +
                          Number(tableData.serviceChargeAmount || 0),
                      )}
                    </span>
                  </div>
                </div>
              )}
              {tableData.orderElapsedTime && (
                <div className="text-muted-foreground mt-0.5">
                  {tableData.orderElapsedTime}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Special features indicator (full detail only) */}
        {showMenu && tableData.special_features && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div
              className="text-xs text-muted-foreground truncate"
              title={tableData.special_features}
            >
              {tableData.special_features}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Only mounted at full detail, so the restaurant context / permission
// subscriptions and dropdown are not created for every table when zoomed out.
function TableNodeMenu({ tableData }: { tableData: TableNodeData }) {
  const hasTablePermission = usePermission("table");
  const canDelete = hasTablePermission.includes("delete");
  const canUpdate = hasTablePermission.includes("update");
  const { onRefetch, state } = useRestaurant();

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

  if (canDelete) {
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
    canDelete || canUpdate
      ? [
          {
            label: "Table",
            onClick: () => {},
            items: subMenuActions,
          },
        ]
      : [];

  const order = (tableData as table_with_order)?.order;

  if (
    tableData.status !== "available" &&
    (!order || order.items?.length === 0)
  ) {
    menuAction.push({
      label: "Reset to Available",
      onClick: () => tableData.onTableReset?.(tableData),
    });
  }

  if (tableData.status === "order_taken" && order) {
    menuAction.push({
      label: "Transfer Order",
      onClick: async () => {
        const currentTable = state.activeTables.find(
          (f) => f.tables?.id === tableData.id,
        );

        if (currentTable) {
          const res = await transferTable.show({ data: currentTable });
          if (res) {
            onRefetch?.();
          }
        }
      },
    });

    menuAction.push({
      label: "Gen Invoice QR",
      onClick: async () => {
        const currentTable = state.activeTables.find(
          (f) => f.tables?.id === tableData.id,
        );
        const orderId = currentTable?.orders?.orderId;
        if (orderId) {
          await invoiceQRCode.show({
            orderId,
            invoiceNo: currentTable?.orders?.invoiceNo,
            tableName: tableData.table_name,
          });
        }
      },
    });
  }

  return <BasicMenuAction value={tableData} items={menuAction} />;
}
