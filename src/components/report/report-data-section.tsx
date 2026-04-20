import React from "react";
import { LucideIcon } from "lucide-react";

interface ReportDataSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  recordCount?: number;
  recordLabel?: string;
  children: React.ReactNode;
}

export function ReportDataSection({
  title,
  icon: Icon,
  iconColor = "text-blue-600",
  recordCount,
  recordLabel = "records",
  children,
}: ReportDataSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {title}
          </h2>
          {recordCount !== undefined && (
            <div className="text-sm text-gray-600">
              {recordCount}{" "}
              {recordCount === 1 ? recordLabel.slice(0, -1) : recordLabel}
            </div>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
