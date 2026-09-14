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
import { useTranslations } from "next-intl";
import { MenuProp } from "./app-menu-root";

export function useAppMenuRestaurant() {
  const { state } = useRestaurant();
  const t = useTranslations("nav");

  const restaurants: MenuProp[] = [
    {
      key: "application",
      title: t("application"),
      items: [
        {
          title: t("tables"),
          icon: LifeBuoy,
          url: "/admin/restaurant",
        },
      ],
    },
  ];

  if (state.activeTables.length > 0) {
    restaurants.push({
      key: "activeTables",
      title: t("activeTables"),
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
  const t = useTranslations("nav");

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
    key: "dashboard",
    title: t("dashboard"),
    items: [
      {
        title: t("dashboard"),
        icon: LayoutDashboard,
        url: !actions["board-member-dashboard"]
          ? "/admin/dashboard"
          : "/admin/board-member-dashboard",
        subitems: [],
      },
    ],
  });

  allItems.push({
    key: "inventory",
    title: t("inventory"),
    items: [
      {
        title: t("products"),
        icon: PackageSearch,
        url: "/admin/product",
      },
      {
        title: t("category"),
        icon: Boxes,
        url: "/admin/category",
      },
      {
        title: t("discount"),
        url: "/admin/discount",
        icon: CirclePercent,
      },
      {
        title: t("modifier"),
        icon: Puzzle,
        url: "/admin/modifier",
      },
      {
        title: t("production"),
        icon: Component,
        url: "/admin/production",
      },
      {
        title: t("warehouse"),
        icon: Warehouse,
        url: "/admin/warehouse",
        subitems: [],
        onlyMain: true,
      },
      {
        title: t("slot"),
        icon: Boxes,
        url: "/admin/slot",
        subitems: [],
      },
      {
        title: t("transactions"),
        icon: FileClock,
        url: "/admin/transaction",
        subitems: [],
      },
      {
        title: t("productGroup"),
        icon: Users,
        url: "/admin/product/product-group",
        subitems: [],
      },
    ],
  });

  if (type_pos === "CINEMA") {
    allItems.push({
      key: "cinema",
      title: t("cinema"),
      items: [
        {
          title: t("showtimes"),
          icon: LifeBuoy,
          url: "/admin/cinema/showtime",
        },
        {
          title: t("hallsAndSeats"),
          icon: Clapperboard,
          url: "/admin/cinema/hall-seat",
        },
        {
          title: t("pricingTemplate"),
          icon: Receipt,
          url: "/admin/cinema/pricing-template",
        },
        {
          title: t("reservationsTicket"),
          icon: Ticket,
          url: "/admin/cinema/ticket",
        },
        {
          title: t("findTicket"),
          icon: Ticket,
          url: "/admin/cinema/ticket/digital",
        },
        {
          title: t("settlement"),
          icon: Banknote,
          url: "/admin/cinema/settlement",
        },
        ...(!!user?.isDev
          ? [
              {
                title: t("manualTicketOrder"),
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
    key: "orderManagement",
    title: t("orderManagement"),
    items: [
      {
        title: t("customerOrder"),
        icon: ShoppingCart,
        url: "/admin/order",
        subitems: [],
      },
      {
        title: t("findingAndTransfer"),
        icon: PackageSearch,
        url: "/admin/a/transfer",
        subitems: [],
      },
      {
        title: t("orderReturn"),
        icon: Combine,
        url: "/admin/return",
        subitems: [],
      },
      {
        title: t("backLog"),
        icon: ClockAlert,
        url: "/admin/backlog",
        subitems: [],
      },
      {
        title: t("shift"),
        icon: DoorOpen,
        url: "/admin/shift",
        subitems: [],
      },
    ],
  });

  //Supply
  allItems.push({
    key: "supply",
    title: t("supply"),
    items: [
      {
        title: t("suppliers"),
        icon: Users,
        url: "/admin/supplier",
      },
      {
        title: t("purchaseOrder"),
        icon: ShoppingBag,
        url: "/admin/purchase-order",
        subitems: [],
      },
      {
        title: t("replenishment"),
        icon: Grid,
        url: "/admin/replenishment",
        subitems: [],
      },
      {
        title: t("supplierProductPrice"),
        icon: BadgeDollarSign,
        url: "/admin/supplier/product-price",
        subitems: [],
      },
    ],
  });

  if (!!enableAccounting) {
    allItems.push({
      key: "accounting",
      title: t("accounting"),
      items: [
        {
          title: t("booking"),
          icon: Banknote,
          url: "/admin/accounting/booking",
        },
        {
          title: t("chartOfAccount"),
          icon: FileClock,
          url: "/admin/accounting/chart-of-account",
        },
      ],
    });
  }

  allItems.push({
    key: "report",
    title: t("report"),
    items: [
      {
        title: t("saleReport"),
        icon: LayoutDashboard,
        url: "/admin/reports/sale-report",
        subitems: [],
      },
      {
        title: t("endOfDayReport"),
        icon: Receipt,
        url: "/admin/reports/end-of-day",
        subitems: [],
      },
      {
        title: t("saleItemSummaryReport"),
        icon: ShoppingCart,
        url: "/admin/reports/sale-item-report",
        subitems: [],
      },
      {
        title: t("voidOrderReport"),
        icon: AlertTriangle,
        url: "/admin/reports/void-order",
        subitems: [],
      },
      {
        title: t("guestNumberReport"),
        icon: UsersRound,
        url: "/admin/reports/guest-number",
        subitems: [],
      },
      {
        title: t("expiryReport"),
        icon: Timer,
        url: "/admin/reports/expiry",
        subitems: [],
      },
      {
        title: t("stockReport"),
        icon: Warehouse,
        url: "/admin/reports/stock-report",
        subitems: [],
      },
      ...(type_pos === "CINEMA"
        ? [
            {
              title: t("showtimeSaleReport"),
              icon: Clapperboard,
              url: "/admin/reports/cinema-showtime-sale",
              subitems: [],
            },
          ]
        : []),
    ],
  });

  allItems.push({
    key: "setting",
    title: t("setting"),
    items: [
      {
        title: t("setting"),
        icon: MonitorCog,
        url: "/admin/setting",
        subitems: [],
        // onlyMain: true,
      },
      {
        title: t("users"),
        icon: UsersRound,
        url: "/admin/users",
        subitems: [],
      },
      ...(type_pos === "RESTAURANT"
        ? [
            {
              title: t("delivery"),
              icon: Monitor,
              url: "/admin/delivery",
              subitems: [],
            },
          ]
        : []),
      {
        title: t("paymentMethod"),
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
