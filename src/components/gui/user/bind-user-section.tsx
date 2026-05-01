"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Link2 } from "lucide-react";
import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BindUserEntry {
  userId: string;
  warehouseId: string;
  group: number;
  isMain: boolean;
  isNew?: boolean;
}

interface Props {
  mainUserId: string;
  group: number;
  entries: BindUserEntry[];
  onChange: (entries: BindUserEntry[]) => void;
  loading?: boolean;
}

export function BindUserSection({ group, entries, onChange, loading }: Props) {
  const [addingWarehouse, setAddingWarehouse] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const { data: warehouseData } = useWarehouseList(100, 0);
  const warehouses = warehouseData?.result?.data ?? [];

  const getWarehouseName = (wId: string) =>
    warehouses.find((w) => w.id === wId)?.name ?? wId;

  // Warehouses not yet bound
  const availableWarehouses = warehouses.filter(
    (w) => !entries.some((e) => e.warehouseId === w.id),
  );

  const handleAddConfirm = () => {
    if (!selectedWarehouseId) return;
    const newEntry: BindUserEntry = {
      userId: "",
      warehouseId: selectedWarehouseId,
      group,
      isMain: false,
      isNew: true,
    };
    onChange([...entries, newEntry]);
    setSelectedWarehouseId("");
    setAddingWarehouse(false);
  };

  const handleRemove = (warehouseId: string) => {
    onChange(entries.filter((e) => e.warehouseId !== warehouseId));
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-7 w-28 rounded-full bg-muted" />
          <div className="h-7 w-28 rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span>Bind Users</span>
          {entries.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {entries.length}
            </Badge>
          )}
        </div>
        {!addingWarehouse && availableWarehouses.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setAddingWarehouse(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Warehouse
          </Button>
        )}
      </div>

      {/* Existing bindings */}
      {entries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => (
            <div
              key={entry.warehouseId}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                entry.isMain
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : entry.isNew
                    ? "border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-border bg-muted/50 text-foreground"
              }`}
            >
              {entry.isMain && (
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  Main ·{" "}
                </span>
              )}
              <span>{getWarehouseName(entry.warehouseId)}</span>
              {entry.isNew && (
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {" "}
                  · New
                </span>
              )}
              {!entry.isMain && (
                <button
                  type="button"
                  onClick={() => handleRemove(entry.warehouseId)}
                  className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100 hover:text-destructive transition-colors"
                  aria-label={`Remove ${getWarehouseName(entry.warehouseId)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No bound warehouses yet. Add one to allow this user to sign in from
          another warehouse.
        </p>
      )}

      {/* Add warehouse row */}
      {addingWarehouse && (
        <div className="flex items-center gap-2">
          <Select
            value={selectedWarehouseId}
            onValueChange={setSelectedWarehouseId}
          >
            <SelectTrigger className="h-8 flex-1 text-sm">
              <SelectValue placeholder="Select a warehouse…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Available warehouses</SelectLabel>
                {availableWarehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8"
            onClick={handleAddConfirm}
            disabled={!selectedWarehouseId}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setAddingWarehouse(false);
              setSelectedWarehouseId("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
