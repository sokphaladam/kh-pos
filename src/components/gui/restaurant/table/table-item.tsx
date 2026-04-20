import {
  table_with_order,
  useMutationDeleteTable,
} from "@/app/hooks/use-query-table";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Card } from "@/components/ui/card";
import { table_restaurant_tables } from "@/generated/tables";
import { cn } from "@/lib/utils";
import {
  CircleCheckBig,
  HandPlatter,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import moment from "moment-timezone";
import { usePathname, useRouter } from "next/navigation";
import { JSX, useCallback } from "react";
import { toast } from "sonner";
import { useRestaurant } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";
import { transferTable } from "../transfer/transfer-table";
import { sheetCreateTable } from "./sheet-create-table";
import { useCommonDialog } from "@/components/common-dialog";

interface Props {
  table: table_restaurant_tables;
  isDelivery: boolean;
  getTableShapeIcon: (shape: string) => JSX.Element;
  listSection: { label: string; value: string }[];
}

export function TableItem(props: Props) {
  const { table: t, isDelivery, getTableShapeIcon, listSection } = props;
  const { state } = useRestaurant();
  const { resetTableToAvailable, selectTable, removeTable } =
    useRestaurantActions();
  const router = useRouter();
  const pathname = usePathname();
  const { trigger: triggerDelete } = useMutationDeleteTable();
  const { showDialog } = useCommonDialog();

  const handleResetTableToAvailable = useCallback(
    (table: table_restaurant_tables) => {
      resetTableToAvailable(table);
    },
    [resetTableToAvailable]
  );

  const handlePress = (
    t: table_restaurant_tables,
    event?: React.MouseEvent
  ) => {
    // Prevent table selection if clicking on menu actions
    if (
      event?.target &&
      (event.target as HTMLElement).closest("[data-menu-action]")
    ) {
      return;
    }

    const params = new URLSearchParams();

    if (t.status === "available") {
      params.set("table", t.id);
      params.set("tab", "menu");
      router.push(`${pathname}?${params.toString()}`);
      selectTable(t);
    }

    if (t.status === "order_taken") {
      params.set("table", t.id);
      params.set("tab", "menu");
      router.push(`${pathname}?${params.toString()}`);
      selectTable(t);
    }

    if (t.status === "cleaning") {
      selectTable(t);
    }
  };

  const handleDelete = useCallback(
    (id: string) => {
      showDialog({
        title: "Delete Table",
        content: "Are you sure you want to delete this table?",
        destructive: true,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              triggerDelete({ id })
                .then((res) => {
                  if (res.success) {
                    const table = state.tables.find((t) => t.id === id);
                    toast.success("Table deleted successfully");
                    if (table) {
                      removeTable(table);
                    }
                  } else {
                    toast.error("Failed to delete table");
                  }
                })
                .catch(() => {
                  toast.error("Failed to delete table");
                });
            },
          },
        ],
      });
    },
    [triggerDelete, state, removeTable, showDialog]
  );

  const handleEdit = useCallback(async (data: table_restaurant_tables) => {
    const res = await sheetCreateTable.show({
      id: data.id,
      data: {
        tableNumber: data.table_name,
        section: data.section ?? "",
        seatingCapacity: Number(data.setting_capacity ?? 1),
        tableShape: data.table_shape ?? "rectangle",
        features: data.special_features ? data.special_features.split(",") : [],
        additionalNotes: data.addional_notes ?? "",
        locationDescription: data.location_description ?? "",
      },
    });

    if (res) {
    }
  }, []);

  // Simplified card styling with subtle gradients
  let cardGradient = "bg-white border-gray-200 hover:border-gray-300";
  let statusIndicator = "bg-blue-500";
  let shadowStyle = "0 1px 3px 0 rgba(0, 0, 0, 0.1)";
  let icon: JSX.Element | undefined = (
    <CircleCheckBig className="h-3.5 w-3.5 text-blue-500" />
  );
  let statusText = "Available";
  let titleTextColor = "text-gray-900";
  let sectionTextColor = "text-gray-500";
  let statusTextColor = "text-gray-600";

  // Override icon for delivery tables
  if (isDelivery) {
    icon = <Truck className="h-3.5 w-3.5 text-blue-600" />;
  }

  if (t.status === "available") {
    cardGradient = "bg-white border-blue-200 hover:border-blue-300";
    statusIndicator = "bg-blue-500";
    shadowStyle = "0 1px 3px 0 rgba(59, 130, 246, 0.12)";
    icon = isDelivery ? (
      <Truck className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <CircleCheckBig className="h-3.5 w-3.5 text-blue-500" />
    );
    statusText = "Available";
    titleTextColor = "text-blue-900";
    sectionTextColor = "text-blue-600";
    statusTextColor = "text-blue-700";
  }
  if (t.status === "cleaning") {
    cardGradient = "bg-white border-rose-200 hover:border-rose-300";
    statusIndicator = "bg-rose-500";
    shadowStyle = "0 1px 3px 0 rgba(244, 63, 94, 0.12)";
    icon = isDelivery ? (
      <Truck className="h-3.5 w-3.5 text-rose-600" />
    ) : (
      <UtensilsCrossed className="h-3.5 w-3.5 text-rose-500" />
    );
    statusText = "Cleaning";
    titleTextColor = "text-rose-900";
    sectionTextColor = "text-rose-600";
    statusTextColor = "text-rose-700";
  }
  if (t.status === "order_taken") {
    cardGradient = "bg-white border-amber-200 hover:border-amber-300";
    statusIndicator = "bg-amber-500";
    shadowStyle = "0 1px 3px 0 rgba(245, 158, 11, 0.12)";
    icon = isDelivery ? (
      <Truck className="h-3.5 w-3.5 text-amber-600" />
    ) : (
      <HandPlatter className="h-3.5 w-3.5 text-amber-500" />
    );
    statusText = "Order Taken";
    titleTextColor = "text-amber-900";
    sectionTextColor = "text-amber-600";
    statusTextColor = "text-amber-700";
  }

  const activeTable = state.activeTables.find((f) => f.tables?.id === t.id);

  const total = activeTable ? Number(activeTable.orders?.totalAmount) || 0 : 0;
  const duration = activeTable
    ? moment(activeTable.orders?.createdAt).fromNow(true)
    : "";

  const menuAction: {
    label: string;
    onClick: () => void;
    items?: { label: string; onClick: () => void }[];
  }[] = [
    {
      label: "Table",
      onClick: () => {},
      items: [
        {
          label: "Edit",
          onClick: () => handleEdit(t),
        },
        {
          label: "Delete",
          onClick: () => handleDelete(t.id),
        },
      ],
    },
  ];

  if (t.status !== "available" && !(t as table_with_order).order) {
    menuAction.push({
      label: "Reset to Available",
      onClick: () => handleResetTableToAvailable(t),
    });
  }

  if (t.status === "order_taken" && (t as table_with_order).order) {
    menuAction.push({
      label: "Transfer Order",
      onClick: () => {
        if (activeTable) {
          transferTable.show({ data: activeTable });
        }
      },
    });
  }

  return (
    <Card
      key={t.id}
      className={cn(
        "relative overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group border",
        cardGradient,
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
      style={{ boxShadow: shadowStyle }}
      onClick={(e) => handlePress(t, e)}
    >
      {/* Status Indicator */}
      <div
        className={cn("absolute top-0 left-0 right-0 h-0.5", statusIndicator)}
      ></div>

      <div className="p-2.5">
        {/* Header with Menu Action */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className={`font-medium text-sm leading-tight truncate ${titleTextColor}`}
              >
                {t.table_name}{" "}
                {duration && (
                  <span className="text-xs font-normal text-gray-400">
                    · {duration}
                  </span>
                )}
              </h3>
            </div>
            <p className={`text-xs mt-0.5 truncate ${sectionTextColor}`}>
              {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                listSection.find((f: any) => f.value === t.section)?.label ||
                  t.section ||
                  "Section"
              }
            </p>
          </div>
          <div
            data-menu-action="true"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1 flex-shrink-0"
          >
            <BasicMenuAction value={t} items={menuAction} />
          </div>
        </div>

        {/* Table Info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600">{t.setting_capacity}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTableShapeIcon(t.table_shape || "")}
            {icon}
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-1.5 border-t border-gray-100">
          <div className="flex items-center justify-center flex-nowrap">
            <span
              className={`text-xs font-medium text-center ${statusTextColor} text-nowrap`}
            >
              {statusText}
            </span>
            {total > 0 && (
              <span className={`ml-2 text-xs font-medium ${statusTextColor}`}>
                (${total.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Hover Effect */}
      <div className="absolute inset-0 bg-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
    </Card>
  );
}
