"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Filter, Search, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface Props {
  filters: {
    limit: number;
    offset: number;
    status?: string[];
    date?: string;
    search?: string;
  };
  onFiltersChange: (filters: {
    limit?: number;
    offset?: number;
    status?: string[];
    date?: string;
    search?: string;
  }) => void;
  onReset: () => void;
}

const statusOptions = [
  { value: "confirmed", label: "Confirmed", color: "bg-green-500" },
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { value: "checked_in", label: "Checked In", color: "bg-blue-500" },
  { value: "no_show", label: "No Show", color: "bg-gray-500" },
];

export function TicketReservationFilter({
  filters,
  onFiltersChange,
  onReset,
}: Props) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    filters.date ? new Date(filters.date) : undefined
  );
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onFiltersChange({ search: value || undefined });
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    onFiltersChange({ date: date ? format(date, "yyyy-MM-dd") : undefined });
  };

  const handleStatusToggle = (statusValue: string) => {
    const currentStatus = filters.status || [];
    const updatedStatus = currentStatus.includes(statusValue)
      ? currentStatus.filter((s) => s !== statusValue)
      : [...currentStatus, statusValue];

    onFiltersChange({
      status: updatedStatus.length > 0 ? updatedStatus : undefined,
    });
  };

  const handleStatusClearAll = () => {
    onFiltersChange({ status: undefined });
  };

  const handleStatusSelectAll = () => {
    onFiltersChange({ status: statusOptions.map((s) => s.value) });
  };

  const handleReset = () => {
    setSearchValue("");
    setSelectedDate(undefined);
    onReset();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.date) count++;
    if (filters.status && filters.status.length > 0) count++;
    return count;
  };

  const selectedStatuses = filters.status || [];
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Reservations
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Search by customer phone"
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <DatePicker
              initialValue={selectedDate}
              onChange={handleDateChange}
              variant="standard"
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Popover
              open={isStatusPopoverOpen}
              onOpenChange={setIsStatusPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isStatusPopoverOpen}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {selectedStatuses.length === 0
                      ? "All Status"
                      : selectedStatuses.length === 1
                      ? statusOptions.find(
                          (s) => s.value === selectedStatuses[0]
                        )?.label
                      : `${selectedStatuses.length} selected`}
                  </span>
                  <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm">Filter by Status</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStatusSelectAll}
                        className="h-7 px-2 text-xs"
                      >
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStatusClearAll}
                        className="h-7 px-2 text-xs"
                      >
                        None
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <div
                        key={status.value}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => handleStatusToggle(status.value)}
                      >
                        <Checkbox
                          checked={selectedStatuses.includes(status.value)}
                          onChange={() => handleStatusToggle(status.value)}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full ${status.color}`}
                          />
                          <span className="text-sm">{status.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedStatuses.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-500 mb-2">
                        Selected:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedStatuses.map((statusValue) => {
                          const status = statusOptions.find(
                            (s) => s.value === statusValue
                          );
                          return status ? (
                            <Badge
                              key={statusValue}
                              variant="secondary"
                              className="text-xs px-2 py-1"
                            >
                              {status.label}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusToggle(statusValue);
                                }}
                                className="ml-1 hover:bg-gray-300 rounded-sm"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">
                Active Filters:
              </span>

              {filters.search && (
                <Badge
                  variant="outline"
                  className="text-blue-700 border-blue-300"
                >
                  Search: &quot;{filters.search}&quot;
                  <button
                    onClick={() => {
                      setSearchValue("");
                      onFiltersChange({ search: undefined });
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.date && (
                <Badge
                  variant="outline"
                  className="text-blue-700 border-blue-300"
                >
                  Date: {format(new Date(filters.date), "MMM dd, yyyy")}
                  <button
                    onClick={() => {
                      setSelectedDate(undefined);
                      onFiltersChange({ date: undefined });
                    }}
                    className="ml-1 hover:bg-gray-300 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {selectedStatuses.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-blue-700 border-blue-300"
                >
                  Status: {selectedStatuses.length} selected
                  <button
                    onClick={handleStatusClearAll}
                    className="ml-1 hover:bg-gray-300 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
