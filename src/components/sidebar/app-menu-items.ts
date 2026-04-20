import {
  AlertTriangle,
  BadgeDollarSign,
  Banknote,
  Boxes,
  CirclePercent,
  Clapperboard,
  ClockAlert,
  Combine,
  Component,
  DoorOpen,
  FileClock,
  Grid,
  HandPlatter,
  LayoutDashboard,
  LifeBuoy,
  Monitor,
  MonitorCog,
  PackageSearch,
  Puzzle,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  Timer,
  Users,
  UsersRound,
  Warehouse,
} from "lucide-react";
import { useRestaurant } from "../gui/restaurant/contexts/restaurant-context";
import { useAuthentication } from "contexts/authentication-context";
import { useMemo } from "react";
import { MenuProp } from "./app-menu-root";

export function useAppMenuRestaurant() {
  const { state } = useRestaurant();

  const restaurants: MenuProp[] = [
    {
      title: "Application",
      items: [
        {
          title: "Tables",
          icon: LifeBuoy,
          url: "/admin/restaurant",
        },
      ],
    },
  ];

  if (state.activeTables.length > 0) {
    restaurants.push({
      title: "Active Tables",
      items: state.activeTables?.map((table) => ({
        title: table.tables?.table_name || "",
        icon: HandPlatter,
        url: `/admin/restaurant?table=${table.tables?.id}`,
      })),
    });
  }

  return restaurants;
}

