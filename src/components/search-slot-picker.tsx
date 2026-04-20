import useDebounce from "@/app/hooks/use-debounce";
import { useQuerySearchSlot } from "@/app/hooks/use-query-slot";
import {
  MaterialInput,
  MaterialInputRef,
  MaterialRenderItemInfo,
} from "@/components/ui/material-input";
import { useCallback, useRef, useState, useEffect } from "react";
import { SlotDetail } from "@/classes/slot";
import { useAuthentication } from "../../contexts/authentication-context";

interface Props {
  warehouseId?: string;
  value?: string;
  selectedSlot?: SlotDetail;
  onChange?: (slote: SlotDetail | undefined) => void;
}

export default function SearchSlotPicker({
  onChange,
  warehouseId,
  value,
  selectedSlot: propSelectedSlot,
}: Props) {
  const valueRef = useRef<string>(value ?? "");
  const [search, setSearch] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SlotDetail | undefined>(
    propSelectedSlot
  );
  const [error, setError] = useState<string>();

  const ref = useRef<MaterialInputRef>(null);

  const { currentWarehouse } = useAuthentication();
  const [trigger, { data }] = useQuerySearchSlot({
    keyword: search,
    warehouseId: warehouseId ?? currentWarehouse?.id,
  });

  const [loading, setLoading] = useState(false);

  const debounceSearch = useDebounce(800);

  // Handle value prop changes from parent
  useEffect(() => {
    if (value !== undefined && value !== valueRef.current) {
      valueRef.current = value;
      // Clear selected slot if value is empty
      if (!value) {
        setSelectedSlot(undefined);
        setError(undefined);
      }
    }
  }, [value]);

  // Handle selectedSlot prop changes from parent
  useEffect(() => {
    if (propSelectedSlot !== selectedSlot) {
      setSelectedSlot(propSelectedSlot);
      if (propSelectedSlot) {
        valueRef.current = propSelectedSlot.name;
        setError(undefined);
      }
    }
  }, [propSelectedSlot, selectedSlot]);

  const handleSearch = useCallback(
    (value: string) => {
      valueRef.current = value;
      setSearch(value);
      if (!value.trim()) return;
      setLoading(true);
      debounceSearch(() =>
        trigger().finally(() => {
          ref.current?.focus();
          setLoading(false); // Reset loading state after the debounce delay.
        })
      );
    },
    [debounceSearch, trigger]
  );

  const onSelectItem = useCallback(
    (item: SlotDetail) => {
      valueRef.current = item.name;
      setError(undefined);
      setSelectedSlot(item);
      onChange?.(item);
    },
    [onChange]
  );

  const renderItem = useCallback(
    ({ item }: MaterialRenderItemInfo<SlotDetail>) => {
      return (
        <div className="text-sm font-normal">
          {item.name} {item.posSlot ? "(POS)" : ""}
          <br />
        </div>
      );
    },
    []
  );

  const onFocus = useCallback(() => {
    if (error) {
      setError(undefined);
    }
    setLoading(true);
    trigger()
      .then(() => {
        setLoading(false);
        ref.current?.onOpen();
      })
      .catch(() => setLoading(false));
  }, [trigger, error]);

  return (
    <MaterialInput
      ref={ref}
      animate="none"
      error={error}
      label="Select Slot"
      data={data?.result?.data}
      value={valueRef.current}
      loading={loading}
      onChange={(e) => handleSearch(e.target.value)}
      onSelectedItem={(item) => onSelectItem(item as SlotDetail)}
      renderItem={renderItem}
      onFocus={onFocus}
    />
  );
}
