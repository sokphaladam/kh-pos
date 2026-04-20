"use client";
import React from "react";

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  height?: string;
  title?: string;
}

export class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chart Error Boundary caught an error:", error, errorInfo);

    // Log chart-specific errors
    if (
      error.message.includes("chart") ||
      error.message.includes("recharts") ||
      error.message.includes("moment") ||
      error.message.includes("date")
    ) {
      console.error("Chart hydration/rendering error:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={`${
            this.props.height || "h-64"
          } flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600`}
        >
          <div className="text-center p-4">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">
              📊
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {this.props.title || "Chart"} Unavailable
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Unable to load chart data. This might be a temporary issue.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
