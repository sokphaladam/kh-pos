import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { TransactionList } from "./transaction-list";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "ALL";
  const limit = Number(searchParams.get("limit") || 30);

  const onSelectedStatus = useCallback(
    (value: string) => {
      const params = new URLSearchParams({
        limit: limit + "",
        offset: "0",
        ...(value && value !== "ALL" && { status: value }),
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [limit, pathname, router]
  );

  const tabs = useMemo(
    () => [
      {
        content: "All Transactions",
        value: "ALL",
      },
      {
        content: "Product Sale",
        value: "SALE",
      },
      {
        content: "Purchase Order",
        value: "PURCHASE",
      },
      {
        content: "Stock In",
        value: "STOCK_IN",
      },
      {
        content: "Stock Out",
        value: "STOCK_OUT",
      },
      {
        content: "Adjustment In",
        value: "ADJUSTMENT_IN",
      },
      {
        content: "Adjustment Out",
        value: "ADJUSTMENT_OUT",
      },
      {
        content: "Replenishment In",
        value: "REPLENISHMENT",
      },
      {
        content: "Replenishment Out",
        value: "REPLENISHMENT_OUT",
      },
      {
        content: "Compose In",
        value: "COMPOSE_IN",
      },
      {
        content: "Compose Out",
        value: "COMPOSE_OUT",
      },
      {
        content: "Transfer In",
        value: "TRANSFER_IN",
      },
      {
        content: "Transfer Out",
        value: "TRANSFER_OUT",
      },
      {
        content: "Conversion In",
        value: "CONVERSION_IN",
      },
      {
        content: "Conversion Out",
        value: "CONVERSION_OUT",
      },
      {
        content: "Damage",
        value: "DAMAGE",
      },
      {
        content: "Return",
        value: "RETURN",
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <Select value={status} onValueChange={onSelectedStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="No filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Status</SelectLabel>
            {tabs.map((tab, index) => {
              return (
                <SelectItem key={index} value={tab.value as string}>
                  {tab.content}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="mt-4">
        <TransactionList />
      </div>
    </div>
  );
}
