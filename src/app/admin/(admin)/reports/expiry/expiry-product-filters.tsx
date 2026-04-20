import { ExpiryFilters } from "@/classes/reports/product-expiry";
import { Slot } from "@/dataloader/slot-loader";
import { ProductCategory } from "@/repository/product-category-repository";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Building2, Tag, Check, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  slots: Slot[];
  categories: ProductCategory[];
  selectedSlot?: string;
  selectedCategory?: string;
  filters: ExpiryFilters;
  onChange: (filters: ExpiryFilters) => void;
}

export default function ExpiryProductFilters({
  slots,
  categories,
  filters,
  onChange,
}: Props) {
  const handleSlotSelect = (slotId: string) => {
    const newSlotId = slotId === "all" ? undefined : slotId;
    onChange({ ...filters, slotId: newSlotId });
  };

  const handleCategorySelect = (categoryId: string) => {
    const newCategoryId = categoryId === "all" ? undefined : categoryId;
    onChange({ ...filters, categoryId: newCategoryId });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value || undefined;
    onChange({ ...filters, search });
  };

  const clearAllFilters = () => {
    onChange({
      ...filters,
      search: undefined,
      slotId: undefined,
      categoryId: undefined,
    });
  };

  const hasActiveFilters =
    filters.search || filters.slotId || filters.categoryId;
  const selectedSlot = slots.find((s) => s.id === filters.slotId);
  const selectedCategory = categories.find(
    (c) => c.categoryId === filters.categoryId
  );

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Search className="w-4 h-4 mr-1 text-gray-600" />
          Search:
        </label>
        <Input
          type="text"
          placeholder="Search products..."
          value={filters.search || ""}
          onChange={handleSearchChange}
          className="min-w-[200px] h-9"
        />
      </div>

      {/* Slot Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Building2 className="w-4 h-4 mr-1 text-blue-600" />
          Slot:
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[140px] justify-between text-sm"
            >
              <span className="truncate">
                {selectedSlot ? selectedSlot.name : "All Slots"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuItem
              onClick={() => handleSlotSelect("all")}
              className="flex items-center justify-between"
            >
              <span>All Slots</span>
              {!filters.slotId && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            {slots.map((slot) => (
              <DropdownMenuItem
                key={slot.id}
                onClick={() => handleSlotSelect(slot.id)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{slot.name}</span>
                {filters.slotId === slot.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Tag className="w-4 h-4 mr-1 text-green-600" />
          Category:
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[140px] justify-between text-sm"
            >
              <span className="truncate">
                {selectedCategory ? selectedCategory.title : "All Categories"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuItem
              onClick={() => handleCategorySelect("all")}
              className="flex items-center justify-between"
            >
              <span>All Categories</span>
              {!filters.categoryId && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.categoryId}
                onClick={() => handleCategorySelect(category.categoryId!)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{category.title}</span>
                {filters.categoryId === category.id && (
                  <Check className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <>
          <div className="flex items-center gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                <Search className="w-3 h-3 mr-1" />
                &quot;{filters.search}&quot;
              </span>
            )}
            {filters.slotId && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                <Check className="w-3 h-3 mr-1" />
                {selectedSlot?.name || "Unknown"}
              </span>
            )}
            {filters.categoryId && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                {selectedCategory?.title || "Unknown"}
              </span>
            )}
          </div>

          {/* Clear All Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
