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
  iconColor = "text-info",
  recordCount,
  recordLabel = "records",
  children,
}: ReportDataSectionProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/40">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {title}
          </h2>
          {recordCount !== undefined && (
            <div className="text-sm text-muted-foreground">
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
