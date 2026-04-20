"use client";
import { TopToolbar } from "@/components/top-toolbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createHallSeat } from "./hall-seat-create";
import { useQueryHallList } from "@/app/hooks/cinema/use-query-hall";
import { Pagination } from "@/components/pagination";
import { HallList } from "./hall-list";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/loading-spinner";
import SkeletonTableList from "@/components/skeleton-table-list";
import { Building2, PlusCircle, AlertCircle, RefreshCw } from "lucide-react";

export function HallSeatLayout() {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const { data, isLoading, error, mutate } = useQueryHallList(30, offset);

  const halls = data?.result?.data;
  const total = data?.result?.total || 0;
  const hasHalls = halls && halls.length > 0;

  // Loading state
  if (isLoading && !halls) {
    return (
      <div className="w-full flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="h-7 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <SkeletonTableList />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full flex flex-col gap-6 p-6">
        <TopToolbar
          onAddNew={async () => {
            const res = await createHallSeat.show({});
            if (!!res) {
              mutate();
            }
          }}
          text="Hall"
          data={halls || []}
          searchEnabled
          disabled={isLoading}
        />
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load cinema halls
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              There was an error loading the cinema halls. Please try again or
              contact support if the problem persists.
            </p>
            <Button
              onClick={() => mutate()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col gap-6 p-6"
      role="main"
      aria-labelledby="halls-title"
    >
      <TopToolbar
        onAddNew={async () => {
          const res = await createHallSeat.show({});
          if (res) {
            mutate();
          }
        }}
        text="Hall"
        data={halls || []}
        searchEnabled
        disabled={isLoading}
        headerRight={
          isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                Refreshing...
              </span>
            </div>
          ) : undefined
        }
      />

      <Card
        className="border-0 shadow-sm"
        role="region"
        aria-label="Cinema halls list"
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Hall Management</CardTitle>
              <CardDescription className="mt-1">
                Manage your cinema halls, seating arrangements, and hall
                specifications.
                {hasHalls &&
                  ` Currently managing ${halls.length} ${
                    halls.length === 1 ? "hall" : "halls"
                  }.`}
              </CardDescription>
            </div>
            {!hasHalls && (
              <Button
                onClick={async () => {
                  const res = await createHallSeat.show({});
                  if (res) {
                    mutate();
                  }
                }}
                className="gap-2 shrink-0"
                disabled={isLoading}
              >
                <PlusCircle className="h-4 w-4" />
                Add First Hall
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {hasHalls ? (
            <div className="px-6">
              <HallList halls={halls} isLoading={isLoading} mutate={mutate} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="rounded-full bg-muted p-6 mb-6">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No cinema halls yet
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Get started by creating your first cinema hall. You can define
                seating arrangements, set hall features, and manage capacity for
                each hall.
              </p>
              <Button
                onClick={async () => {
                  const res = await createHallSeat.show({});
                  if (res) {
                    mutate();
                  }
                }}
                size="lg"
                className="gap-2"
                disabled={isLoading}
              >
                <PlusCircle className="h-5 w-5" />
                Create Your First Hall
              </Button>
            </div>
          )}
        </CardContent>

        {hasHalls && (
          <CardFooter>
            <Pagination
              limit={30}
              offset={offset}
              total={total}
              totalPerPage={halls.length}
              text="halls"
            />
          </CardFooter>
        )}
      </Card>

      {hasHalls && total > halls.length && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Showing {halls.length} of {total} halls. Use the pagination controls
            above to navigate through all halls.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
