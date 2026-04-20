"use client";

import {
  useQuerySupplierList,
  useCreateSupplier,
  useQuerySearchSupplier,
  useQuerySupplierById,
} from "@/app/hooks/use-query-supplier";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "./ui/material-input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Supplier } from "@/lib/server-functions/supplier";
import { Check, Plus } from "lucide-react";
import { useDebouncedValue } from "./use-debounce";

interface Props {
  value?: string;
  onChange?: (supplier: Supplier | null) => void;
  allowCreateNew?: boolean;
  error?: string;
  required?: boolean;
  variant?: "default" | "standard";
  className?: string;
}

const LIMIT = 100;
const OFFSET = 0;

export default function SupplierPicker({
  value,
  onChange,
  allowCreateNew = false,
  error,
  required = true,
  variant,
  className,
}: Props) {
  const ref = useRef<MaterialInputRef>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [isConsignmentCreate, setIsConsignmentCreate] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { supplier: initialSuppliers } = useQuerySupplierList(LIMIT, OFFSET);
  const [trigger, { data: searchSupplierData }] = useQuerySearchSupplier(
    LIMIT,
    OFFSET,
    debouncedSearch
  );
  const { supplier: selectedSupplier } = useQuerySupplierById(value || "");
  const { trigger: createSupplier, isMutating: isCreating } =
    useCreateSupplier();

  useEffect(() => {
    if (value) {
      // First try to find in initial suppliers
      let supplierData = initialSuppliers?.find((s) => s.id === value);

      // If not found in initial suppliers, use the selectedSupplier from API
      if (!supplierData && selectedSupplier) {
        supplierData = selectedSupplier;
      }

      if (supplierData && supplierData.name) {
        setSearch(supplierData.name);
      }
    } else {
      setSearch("");
    }
  }, [value, initialSuppliers, selectedSupplier]);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim()) {
      setLoading(true);
      trigger().finally(() => setLoading(false));
    }
  }, [debouncedSearch, trigger]);

  const onTextChange = useCallback(
    (value: string) => {
      setSearch(value || "");
      // Reset justCreated flag when user starts typing again
      if (justCreated && value !== search) {
        setJustCreated(false);
      }
      // Reset consignment option when starting new search
      if (value !== search) {
        setIsConsignmentCreate(false);
      }
    },
    [justCreated, search]
  );

  const filteredItems = useMemo(() => {
    if (debouncedSearch && debouncedSearch.trim()) {
      return searchSupplierData?.result?.data ?? [];
    }
    return initialSuppliers ?? [];
  }, [debouncedSearch, searchSupplierData, initialSuppliers]);

  const onSelectItem = useCallback(
    (item: Supplier) => {
      const isCurrentlySelected = value === item.id;
      if (isCurrentlySelected) {
        ref.current?.focus();
        setSearch("");
        onChange?.(null);
      } else {
        setSearch(item.name || "");
        onChange?.(item);
      }
    },
    [onChange, value]
  );

  const { mutate: mutateSupplierList } = useQuerySupplierList(LIMIT, OFFSET);

  const handleCreateSupplier = useCallback(async () => {
    if (!search.trim()) return;

    try {
      const newSupplier = await createSupplier({
        name: search.trim(),
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
        note: "",
        isConsignment: isConsignmentCreate,
      });

      // Auto-select the newly created supplier
      if (newSupplier) {
        // Use the same selection logic as when selecting from dropdown
        setSearch(newSupplier.name || "");
        onChange?.(newSupplier);
        // Mark that we just created a supplier to temporarily hide create button
        setJustCreated(true);
        // Reset consignment checkbox
        setIsConsignmentCreate(false);
        // Refresh the supplier list to include the new supplier
        setTimeout(() => {
          mutateSupplierList();
        }, 50);
        // Reset the justCreated flag after a short delay
        setTimeout(() => {
          setJustCreated(false);
        }, 1000);
        // Note: Dropdown will close naturally when user clicks elsewhere or continues workflow
      }
    } catch (error) {
      console.error("Failed to create supplier:", error);
    }
  }, [
    search,
    createSupplier,
    onChange,
    mutateSupplierList,
    isConsignmentCreate,
  ]);

  const renderItem = useCallback(
    ({ item }: MaterialRenderItemInfo<Supplier>) => {
      const active = value === item.id;
      return (
        <div className="text-sm flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            {item.name}
            {item.isConsignment && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                CONG
              </span>
            )}
          </div>
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
    // Don't show create button if the current search matches the selected supplier
    !(
      value &&
      initialSuppliers?.find((s) => s.id === value)?.name === search.trim()
    );

  const createButton = showCreateButton ? (
    <div className="border-t bg-gray-50 p-3">
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">
          Create new supplier: &ldquo;{search.trim()}&rdquo;
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isConsignmentCreate}
            onChange={(e) => setIsConsignmentCreate(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-gray-600">Consignment supplier</span>
        </label>

        <button
          onClick={handleCreateSupplier}
          disabled={isCreating}
          className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? "Creating..." : "Create Supplier"}
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div>
      <MaterialInput
        value={search}
        label="Supplier"
        onChange={(e) => onTextChange(e.target.value)}
        required={required}
        data={filteredItems}
        renderItem={renderItem}
        onSelectedItem={(item) => {
          onSelectItem(item as Supplier);
        }}
        ref={ref}
        loading={loading || isCreating}
        ListFooterComponent={createButton}
        error={error}
        variant={variant}
        className={className}
      />
    </div>
  );
}