export function useMenuItems() {
  const { user, setting } = useAuthentication();

  const actions = useMemo<Record<string, string>>(() => {
    return (user?.role?.permissions || {}) as Record<string, string>;
  }, [user]);

  const getResourceFromUrl = (url: string): string | null => {
    const urlParts = url.split("/").filter(Boolean);
    if (urlParts.length >= 2) {
      const resource = urlParts[urlParts.length - 1];
      return resource;
    }
    return null;
  };

  // Helper function to check if user has permission to view a resource
  const hasViewPermission = (url: string): boolean => {
    const resource = getResourceFromUrl(url);
    if (!resource) return true; // Allow dashboard and other non-resource pages

    // Check if the resource exists in actions and has at least read permission
    const permissions = actions[resource];
    if (!permissions) return false;

    // Permissions are stored as comma-separated strings
    const permissionList = permissions.split(",").map((p: string) => p.trim());

    return permissionList.includes("read");
  };

  const type_pos =
    JSON.parse(
      setting?.data?.result?.find((f) => f.option === "TYPE_POS")?.value ||
        "{}",
    ).system_type || "";
  const enableAccounting =
    setting?.data?.result?.find((f) => f.option === "ACCOUNTING")?.value ===
    "1";

  const allItems: MenuProp[] = [];

  allItems.push({
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        url: !actions["board-member-dashboard"]
          ? "/admin/dashboard"
          : "/admin/board-member-dashboard",
        subitems: [],
      },
    ],
  });

  allItems.push({
    title: "Inventory",
    items: [
      {
        title: "Products",
        icon: PackageSearch,
        url: "/admin/product",
      },
      {
        title: "Category",
        icon: Boxes,
        url: "/admin/category",
      },
      {
        title: "Discount",
        url: "/admin/discount",
        icon: CirclePercent,
      },
      {
        title: "Modifier",
        icon: Puzzle,
        url: "/admin/modifier",
      },
      {
        title: "Production",
        icon: Component,
        url: "/admin/production",
      },
      {
        title: "Warehouse",
        icon: Warehouse,
        url: "/admin/warehouse",
        subitems: [],
        onlyMain: true,
      },
      {
        title: "Slot",
        icon: Boxes,
        url: "/admin/slot",
        subitems: [],
      },
      {
        title: "Transactions",
        icon: FileClock,
        url: "/admin/transaction",
        subitems: [],
      },
      {
        title: "Product Group",
        icon: Users,
        url: "/admin/product/product-group",
        subitems: [],
      },
    ],
  });

  if (type_pos === "CINEMA") {
    allItems.push({
      title: "Cinema",
      items: [
        {
          title: "Showtimes",
          icon: LifeBuoy,
          url: "/admin/cinema/showtime",
        },
        {
          title: "Halls & Seats",
          icon: Clapperboard,
          url: "/admin/cinema/hall-seat",
        },
        {
          title: "Pricing Template",
          icon: Receipt,
          url: "/admin/cinema/pricing-template",
        },
        {
          title: "Reservations Ticket",
          icon: Ticket,
          url: "/admin/cinema/ticket",
        },
        {
          title: "Find Ticket",
          icon: Ticket,
          url: "/admin/cinema/ticket/digital",
        },
        {
          title: "Settlement",
          icon: Banknote,
          url: "/admin/cinema/settlement",
        },
        ...(!!user?.isDev
          ? [
              {
                title: "Manual Ticket Order",
                icon: ShoppingCart,
                url: "/admin/cinema/ticket/order",
              },
            ]
          : []),
      ],
    });
  }

  // Order Management
  allItems.push({
    title: "Order Management",
    items: [
      {
        title: "Customer Order",
        icon: ShoppingCart,
        url: "/admin/order",
        subitems: [],
      },
      {
        title: "Finding and Transfer",
        icon: PackageSearch,
        url: "/admin/a/transfer",
        subitems: [],
      },
      {
        title: "Order Return",
        icon: Combine,
        url: "/admin/return",
        subitems: [],
      },
      {
        title: "Back Log",
        icon: ClockAlert,
        url: "/admin/backlog",
        subitems: [],
      },
      {
        title: "Shift",
        icon: DoorOpen,
        url: "/admin/shift",
        subitems: [],
      },
    ],
  });

  //Supply
  allItems.push({
    title: "Supply",
    items: [
      {
        title: "Suppliers",
        icon: Users,
        url: "/admin/supplier",
      },
      {
        title: "Purchase Order",
        icon: ShoppingBag,
        url: "/admin/purchase-order",
        subitems: [],
      },
      {
        title: "Replenishment",
        icon: Grid,
        url: "/admin/replenishment",
        subitems: [],
      },
      {
        title: "Supplier Product Price",
        icon: BadgeDollarSign,
        url: "/admin/supplier/product-price",
        subitems: [],
      },
    ],
  });

  if (!!enableAccounting) {
    allItems.push({
      title: "Accounting",
      items: [
        {
          title: "Booking",
          icon: Banknote,
          url: "/admin/accounting/booking",
        },
        {
          title: "Chart of Account",
          icon: FileClock,
          url: "/admin/accounting/chart-of-account",
        },
      ],
    });
  }

  allItems.push({
    title: "Report",
    items: [
      {
        title: "Sale Report",
        icon: LayoutDashboard,
        url: "/admin/reports/sale-report",
        subitems: [],
      },
      {
        title: "End of Day Report",
        icon: Receipt,
        url: "/admin/reports/end-of-day",
        subitems: [],
      },
      {
        title: "Sale Item Summary Report",
        icon: ShoppingCart,
        url: "/admin/reports/sale-item-report",
        subitems: [],
      },
      {
        title: "Void Order Report",
        icon: AlertTriangle,
        url: "/admin/reports/void-order",
        subitems: [],
      },
      {
        title: "Guest Number Report",
        icon: UsersRound,
        url: "/admin/reports/guest-number",
        subitems: [],
      },
      {
        title: "Expiry Report",
        icon: Timer,
        url: "/admin/reports/expiry",
        subitems: [],
      },
      {
        title: "Stock Report",
        icon: Warehouse,
        url: "/admin/reports/stock-report",
        subitems: [],
      },
      ...(type_pos === "CINEMA"
        ? [
            {
              title: "Showtime Sale Report",
              icon: Clapperboard,
              url: "/admin/reports/cinema-showtime-sale",
              subitems: [],
            },
          ]
        : []),
    ],
  });

  allItems.push({
    title: "Setting",
    items: [
      {
        title: "Setting",
        icon: MonitorCog,
        url: "/admin/setting",
        subitems: [],
        // onlyMain: true,
      },
      {
        title: "Users",
        icon: UsersRound,
        url: "/admin/users",
        subitems: [],
      },
      ...(type_pos === "RESTAURANT"
        ? [
            {
              title: "Delivery",
              icon: Monitor,
              url: "/admin/delivery",
              subitems: [],
            },
          ]
        : []),
      {
        title: "Payment Method",
        icon: Banknote,
        url: "/admin/setting/payment",
        subitems: [],
        onlyMain: true,
      },
    ],
  });

  // Filter items based on permissions
  // Skip filtering for OWNER role - they have access to everything
  const isOwner = user?.role?.role === "OWNER";

  const items = isOwner
    ? allItems
    : allItems
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => hasViewPermission(item.url)),
        }))
        .filter((section) => section.items.length > 0); // Remove empty sections
  return {
    items,
    loading: items.length === 0,
  };
}
