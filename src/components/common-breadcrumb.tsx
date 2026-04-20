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

export const RegExUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function CommonBreadcrumb() {
  const paths = usePathname();

  function generateBreadcrumbs() {
    const asPathWithoutQuery = paths.split("?")[0];

    const asPathNestedRoutes = asPathWithoutQuery
      .split("/")
      .filter((v) => v.length > 0);

    const crumblist = asPathNestedRoutes
      .map((subpath, idx) => {
        const href = "/" + asPathNestedRoutes.slice(0, idx + 1).join("/");
        const title = subpath;
        return { href, text: title };
      })
      .filter((f) => !["admin", "ims", "ibm", "a"].includes(f.text))
      .filter((f) => !f.text.match(RegExUUID));

    return [{ href: "/", text: "Home" }, ...crumblist];
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
