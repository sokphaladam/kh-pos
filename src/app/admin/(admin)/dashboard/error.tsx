"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex-1 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-[#18181b] dark:to-[#23272f] p-0 md:p-0">
      <section className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Something went wrong!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              An error occurred while loading the dashboard.
            </p>
            {error.message && (
              <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md">
                {error.message}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={() => reset()} variant="default">
              Try again
            </Button>
            <Button
              onClick={() => (window.location.href = "/admin/dashboard")}
              variant="outline"
            >
              Reload page
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
