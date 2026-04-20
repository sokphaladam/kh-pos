import { OrderFilter } from "@/classes/order";
import { endOfDay, startOfDay } from "date-fns";
import { Formatter } from "@/lib/formatter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { type OrderStatus } from "../components/order-status";

/**
 * Custom hook for managing order filters and URL state
 */
export function useOrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current URL parameters
  const getCurrentFilters = useCallback((): OrderFilter => {
    const offset = Number(searchParams.get("offset") || 0);
    const limit = Number(searchParams.get("limit") || 30);
    const status = searchParams.get("status") || undefined;
    const invoiceNo = searchParams.get("invoiceNo") || undefined;
    const shiftId = searchParams.get("shiftId") || undefined;
    const customerPhone = searchParams.get("customerPhone") || undefined;
    const ticketCode = searchParams.get("ticketCode") || undefined;

    // Default to today if no dates are specified
    const now = new Date();
    const defaultStartDate = Formatter.dateTime(startOfDay(now)) || "";
    const defaultEndDate = Formatter.dateTime(endOfDay(now)) || "";

    const startDate = searchParams.get("startDate") || defaultStartDate;
    const endDate = searchParams.get("endDate") || defaultEndDate;

    const filters: OrderFilter = { limit, offset };

    if (invoiceNo && invoiceNo.length > 0) {
      filters.invoiceNo = invoiceNo;
      filters.offset = 0; // Reset offset for search
    }

    if (status && status !== "all") {
      filters.status = status as OrderStatus;
    }

    if (startDate) {
      filters.startDate = startDate;
    }

    if (endDate) {
      filters.endDate = endDate;
    }

    if (shiftId) {
      filters.shiftId = shiftId;
    }

    if (customerPhone) {
      filters.customerPhone = customerPhone;
    }

    if (ticketCode) {
      filters.ticketCode = ticketCode;
    }

    return filters;
  }, [searchParams]);

  // Update filters and URL
  const updateFilters = useCallback(
    (newFilters: OrderFilter) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update URL parameters
      params.set("limit", String(newFilters.limit || 30));
      params.set("offset", String(newFilters.offset || 0));

      if (newFilters.status) {
        params.set("status", newFilters.status);
      } else {
        params.delete("status");
      }

      if (newFilters.invoiceNo) {
        params.set("invoiceNo", newFilters.invoiceNo);
      } else {
        params.delete("invoiceNo");
      }

      if (newFilters.startDate) {
        params.set("startDate", newFilters.startDate);
      } else {
        params.delete("startDate");
      }

      if (newFilters.endDate) {
        params.set(
          "endDate",
          newFilters.endDate.split(" ").at(0) + " 23:59:59",
        );
      } else {
        params.delete("endDate");
      }

      if (newFilters.shiftId) {
        params.set("shiftId", newFilters.shiftId);
      } else {
        params.delete("shiftId");
      }

      if (newFilters.customerPhone) {
        params.set("customerPhone", newFilters.customerPhone);
      } else {
        params.delete("customerPhone");
      }

      if (newFilters.ticketCode) {
        params.set("ticketCode", newFilters.ticketCode);
      } else {
        params.delete("ticketCode");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  // Reset all filters to default
  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    const now = new Date();
    params.set("limit", "30");
    params.set("offset", "0");
    params.set("startDate", Formatter.dateTime(startOfDay(now)) || "");
    params.set("endDate", Formatter.dateTime(endOfDay(now)) || "");
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  // Get current page info
  const getCurrentPage = useCallback(() => {
    const offset = Number(searchParams.get("offset") || 0);
    const limit = Number(searchParams.get("limit") || 30);
    return {
      offset,
      limit,
      page: Math.floor(offset / limit) + 1,
    };
  }, [searchParams]);

  // Initialize URL params with defaults if missing
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;

    const hasStartDate = searchParams.has("startDate");
    const hasEndDate = searchParams.has("endDate");
    const hasLimit = searchParams.has("limit");
    const hasOffset = searchParams.has("offset");

    // Only initialize if any core params are missing
    if (!hasStartDate || !hasEndDate || !hasLimit || !hasOffset) {
      isInitialized.current = true;
      const params = new URLSearchParams(searchParams.toString());
      const now = new Date();

      if (!hasLimit) params.set("limit", "30");
      if (!hasOffset) params.set("offset", "0");
      if (!hasStartDate) {
        params.set("startDate", Formatter.dateTime(startOfDay(now)) || "");
      }
      if (!hasEndDate) {
        params.set("endDate", Formatter.dateTime(endOfDay(now)) || "");
      }

      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);

  return {
    filters: getCurrentFilters(),
    updateFilters,
    resetFilters,
    currentPage: getCurrentPage(),
  };
}
