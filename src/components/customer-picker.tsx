"use client";

import {
  useLazyQueryCustomer,
  useMutationCreateCustomer,
} from "@/app/hooks/use-query-customer";
import { Customer } from "@/classes/customer";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "./ui/material-input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, User } from "lucide-react";
import { useDebouncedValue } from "./use-debounce";
import { Order } from "@/classes/order";

interface CustomerPickerProps {
  value?: Customer;
  onChange?: (customer: Customer | null) => void;
  allowCreateNew?: boolean;
  error?: string;
  required?: boolean;
  variant?: "default" | "standard";
  className?: string;
  label?: string;
  autoLeadingZero?: boolean;
  onCustomerOrder?: (order: Order | null) => void;
}

const LIMIT = 5;
const OFFSET = 0;

export function CustomerPicker({
  value,
  onChange,
  allowCreateNew = false,
  error,
  required = false,
  variant,
  className,
  label,
  autoLeadingZero = false,
}: CustomerPickerProps) {
  const ref = useRef<MaterialInputRef>(null);
  const [search, setSearch] = useState(
    value?.phone || value?.customerName || "",
  );
  const [loading, setLoading] = useState(true);
  const [justCreated, setJustCreated] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const [triggerSearch, { data, isLoading }] = useLazyQueryCustomer(
    LIMIT,
    OFFSET,
    debouncedSearch || undefined,
  );

  const createCustomerMutation = useMutationCreateCustomer();

  // Find selected customer from the data
  const selectedCustomer = useMemo(() => {
    if (!value || !data?.result?.data) return null;
    return (
      data.result.data.find((customer) => customer.id === value.id) || null
    );
  }, [value, data?.result?.data]);

  useEffect(() => {
    if (value && selectedCustomer && !isUserTyping) {
      setSearch(
        selectedCustomer.phone
          ? selectedCustomer.phone
          : selectedCustomer.customerName || "",
      );
    } else if (!value && !isUserTyping) {
      setSearch("");
    }
  }, [value, selectedCustomer, isUserTyping]);

  useEffect(() => {
    if (
      debouncedSearch &&
      debouncedSearch.trim() &&
      debouncedSearch.length >= 5
    ) {
      setLoading(true);
      triggerSearch().finally(() => setLoading(false));
    }
  }, [debouncedSearch, triggerSearch]);

  const customers = data?.result?.data || [];

  const onTextChange = useCallback(
    (value: string) => {
      setIsUserTyping(true);
      // Auto-prepend "0" when input starts with a non-zero digit (phone number)
      const normalized =
        autoLeadingZero && /^[1-9]/.test(value) ? "0" + value : value;
      setSearch(normalized || "");

      // Reset justCreated flag when user starts typing again
      if (justCreated && normalized !== search) {
        setJustCreated(false);
      }

      // If user clears the input, clear the selected customer
      if (!normalized || normalized.trim() === "") {
        onChange?.(null);
      }
    },
    [justCreated, search, onChange, autoLeadingZero],
  );

  const onSelectItem = useCallback(
    (item: Customer) => {
      const isCurrentlySelected = value?.id === item.id;
      setIsUserTyping(false);

      if (isCurrentlySelected) {
        ref.current?.focus();
        setSearch("");
        onChange?.(null);
      } else {
        setSearch(item.customerName || item.phone || "");
        onChange?.(item);
      }
    },
    [onChange, value],
  );

  const handleCreateCustomer = useCallback(async () => {
    if (!search.trim()) return;

    try {
      const result = await createCustomerMutation.trigger({
        customerName: search.trim(),
        phone: search.trim(),
        address: "",
      });

      // Auto-select the newly created customer
      if (result.success) {
        setIsUserTyping(false);

        // Create a customer object with the data we have
        const newCustomer: Customer = {
          id: result.result as string, // Assuming the API returns the new customer ID
          customerName: search.trim(),
          phone: search.trim(),
          address: "",
          createdAt: new Date().toISOString(),
          createdBy: null,
          warehouse: null,
          orders: [],
          extraPrice: "0",
          type: "general",
        };

        setSearch(newCustomer.customerName || newCustomer.phone || "");
        onChange?.(newCustomer);
        setJustCreated(true);

        // Refresh the customer list to include the new customer
        setTimeout(() => {
          triggerSearch();
        }, 50);

        // Reset the justCreated flag after a short delay
        setTimeout(() => {
          setJustCreated(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
    }
  }, [search, createCustomerMutation, onChange, triggerSearch]);

  const renderItem = useCallback(
    ({ item }: MaterialRenderItemInfo<Customer>) => {
      const active = value?.id === item.id;
      return (
        <div className="text-sm flex flex-row items-center justify-between gap-2 cursor-pointer">
          <div className="flex flex-row items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium truncate text-sm">
                {item.customerName || item.phone}
              </span>
              {item.customerName && (
                <span className="text-xs text-muted-foreground">
                  {item.phone}
                </span>
              )}
            </div>
          </div>
          {active && <Check className="w-4 h-4" />}
        </div>
      );
    },
    [value],
  );

  const showCreateButton =
    allowCreateNew &&
    search &&
    search.trim() &&
    customers.length === 0 &&
    !loading &&
    !createCustomerMutation.isMutating &&
    !justCreated &&
    // Don't show create button if the current search matches the selected customer
    !(
      value &&
      selectedCustomer &&
      (selectedCustomer.customerName === search.trim() ||
        selectedCustomer.phone === search.trim())
    );

  const createButton = showCreateButton ? (
    <div className="border-t bg-gray-50 p-3">
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">
          Create new customer: &ldquo;{search.trim()}&rdquo;
        </div>

        <button
          onClick={handleCreateCustomer}
          disabled={createCustomerMutation.isMutating}
          className="w-full py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {createCustomerMutation.isMutating
            ? "Creating..."
            : "Create Customer"}
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="relative">
      <MaterialInput
        value={search}
        label={label ?? "Customer"}
        onChange={(e) => onTextChange(e.target.value)}
        required={required}
        data={customers}
        renderItem={renderItem}
        onSelectedItem={(item) => {
          onSelectItem(item as Customer);
        }}
        ref={ref}
        loading={loading || isLoading || createCustomerMutation.isMutating}
        ListFooterComponent={createButton}
        error={error}
        variant={variant}
        className={className}
      />
    </div>
  );
}
