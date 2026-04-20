"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useQueryCategory,
  useQuerySearchCategory,
  useCreateCategory,
  useQueryCategoryById,
} from "@/app/hooks/use-query-category";
import { Category } from "@/lib/server-functions/category/create-category";
import { Check, Plus } from "lucide-react";
import { useDebouncedValue } from "@/components/use-debounce";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "@/components/ui/material-input";

interface Props {
  value?: string;
  onChange?: (category: Category | null) => void;
  allowCreateNew?: boolean;
  onlyBindedToPrinter?: boolean;
}

const LIMIT = 100;
const OFFSET = 0;

export function ProductCategoryPicker({
  value,
  onChange,
  allowCreateNew = true,
  onlyBindedToPrinter = false,
}: Props) {
  const ref = useRef<MaterialInputRef>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [newlyCreatedCategory, setNewlyCreatedCategory] =
    useState<Category | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { categories: initialCategories, mutate: mutateCategories } =
    useQueryCategory(LIMIT, OFFSET, undefined, undefined, onlyBindedToPrinter);
  const [trigger, { data: searchCategoryData }] = useQuerySearchCategory(
    LIMIT,
    OFFSET,
    debouncedSearch,
    onlyBindedToPrinter
  );
  const { category: selectedCategory } = useQueryCategoryById(value || "");
  const { trigger: createCategory, isMutating: isCreating } =
    useCreateCategory();

  useEffect(() => {
    if (value) {
      // First try to find in initial categories
      let categoryData = initialCategories?.data?.find((c) => c.id === value);

      // If not found in initial categories, try newly created category
      if (
        !categoryData &&
        newlyCreatedCategory &&
        newlyCreatedCategory.id === value
      ) {
        categoryData = newlyCreatedCategory;
      }

      // If still not found, use the selectedCategory from API
      if (!categoryData && selectedCategory) {
        categoryData = selectedCategory;
      }

      if (categoryData && categoryData.title) {
        setSearch(categoryData.title);
      }
    } else {
      setSearch("");
    }
  }, [value, initialCategories, selectedCategory, newlyCreatedCategory]);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim()) {
      setLoading(true);
      trigger().finally(() => setLoading(false));
    }
  }, [debouncedSearch, trigger]);

  const onTextChange = useCallback(
    (value: string) => {
      setSearch(value || "");
      if (value === "") {
        onChange?.(null);
      }
      // Reset justCreated flag when user starts typing again
      if (justCreated && value !== search) {
        setJustCreated(false);
      }
    },
    [justCreated, search, onChange]
  );

  const filteredItems = useMemo(() => {
    if (debouncedSearch && debouncedSearch.trim()) {
      return searchCategoryData?.result?.data ?? [];
    }
    return initialCategories?.data ?? [];
  }, [debouncedSearch, searchCategoryData, initialCategories]);

  const onSelectItem = useCallback(
    (category: Category) => {
      const isCurrentlySelected = value === category.id;
      if (isCurrentlySelected) {
        ref.current?.focus();
        setSearch("");
        onChange?.(null);
      } else {
        setSearch(category.title || "");
        onChange?.(category);
      }
    },
    [onChange, value]
  );

  const handleCreateCategory = useCallback(async () => {
    if (!search.trim()) return;

    try {
      const { result: newCategory } = await createCategory({
        title: search.trim(),
        description: "",
        imageUrl: null,
        parentId: null,
        printerId: null,
      });

      // Auto-select the newly created category
      if (newCategory) {
        // Store the newly created category for immediate access
        setNewlyCreatedCategory(newCategory);
        // Use the same selection logic as when selecting from dropdown
        setSearch(newCategory.title || "");
        onChange?.(newCategory);
        // Mark that we just created a category to temporarily hide create button
        setJustCreated(true);
        // Refresh the category list to include the new category
        setTimeout(() => {
          mutateCategories();
          // Clear the newly created category after refresh
          setNewlyCreatedCategory(null);
        }, 50);
        // Reset the justCreated flag after a short delay
        setTimeout(() => {
          setJustCreated(false);
        }, 1000);
        // Note: Dropdown will close naturally when user clicks elsewhere or continues workflow
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }, [search, createCategory, onChange, mutateCategories]);

  const renderItem = useCallback(
    ({ item }: MaterialRenderItemInfo<Category>) => {
      const active = value === item.id;
      return (
        <div className="text-sm flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">{item.title}</div>
          {active && <Check className="w-4 h-4" />}
        </div>
      );
    },
    [value]
  );

  const showCreateButton =
    allowCreateNew &&
    search &&
    search.trim() &&
    filteredItems.length === 0 &&
    !loading &&
    !isCreating &&
    !justCreated &&
    // Don't show create button if the current search matches the selected category
    !(
      value &&
      (initialCategories?.data?.find((c) => c.id === value)?.title ===
        search.trim() ||
        selectedCategory?.title === search.trim())
    );

  const createButton = showCreateButton ? (
    <div className="border-t bg-gray-50 p-3">
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">
          Create new category: &ldquo;{search.trim()}&rdquo;
        </div>

        <button
          onClick={handleCreateCategory}
          disabled={isCreating}
          className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? "Creating..." : "Create Category"}
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="w-[300px]">
      <MaterialInput
        value={search}
        label="Category"
        onChange={(e) => onTextChange(e.target.value)}
        required
        data={filteredItems}
        renderItem={renderItem}
        onSelectedItem={(item) => {
          onSelectItem(item as Category);
        }}
        ref={ref}
        loading={loading || isCreating}
        ListFooterComponent={createButton}
      />
    </div>
  );
}
