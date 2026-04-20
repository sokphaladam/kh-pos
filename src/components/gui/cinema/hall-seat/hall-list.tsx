"use client";

import { CinemaHall } from "@/classes/cinema/hall";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { updateHallSeat } from "./hall-seat-update";
import { Building2, Users, Calendar, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useMutationDeleteHall } from "@/app/hooks/cinema/use-query-hall";
import { useCommonDialog } from "@/components/common-dialog";
import { toast } from "sonner";

interface Props {
  halls?: CinemaHall[];
  isLoading?: boolean;
  mutate?: () => void;
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded ml-auto" />
      </TableCell>
    </TableRow>
  );
}

function getStatusConfig(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return {
        variant: "default" as const,
        className:
          "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500",
        icon: "🟢",
      };
    case "maintenance":
      return {
        variant: "destructive" as const,
        className:
          "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
        icon: "🔧",
      };
    case "inactive":
    case "disabled":
      return {
        variant: "secondary" as const,
        className: "bg-muted text-muted-foreground border-muted",
        icon: "⭕",
      };
    default:
      return {
        variant: "outline" as const,
        className: "",
        icon: "❓",
      };
  }
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function HallList({ halls, isLoading, mutate }: Props) {
  const { showDialog } = useCommonDialog();
  const { trigger } = useMutationDeleteHall();
  const showLoadingRows = isLoading && (!halls || halls.length === 0);

  const handleDeleteHall = useCallback(
    async (id: string) => {
      showDialog({
        title: "Delete Cinema Hall",
        content:
          "Are you sure you want to delete this cinema hall? This action cannot be undone.",
        destructive: true,
        actions: [
          {
            text: "Delete",
            onClick: async () => {
              await trigger({ id })
                .then(async (res) => {
                  if (res.success) {
                    toast.success("Cinema hall deleted successfully!");
                    mutate?.();
                  } else {
                    toast.error(
                      "Failed to delete cinema hall, please try again!",
                    );
                  }
                })
                .catch(() => {
                  toast.error(
                    "Failed to delete cinema hall, please try again!",
                  );
                });
            },
          },
        ],
      });
    },
    [mutate, showDialog, trigger],
  );

  return (
    <div className="w-full">
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Hall Details
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Features
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacity
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Creator
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoadingRows
              ? Array.from({ length: 3 }).map((_, index) => (
                  <LoadingRow key={`loading-${index}`} />
                ))
              : halls?.map((hall, index) => {
                  const featureList = Object.fromEntries(
                    Object.entries(hall.features)
                      .map(([category, options]) => [
                        category,
                        Object.fromEntries(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          Object.entries(options as Record<string, any>).filter(
                            ([, value]) => value === true,
                          ),
                        ),
                      ])
                      .filter(([, obj]) => Object.keys(obj).length > 0),
                  );

                  const statusConfig = getStatusConfig(hall.status);
                  const isInactive = hall.status.toLowerCase() !== "active";
                  const blocks = hall.seats.filter(
                    (f) => f.type === "blocked",
                  ).length;

                  return (
                    <TableRow
                      key={`hall-${hall.id}-${index}`}
                      className={cn(
                        "hover:bg-muted/10 transition-colors duration-200 cursor-pointer",
                        isInactive && "opacity-75",
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold",
                              statusConfig.className.includes("emerald")
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-muted text-muted-foreground border",
                            )}
                          >
                            {hall.number || hall.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {hall.name}
                            </div>
                            {hall.number && (
                              <div className="text-xs text-muted-foreground">
                                Hall #{hall.number}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {Object.keys(featureList).length > 0 ? (
                            Object.keys(featureList).map((feature, i) => (
                              <Badge
                                key={`feature-${i}`}
                                variant="outline"
                                className="text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                              >
                                {feature.charAt(0).toUpperCase() +
                                  feature.slice(1)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No features
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">
                            {blocks > 0 ? (
                              <div className="flex flex-row gap-1 items-center">
                                <div className="line-through text-red-500">
                                  {hall.totalSeats || 0}
                                </div>
                                <div>{hall.totalSeats - blocks}</div>
                              </div>
                            ) : (
                              <div>{hall.totalSeats || 0}</div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            seats
                          </span>
                        </div>
                        {hall.rows && hall.columns && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {hall.rows} rows × {hall.columns} cols
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig.variant}
                          className={cn(
                            "text-xs font-medium capitalize",
                            statusConfig.className,
                          )}
                        >
                          <span className="mr-1">{statusConfig.icon}</span>
                          {hall.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <div className="text-sm">
                            {formatDate(hall.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {hall.createdBy?.fullname || (
                            <span className="text-muted-foreground italic">
                              Unknown
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <BasicMenuAction
                          onEdit={async () => {
                            const res = await updateHallSeat.show({
                              initialData: {
                                hallId: hall.id,
                                hallName: hall.name,
                                hallNumber: hall.number,
                                rows: hall.rows,
                                columns: hall.columns,
                                status: hall.status,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                features: hall.features as any,
                                seats: hall.seats.map((seat) => {
                                  return {
                                    id: seat.id,
                                    row: String(seat.row).charCodeAt(0) - 64,
                                    column: seat.column,
                                    type: seat.type,
                                    isAvailable: seat.isAvailable,
                                    groupId: seat.groupId || "",
                                  };
                                }),
                                parts: hall.parts || [],
                              },
                            });

                            if (!!res) {
                              mutate?.();
                            }
                          }}
                          onDelete={() => handleDeleteHall(hall.id)}
                          value={hall}
                          disabled={isLoading}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}

            {/* Loading overlay for existing data */}
            {isLoading && halls && halls.length > 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    Refreshing data...
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
