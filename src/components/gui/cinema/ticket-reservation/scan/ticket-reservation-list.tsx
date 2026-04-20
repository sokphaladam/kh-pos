"use client";

import { SeatReservation } from "@/classes/cinema/reservation";
import { ResponseType } from "@/lib/types";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCommonDialog } from "@/components/common-dialog";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  QrCode,
  MapPin,
  Clock,
  Ticket,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Film,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment-timezone";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Pagination } from "@/components/pagination";

interface Props {
  data:
    | ResponseType<{
        total: number;
        data: SeatReservation[];
      }>
    | undefined;
  loading: boolean;
  limit: number;
  offset: number;
  onRefresh: () => void;
  onAdmit?: (reservationId: string) => Promise<void>;
  onCancel?: (reservationId: string) => Promise<void>;
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Skeleton className="h-6 w-8 rounded" />
          <Skeleton className="h-6 w-8 rounded" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <div>
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded ml-auto" />
      </TableCell>
    </TableRow>
  );
}

function getStatusConfig(status: SeatReservation["status"]) {
  switch (status) {
    case "confirmed":
      return {
        variant: "default" as const,
        className:
          "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Confirmed",
      };
    case "pending":
      return {
        variant: "secondary" as const,
        className:
          "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
        icon: <Clock className="h-3 w-3" />,
        label: "Pending",
      };
    case "admitted":
      return {
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
        icon: <Ticket className="h-3 w-3" />,
        label: "Admitted",
      };
    case "cancelled":
      return {
        variant: "destructive" as const,
        className: "bg-red-500 hover:bg-red-600 text-white border-red-500",
        icon: <XCircle className="h-3 w-3" />,
        label: "Cancelled",
      };
    case "expired":
      return {
        variant: "outline" as const,
        className: "bg-gray-500 hover:bg-gray-600 text-white border-gray-500",
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Expired",
      };
    default:
      return {
        variant: "outline" as const,
        className: "",
        icon: <AlertTriangle className="h-3 w-3" />,
        label: "Unknown",
      };
  }
}

function formatSeatLabel(seat: SeatReservation["seat"]) {
  if (!seat) return "N/A";
  return `${seat.row}${seat.column}`;
}

function formatShowtime(showtime: SeatReservation["showtime"]) {
  if (!showtime) return { date: "N/A", time: "N/A" };

  const showDate = moment(showtime.showDate).format("MMM DD, YYYY");
  const startTime = moment(showtime.startTime, "HH:mm:ss").format("h:mm A");
  const endTime = moment(showtime.endTime, "HH:mm:ss").format("h:mm A");

  return {
    date: showDate,
    time: `${startTime} - ${endTime}`,
  };
}

export function TicketReservationList({
  data,
  loading,
  limit,
  offset,
  onRefresh,
  onAdmit,
  onCancel,
}: Props) {
  const { formatForDisplay } = useCurrencyFormat();
  const { showDialog } = useCommonDialog();

  const handleAdmit = useCallback(
    async (reservation: SeatReservation) => {
      if (!onAdmit) return;

      try {
        await showDialog({
          title: "Admit Ticket",
          content: `Are you sure you want to admit this ticket for seat ${formatSeatLabel(
            reservation.seat
          )}?`,
          actions: [
            {
              text: "Admit",
              onClick: async () => {
                await onAdmit(reservation.id);
                toast.success("Ticket admitted successfully");
                onRefresh();
              },
            },
          ],
        });
      } catch (error) {
        toast.error("Failed to admit ticket");
        console.error(error);
      }
    },
    [onAdmit, showDialog, onRefresh]
  );

  const handleCancel = useCallback(
    async (reservation: SeatReservation) => {
      if (!onCancel) return;

      try {
        await showDialog({
          title: "Cancel Reservation",
          content: `Are you sure you want to cancel this reservation for seat ${formatSeatLabel(
            reservation.seat
          )}? This action cannot be undone.`,
          actions: [
            {
              text: "Cancel Reservation",
              onClick: async () => {
                await onCancel(reservation.id);
                toast.success("Reservation cancelled successfully");
                onRefresh();
              },
            },
          ],
        });
      } catch (error) {
        toast.error("Failed to cancel reservation");
        console.error(error);
      }
    },
    [onCancel, showDialog, onRefresh]
  );

  const reservations = data?.result?.data || [];
  const total = data?.result?.total || 0;

  const totalCount =
    typeof total === "number"
      ? total
      : Array.isArray(total) && total[0] && "total" in total[0]
      ? (total[0] as { total: number }).total
      : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Ticket Reservations
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span>Total: {total} reservations</span>
              <span>•</span>
              <span>
                Showing {Math.max(0, offset - limit + 1)} -{" "}
                {Math.min(offset, total)} of {total}
              </span>
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Ticket Info
                  </div>
                </TableHead>
                <TableHead className="font-medium">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Movie & Hall
                  </div>
                </TableHead>
                <TableHead className="font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Seat
                  </div>
                </TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Showtime
                  </div>
                </TableHead>
                <TableHead className="text-right font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, index) => (
                  <LoadingRow key={index} />
                ))
              ) : reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Ticket className="h-8 w-8" />
                      <p className="text-sm">No reservations found</p>
                      <p className="text-xs">
                        Try adjusting your filters or check back later
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((reservation) => {
                  const statusConfig = getStatusConfig(reservation.status);
                  const showtimeInfo = formatShowtime(reservation.showtime);

                  return (
                    <TableRow
                      key={reservation.id}
                      className="hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              #
                              {reservation.code ||
                                reservation.id.slice(-6).toUpperCase()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatForDisplay(reservation.price)}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {reservation.showtime?.variant?.at(0)?.basicProduct
                              ?.title || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.showtime?.hall?.name || "N/A"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {formatSeatLabel(reservation.seat)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {reservation.seat?.type || "Standard"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={statusConfig.variant}
                          className={cn(
                            "flex items-center gap-1",
                            statusConfig.className
                          )}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{showtimeInfo.date}</div>
                          <div className="text-xs text-muted-foreground">
                            {showtimeInfo.time}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <BasicMenuAction
                          value={reservation}
                          items={[
                            ...(onAdmit && reservation.status === "confirmed"
                              ? [
                                  {
                                    label: "Admit",
                                    onClick: () => handleAdmit(reservation),
                                  },
                                ]
                              : []),
                            ...(onCancel &&
                            ["confirmed", "pending"].includes(
                              reservation.status
                            )
                              ? [
                                  {
                                    label: "Cancel",
                                    onClick: () => handleCancel(reservation),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <CardFooter>
          <Pagination
            limit={limit}
            offset={offset}
            total={totalCount}
            totalPerPage={reservations.length}
            text="Reservations"
          />
        </CardFooter>
      </CardContent>
    </Card>
  );
}
