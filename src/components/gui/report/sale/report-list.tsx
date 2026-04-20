"use client";

import React from "react";
import { ResponseType } from "@/lib/types";
import { SaleByCategoryReportRow } from "@/app/api/report/sale-by-category/sale-by-category";
import { SaleBreakdownTable } from "@/app/admin/(admin)/reports/sale-breakdown/components";

interface ReportListProps {
  data: ResponseType<SaleByCategoryReportRow[]> | undefined;
  type: "sale-by-category" | "other-report-type";
}

export function ReportList({ data, type }: ReportListProps) {
  const reportData = data?.result || [];

  if (type === "sale-by-category") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Detailed Breakdown
            </h2>
            <div className="text-sm text-gray-600">
              {reportData.length}{" "}
              {reportData.length === 1 ? "record" : "records"}
            </div>
          </div>
        </div>

        <div className="p-6">
          <SaleBreakdownTable data={reportData} />
        </div>
      </div>
    );
  }

  return <div></div>;
}
