import { OrderFilter } from "@/classes/order";
import { DateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Formatter } from "@/lib/formatter";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { useAuthentication } from "../../../../../contexts/authentication-context";
import { type OrderStatus as OrderStatusType } from "./order-status";

interface OrderFiltersProps {
  filters: OrderFilter;
  onFiltersChange: (filters: OrderFilter) => void;
  onReset: () => void;
}

export function OrderFilters({
  filters,
  onFiltersChange,
  onReset,
}: OrderFiltersProps) {
  const { setting } = useAuthentication();
  const [date, setDate] = useState<DateRange | undefined>({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });
  const [searchValue, setSearchValue] = useState(
    filters.invoiceNo || filters.customerPhone || "",
  );
  const [searchType, setSearchType] = useState<
    "invoice" | "phone" | "ticketCode"
  >(filters.customerPhone ? "phone" : "invoice");
  const { currentShift } = useAuthentication();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      invoiceNo:
        searchType === "invoice" ? searchValue || undefined : undefined,
      customerPhone:
        searchType === "phone" ? searchValue || undefined : undefined,
      ticketCode:
        searchType === "ticketCode" ? searchValue || undefined : undefined,
      status: searchValue ? undefined : filters.status, // Clear status when searching
      offset: 0,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // If user clears the search, restore the previous status filter
    if (!value && (filters.invoiceNo || filters.customerPhone)) {
      onFiltersChange({
        ...filters,
        invoiceNo: undefined,
        customerPhone: undefined,
        ticketCode: undefined,
        offset: 0,
      });
    }
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setDate(dateRange);
    onFiltersChange({
      ...filters,
      startDate: Formatter.dateTime(dateRange?.from) ?? "",
      endDate: Formatter.dateTime(dateRange?.to) ?? "",
      offset: 0,
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === "all" ? undefined : (status as OrderStatusType),
      offset: 0,
    });
  };

  const handleShiftChange = (isEnabled: boolean) => {
    onFiltersChange({
      ...filters,
      shiftId: isEnabled ? currentShift?.shift_id : undefined,
      offset: 0,
    });
  };

  const clearSearch = () => {
    setSearchValue("");
    onFiltersChange({
      ...filters,
      invoiceNo: undefined,
      customerPhone: undefined,
      ticketCode: undefined,
      offset: 0,
    });
  };

  const handleSearchTypeChange = (type: "invoice" | "phone" | "ticketCode") => {
    setSearchType(type);
    if (searchValue) {
      // Re-submit search with new type
      onFiltersChange({
        ...filters,
        invoiceNo: type === "invoice" ? searchValue : undefined,
        customerPhone: type === "phone" ? searchValue : undefined,
        ticketCode: type === "ticketCode" ? searchValue : undefined,
        offset: 0,
      });
    }
  };

  const hasActiveFilters = !!(
    filters.invoiceNo ||
    filters.customerPhone ||
    filters.startDate ||
    filters.endDate ||
    filters.status ||
    filters.shiftId ||
    filters.ticketCode
  );

  const isCinemaMode =
    JSON.parse(
      setting?.data?.result?.find((f) => f.option === "TYPE_POS")?.value ||
        "{}",
    ).system_type === "CINEMA";

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4">
        {/* Single Row Layout for Desktop */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Type and Input */}
          <div className="flex-1 w-full lg:max-w-lg flex gap-2">
            {/* Search Type Selector */}
            <Select value={searchType} onValueChange={handleSearchTypeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice Number</SelectItem>
                <SelectItem value="phone">Customer Phone</SelectItem>
                {isCinemaMode && (
                  <SelectItem value="ticketCode">Ticket Code</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search by ${
                    searchType === "invoice"
                      ? "invoice number"
                      : "customer phone"
                  }...`}
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10 pr-10 w-full"
                />
                {searchValue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-auto lg:w-[140px]">
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shift Filter - Only show when shift is open */}
          {currentShift && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shift-filter"
                checked={!!filters.shiftId}
                onCheckedChange={(checked) => handleShiftChange(!!checked)}
              />
              <label
                htmlFor="shift-filter"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                My Shift Only
              </label>
            </div>
          )}

          {/* Date Range Picker */}
          <div className="w-full sm:w-auto lg:w-auto">
            <DateRangePicker
              dateRange={date}
              onChange={handleDateRangeChange}
              className="w-full"
            />
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="whitespace-nowrap"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
