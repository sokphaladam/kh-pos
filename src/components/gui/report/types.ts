import { DateRange } from "react-day-picker";

export interface ReportDataItem {
  id: string;
  date: string;
  revenue: number;
  qty: number;
  profit: number;
  category?: string;
  product?: string;
  user?: string;
}

export interface ReportFilters {
  dateRange: DateRange | undefined;
  userIds: string[];
  categoryId: string[];
  productId: string | null;
  viewValue: "revenue" | "qty" | "profit";
  groupBy?: "product" | "time";
  warehouseIds?: string[];
}

// Re-export DateRange from react-day-picker for convenience
export type { DateRange } from "react-day-picker";
