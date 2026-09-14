import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export const RegExUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Maps a URL path segment to a key in the "nav" translation namespace.
const segmentToNavKey: Record<string, string> = {
  dashboard: "dashboard",
  "board-member-dashboard": "dashboard",
  product: "products",
  "product-group": "productGroup",
  category: "category",
  discount: "discount",
  modifier: "modifier",
  production: "production",
  warehouse: "warehouse",
  slot: "slot",
  transaction: "transactions",
  order: "customerOrder",
  return: "orderReturn",
  backlog: "backLog",
  shift: "shift",
  supplier: "suppliers",
  "product-price": "supplierProductPrice",
  "purchase-order": "purchaseOrder",
  replenishment: "replenishment",
  accounting: "accounting",
  booking: "booking",
  "chart-of-account": "chartOfAccount",
  reports: "report",
  "sale-report": "saleReport",
  "end-of-day": "endOfDayReport",
  "sale-item-report": "saleItemSummaryReport",
  "void-order": "voidOrderReport",
  "guest-number": "guestNumberReport",
  expiry: "expiryReport",
  "stock-report": "stockReport",
  "cinema-showtime-sale": "showtimeSaleReport",
  setting: "setting",
  payment: "paymentMethod",
  users: "users",
  delivery: "delivery",
  restaurant: "tables",
  transfer: "findingAndTransfer",
  cinema: "cinema",
};

export function CommonBreadcrumb() {
  const paths = usePathname();
  const t = useTranslations("nav");

  function generateBreadcrumbs() {
    const asPathWithoutQuery = paths.split("?")[0];

    const asPathNestedRoutes = asPathWithoutQuery
      .split("/")
      .filter((v) => v.length > 0);

    const crumblist = asPathNestedRoutes
      .map((subpath, idx) => {
        const href = "/" + asPathNestedRoutes.slice(0, idx + 1).join("/");
        const navKey = segmentToNavKey[subpath];
        // @ts-expect-error -- runtime-checked key, not statically known
        const title = navKey ? t(navKey) : subpath.split("-").join(" ");
        return { href, text: title };
      })
      .filter(
        (f) =>
          !["admin", "ims", "ibm", "a"].includes(
            f.text.toString().toLowerCase(),
          ),
      )
      .filter((f) => !f.text.toString().match(RegExUUID));

    return [{ href: "/", text: t("dashboard") || "Home" }, ...crumblist];
  }

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {breadcrumbs.map((path, idx) => {
          if (idx === breadcrumbs.length - 1) {
            return (
              <BreadcrumbItem key={idx}>
                <BreadcrumbPage className="capitalize">
                  {path.text.split("-").join(" ")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            );
          }
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={path.href} className="capitalize">
                    {path.text}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
