import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ReportErrorStateProps {
  error: Error | undefined;
  onRetry: () => void;
  title?: string;
  description?: string;
}

export function ReportErrorState({
  error,
  onRetry,
  title = "Error loading data",
  description = "Failed to fetch report data",
}: ReportErrorStateProps) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            {error?.message || description}
          </div>
          <div className="mt-3">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
