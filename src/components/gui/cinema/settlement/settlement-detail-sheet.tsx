/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuerySettlementById } from "@/app/hooks/cinema/use-query-settlement";
import { createSheet } from "@/components/create-sheet";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Formatter } from "@/lib/formatter";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Clapperboard,
  ExternalLink,
  Film,
  Hash,
  LayoutGrid,
  Users,
} from "lucide-react";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  settlementId: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "outline" | "destructive";
    }
  > = {
    scheduled: { label: "Scheduled", variant: "outline" },
    selling: { label: "Selling", variant: "secondary" },
    sold_out: { label: "Sold Out", variant: "default" },
    started: { label: "Started", variant: "default" },
    ended: { label: "Ended", variant: "secondary" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };
  const config = map[status] ?? { label: status, variant: "outline" };
  return (
    <Badge variant={config.variant} className="text-xs capitalize">
      {config.label}
    </Badge>
  );
}

export const settlementDetailSheet = createSheet<Props, unknown>(
  ({ settlementId }) => {
    const { data, isLoading } = useQuerySettlementById(settlementId);
    const { formatForDisplay } = useCurrencyFormat();

    const settlement = data?.result;
    const showtimes = settlement?.showtimes ?? [];
    const image = settlement?.productVariant?.basicProduct?.images?.at(0)?.url;
    const movieTitle = settlement?.productVariant?.basicProduct?.title ?? "N/A";
    const isSettled = !!settlement?.settledAt;

    return (
      <div className="flex flex-col gap-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            Settlement Detail
          </SheetTitle>
          <SheetDescription>
            Summary and showtime breakdown for this settlement.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : !settlement ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Film className="h-10 w-10 opacity-30" />
            <p className="text-sm">Settlement not found.</p>
          </div>
        ) : (
          <>
            {/* Movie card */}
            <div className="flex items-center gap-4 rounded-lg border bg-muted/40 p-4">
              <ImageWithFallback
                src={image ?? ""}
                alt={movieTitle}
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg border object-contain bg-background"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base truncate">{movieTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Movie ID: {settlement.movieId ?? "—"}
                </p>
                <div className="mt-1.5">
                  {isSettled ? (
                    <Badge variant="default" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Settled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Unsettled
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<Hash className="h-4 w-4" />}
                label="Total Amount"
                value={formatForDisplay(settlement.totalAmount)}
              />
              <InfoCard
                icon={<Hash className="h-4 w-4" />}
                label="Share Amount"
                value={formatForDisplay(settlement.shareAmount)}
                highlight
              />
              <InfoCard
                icon={<Calendar className="h-4 w-4" />}
                label="Created Date"
                value={
                  settlement.createdAt
                    ? (Formatter.date(settlement.createdAt) ?? "—")
                    : "—"
                }
              />
              <InfoCard
                icon={<Users className="h-4 w-4" />}
                label="Created By"
                value={settlement.createdBy?.fullname ?? "—"}
              />
              <InfoCard
                icon={<Calendar className="h-4 w-4" />}
                label="Settled At"
                value={
                  settlement.settledAt
                    ? (Formatter.date(settlement.settledAt) ?? "—")
                    : "Not yet settled"
                }
              />
              <InfoCard
                icon={<Users className="h-4 w-4" />}
                label="Settled By"
                value={settlement.settledBy?.fullname ?? "—"}
              />
            </div>

            {/* Proof link */}
            {settlement.proofLink && (
              <a
                href={settlement.proofLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                View Payment Proof
              </a>
            )}

            <Separator />

            {/* Showtimes table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Showtimes
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({showtimes.length})
                  </span>
                </h3>
              </div>

              {showtimes.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground gap-2">
                  <Clock className="h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    No showtimes linked to this settlement.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Start</TableHead>
                        <TableHead className="text-xs">End</TableHead>
                        <TableHead className="text-xs">Hall</TableHead>
                        <TableHead className="text-xs text-right">
                          Seats
                        </TableHead>
                        <TableHead className="text-xs text-right">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {showtimes.map((showtime) => (
                        <TableRow key={showtime.showtimeId}>
                          <TableCell className="text-xs text-nowrap">
                            {showtime.showDate
                              ? Formatter.date(showtime.showDate)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-nowrap">
                            {showtime.startTime ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-nowrap">
                            {showtime.endTime ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {showtime.hall?.name ?? showtime.hallId}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {(showtime.reservations as any[]).length}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {formatForDisplay(
                              (showtime.reservations as any[]).reduce(
                                (a, b) => a + b.price,
                                0,
                              ),
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <StatusBadge status={showtime.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  },
);

function InfoCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-1 ${highlight ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
