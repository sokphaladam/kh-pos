"use client";

import { SaleProduct } from "@/components/gui/dashboard/sale-product";
import { endOfDay, startOfDay } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";

export default function SaleProductReportPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <SaleProduct
        dateRange={dateRange}
        showTop={30}
        showHeader={false}
        setDateRange={(newDateRange) => {
          if (newDateRange) {
            setDateRange(newDateRange);
          }
        }}
      />
    </div>
  );
}
