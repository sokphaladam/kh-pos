"use client";

import { useState, useMemo } from "react";
import { useQueryCategory } from "@/app/hooks/use-query-category";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, X, Layers } from "lucide-react";

interface ReportCategoryPickerProps {
  selectedCategoryIds?: string[];
  onSelectionChange?: (categoryIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ReportCategoryPicker({
  selectedCategoryIds = [],
  onSelectionChange,
  placeholder = "Select categories...",
  className,
}: ReportCategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const LIMIT = 100;
  const OFFSET = 0;
  const { categories: categoryData } = useQueryCategory(
    LIMIT,
    OFFSET,
    undefined,
    undefined,
    false
  );

  const categories = useMemo(() => categoryData?.data || [], [categoryData]);

  const selectedCategories = useMemo(() => {
    return categories.filter((category) =>
      selectedCategoryIds.includes(category.id)
    );
  }, [categories, selectedCategoryIds]);

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    onSelectionChange?.(newSelection);
  };

  const handleRemoveCategory = (categoryId: string) => {
    const newSelection = selectedCategoryIds.filter((id) => id !== categoryId);
    onSelectionChange?.(newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange?.([]);
  };

  const handleSelectAll = () => {
    const allCategoryIds = categories.map((category) => category.id);
    onSelectionChange?.(allCategoryIds);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10 h-auto border-t-0 border-x-0 bg-transparent rounded-none border-b-[1px] dark:border-gray-600 focus:border-primary text-base md:text-sm text-gray-900 focus:outline-none dark:text-white dark:focus:border-primary transition-colors duration-200"
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <Layers className="h-4 w-4 shrink-0" />
              {selectedCategories.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <div className="flex flex-wrap gap-1 flex-1">
                  {selectedCategories.slice(0, 2).map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="text-xs px-2 py-1"
                    >
                      {category.title}
                      <div
                        className="inline-flex items-center justify-center h-4 w-4 hover:bg-muted-foreground/20 rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCategory(category.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </div>
                    </Badge>
                  ))}
                  {selectedCategories.length > 2 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      +{selectedCategories.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex flex-col">
            {/* Action Buttons */}
            <div className="p-3 border-b flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={categories.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedCategoryIds.length === 0}
                >
                  Clear All
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedCategoryIds.length} of {categories.length} selected
              </div>
            </div>

            {/* Category List */}
            <Command>
              <CommandInput
                placeholder="Search categories..."
                className="h-9"
              />
              <CommandList className="max-h-60">
                <CommandEmpty>No categories found.</CommandEmpty>
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <CommandItem
                      key={category.id}
                      value={`${category.title} ${category.description || ""}`}
                      onSelect={() => handleCategoryToggle(category.id)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          handleCategoryToggle(category.id)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{category.title}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
