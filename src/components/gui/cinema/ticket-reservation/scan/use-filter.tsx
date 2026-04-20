import moment from "moment-timezone";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useFilterReservation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getCurrentFilters = () => {
    const offset = Number(searchParams.get("offset") || 0);
    const limit = Number(searchParams.get("limit") || 30);
    const statusParam = searchParams.get("status") || undefined;
    const date = searchParams.get("date") || moment().format("YYYY-MM-DD");

    const status = statusParam
      ? (statusParam.split(",") as string[])
      : undefined;

    return {
      limit,
      offset,
      status,
      date,
    };
  };

  const updateFilters = (filters: {
    limit?: number;
    offset?: number;
    status?: string[];
    date?: string;
  }) => {
    const params = new URLSearchParams();

    if (filters.limit !== undefined) {
      params.append("limit", filters.limit.toString());
    } else {
      params.append("limit", getCurrentFilters().limit.toString());
    }

    if (filters.offset !== undefined) {
      params.append("offset", filters.offset.toString());
    } else {
      params.append("offset", getCurrentFilters().offset.toString());
    }

    if (filters.date !== undefined) {
      params.append("date", filters.date);
    } else if (getCurrentFilters().date) {
      params.append("date", getCurrentFilters().date!);
    }

    if (filters.status !== undefined && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    } else if (getCurrentFilters().status) {
      params.append("status", getCurrentFilters().status!.join(","));
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    const now = new Date();
    params.set("limit", "30");
    params.set("offset", "0");
    params.set("date", moment(now).format("YYYY-MM-DD"));
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  const getCurrentPage = useCallback(() => {
    const offset = Number(searchParams.get("offset") || 0);
    const limit = Number(searchParams.get("limit") || 30);
    return {
      offset,
      limit,
      page: Math.floor(offset / limit) + 1,
    };
  }, [searchParams]);

  return {
    filters: getCurrentFilters(),
    updateFilters,
    resetFilters,
    currentPage: getCurrentPage(),
  };
}
