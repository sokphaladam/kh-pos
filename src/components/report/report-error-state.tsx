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
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive/80" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-destructive">{title}</h3>
          <div className="mt-2 text-sm text-destructive">
            {error?.message || description}
          </div>
          <div className="mt-3">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
