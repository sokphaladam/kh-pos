import { ResponseType } from "@/lib/types";
import type { MenuAnalysis } from "@/classes/menu-analysis";
import type { MenuAnalysisInput } from "../api/report/menu-analysis/route";
import { useGenericSWR } from "./use-generic";

export function useQueryMenuAnalysis({ from, to, categoryId }: MenuAnalysisInput) {
  const params = new URLSearchParams({ from, to });
  if (categoryId) params.set("categoryId", categoryId);
  return useGenericSWR<ResponseType<MenuAnalysis>>(
    `/api/report/menu-analysis?${params.toString()}`,
  );
}
