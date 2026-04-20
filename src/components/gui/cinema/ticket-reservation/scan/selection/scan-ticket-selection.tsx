"use client";

import { CinemaHall } from "@/classes/cinema/hall";
import { SeatReservation } from "@/classes/cinema/reservation";
import { Showtime } from "@/classes/cinema/showtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  BarChart3,
  CheckCircle,
  Grid3x3,
  List,
  ScanLine,
  Ticket,
} from "lucide-react";
import moment from "moment-timezone";
import { useState } from "react";
import { SeatLayout } from "../../../components/seat-layout";

interface Props {
  hall: CinemaHall;
  showtime: Showtime;
  totalReservations: number;
  totalAdmitted: number;
  admittedReservations: SeatReservation[];
  allReservations: SeatReservation[];
  loading: boolean;
  onScanTicket: () => void;
  onBack: () => void;
}

interface VisualSeatingViewProps {
  allReservations: SeatReservation[];
  admittedReservations: SeatReservation[];
  hall: CinemaHall;
}

type ViewMode = "list" | "visual";

export function ScanTicketsSelection({
  hall,
  showtime,
  totalReservations,
  totalAdmitted,
  admittedReservations,
  allReservations,
  loading,
  onScanTicket,
  onBack,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ScanLine className="h-6 w-6 text-blue-600" />
                </div>
                Scan Tickets
              </h2>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{hall.name}</span>
                  <span>•</span>
                  <span>
                    {moment(showtime.startTime).format("HH:mm")} -{" "}
                    {moment(showtime.endTime).format("HH:mm")}
                  </span>
                </div>
                {showtime.variant?.at(0)?.basicProduct?.title && (
                  <div className="text-sm font-medium text-foreground">
                    {showtime.variant?.at(0)?.basicProduct?.title}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onBack}
              className="self-start sm:self-center"
            >
              ← Back to Showtimes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            Admission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-indigo-50 p-6 rounded-xl text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-1">
                {totalAdmitted}
              </div>
              <p className="text-sm font-medium text-indigo-700">Admitted</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tickets scanned
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <div className="text-4xl font-bold text-gray-700 mb-1">
                {totalReservations}
              </div>
              <p className="text-sm font-medium text-gray-700">
                Total Reserved
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All reservations
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {totalReservations > 0
                  ? Math.round((totalAdmitted / totalReservations) * 100)
                  : 0}
                %
              </div>
              <p className="text-sm font-medium text-green-700">Completion</p>
              <p className="text-xs text-muted-foreground mt-1">
                Admission rate
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm font-medium mb-3">
              <span>Progress</span>
              <span>
                {totalAdmitted} / {totalReservations} tickets
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width:
                    totalReservations > 0
                      ? `${(totalAdmitted / totalReservations) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {totalReservations - totalAdmitted > 0
                ? `${totalReservations - totalAdmitted} tickets remaining`
                : "All tickets admitted!"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Action */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-3">
              <Ticket className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Ready to Scan</h3>
            <p className="text-muted-foreground text-sm">
              Click the button below to scan a ticket
            </p>
          </div>
          <Button
            size="lg"
            onClick={onScanTicket}
            className="w-full sm:w-auto px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            <ScanLine className="h-6 w-6 mr-3" />
            Scan Ticket Now
          </Button>
        </CardContent>
      </Card>

      {/* Admitted Tickets List */}
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              Admitted Tickets ({admittedReservations.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === "visual" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("visual")}
                className="flex items-center gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline">Visual</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 border rounded-lg"
                >
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : viewMode === "visual" ? (
            <VisualSeatingView
              allReservations={allReservations}
              admittedReservations={admittedReservations}
              hall={hall}
            />
          ) : admittedReservations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">
                No tickets admitted yet
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Scan tickets to see them appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {admittedReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg transition-all hover:bg-green-100"
                >
                  <div className="p-1 bg-green-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-green-900 truncate">
                      {reservation.seat
                        ? `Seat ${reservation.seat.row}${reservation.seat.column}`
                        : "Unknown Seat"}
                    </div>
                    <div className="text-sm text-green-700">
                      {reservation.seat?.type && (
                        <span className="capitalize">
                          {reservation.seat.type} seat
                        </span>
                      )}
                    </div>
                    {reservation.code && (
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        #{reservation.code}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-700">
                      {reservation.admittedAt
                        ? format(new Date(reservation.admittedAt), "HH:mm:ss")
                        : "Just now"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Admitted
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VisualSeatingView({
  allReservations,
  admittedReservations,
  hall,
}: VisualSeatingViewProps) {
  if (allReservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Grid3x3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">
          No seat reservations found
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Reservations will appear here when available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seat Layout */}
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-xl">
        <div className="overflow-x-auto">
          <SeatLayout
            seats={hall.seats.map((seat) => {
              return {
                id: seat.id,
                row: String(seat.row).charCodeAt(0) - 64,
                column: seat.column,
                type: seat.type === "blocked" ? "blocked" : "standard",
              };
            })}
            columns={hall.columns}
            rows={hall.rows}
            handleSeatClickAction={() => {}}
            parts={hall.parts}
            forReservation
            overwriteType={[
              {
                label: "Admitted",
                color: "bg-indigo-500 border-indigo-600 shadow-md",
                description: "Ticket has been scanned and admitted",
              },
              {
                label: "Reserved",
                color: "bg-green-500 border-green-600 shadow-md",
                description: "Seat is reserved but not yet admitted",
              },
              {
                label: "Available",
                color: "bg-gray-300 border-gray-400",
                description: "Seat is available",
              },
            ]}
            admittedReservations={admittedReservations}
            allReservations={allReservations}
          />
        </div>
      </div>
    </div>
  );
}
