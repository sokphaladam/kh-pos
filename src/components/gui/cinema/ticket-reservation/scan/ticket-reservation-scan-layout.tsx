"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { scanTicketDialog } from "./scan-ticket-dialog";
import { useQueryHallList } from "@/app/hooks/cinema/use-query-hall";
import { useQueryShowtimeList } from "@/app/hooks/cinema/use-query-showtime";
import { useQueryReservationList } from "@/app/hooks/cinema/use-query-reservation";
import { CinemaHall } from "@/classes/cinema/hall";
import { Showtime } from "@/classes/cinema/showtime";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HallSelection } from "./selection/hall-selection";
import { ShowtimeSelection } from "./selection/showtime-selection";
import { ScanTicketsSelection } from "./selection/scan-ticket-selection";

type WorkflowStep = "hall" | "showtime" | "scan";

export function TicketReservationScanLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>(
    (searchParams.get("step") as WorkflowStep) || "hall",
  );
  const [selectedHall, setSelectedHall] = useState<CinemaHall | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null,
  );

  // Update URL when state changes
  const updateURL = (
    step: WorkflowStep,
    hallId?: string,
    showtimeId?: string,
  ) => {
    const params = new URLSearchParams();
    params.set("step", step);
    if (hallId) params.set("hallId", hallId);
    if (showtimeId) params.set("showtimeId", showtimeId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Data queries
  const { data: hallsData, isLoading: hallsLoading } = useQueryHallList(50, 0, [
    "active",
  ]);
  const { data: showtimesData, isLoading: showtimesLoading } =
    useQueryShowtimeList(
      50,
      0,
      ["scheduled", "selling", "sold_out", "started"],
      selectedHall ? format(new Date(), "yyyy-MM-dd") : undefined,
    );
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    mutate: mutateReservations,
  } = useQueryReservationList({
    limit: 200,
    offset: 0,
    ...(selectedShowtime && { date: format(new Date(), "yyyy-MM-dd") }),
    status: undefined,
    showtimeId: selectedShowtime?.showtimeId,
  });

  // Filter reservations for selected showtime
  const showtimeReservations =
    reservationsData?.result?.data?.filter(
      (reservation) => reservation.showtimeId === selectedShowtime?.showtimeId,
    ) || [];

  const admittedReservations = showtimeReservations.filter(
    (reservation) => reservation.status === "admitted",
  );

  const totalReservations = showtimeReservations.length;
  const totalAdmitted = admittedReservations.length;

  // Restore state from URL parameters
  useEffect(() => {
    const hallId = searchParams.get("hallId");
    const showtimeId = searchParams.get("showtimeId");

    if (hallId && hallsData?.result?.data) {
      const hall = hallsData.result.data.find((h) => h.id === hallId);
      if (hall && !selectedHall) {
        setSelectedHall(hall);
      }
    }

    if (showtimeId && showtimesData?.result?.data) {
      const showtime = showtimesData.result.data.find(
        (s) => s.showtimeId === showtimeId,
      );
      if (showtime && !selectedShowtime) {
        setSelectedShowtime(showtime);
      }
    }
  }, [hallsData, showtimesData, searchParams, selectedHall, selectedShowtime]);

  const handleHallSelect = (hall: CinemaHall) => {
    setSelectedHall(hall);
    setSelectedShowtime(null);
    setCurrentStep("showtime");
    updateURL("showtime", hall.id);
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setCurrentStep("scan");
    updateURL("scan", selectedHall?.id, showtime.showtimeId);
  };

  const handleBackToHalls = () => {
    setSelectedHall(null);
    setSelectedShowtime(null);
    setCurrentStep("hall");
    updateURL("hall");
  };

  const handleBackToShowtimes = () => {
    setSelectedShowtime(null);
    setCurrentStep("showtime");
    updateURL("showtime", selectedHall?.id);
  };

  const handleScanTicket = async () => {
    const res = await scanTicketDialog.show({
      showtimeId: selectedShowtime?.showtimeId || "",
    });
    if (res) {
      mutateReservations();
      toast.success("Ticket scanned successfully!");
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      {/* Mobile stepper - vertical layout */}
      <div className="flex md:hidden flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Ticket Scanning</h1>
          <div className="text-sm text-muted-foreground">
            Step{" "}
            {currentStep === "hall" ? 1 : currentStep === "showtime" ? 2 : 3} of
            3
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            currentStep === "hall"
              ? "bg-blue-50 border border-blue-200 text-blue-700"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
              currentStep === "hall"
                ? "bg-blue-100 text-blue-700"
                : "bg-muted text-muted-foreground",
            )}
          >
            1
          </div>
          <div>
            <div className="font-medium">Select Hall</div>
            {selectedHall && (
              <div className="text-xs text-muted-foreground">
                {selectedHall.name}
              </div>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            currentStep === "showtime"
              ? "bg-blue-50 border border-blue-200 text-blue-700"
              : selectedHall
                ? "bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
              currentStep === "showtime"
                ? "bg-blue-100 text-blue-700"
                : selectedHall
                  ? "bg-muted text-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            2
          </div>
          <div>
            <div
              className={cn(
                "font-medium",
                !selectedHall && "text-muted-foreground",
              )}
            >
              Select Showtime
            </div>
            {selectedShowtime && (
              <div className="text-xs text-muted-foreground">
                {format(new Date(selectedShowtime.startTime), "HH:mm")} -{" "}
                {selectedShowtime.variant?.at(0)?.basicProduct?.title}
              </div>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            currentStep === "scan"
              ? "bg-blue-50 border border-blue-200 text-blue-700"
              : selectedShowtime
                ? "bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
              currentStep === "scan"
                ? "bg-blue-100 text-blue-700"
                : selectedShowtime
                  ? "bg-muted text-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            3
          </div>
          <div
            className={cn(
              "font-medium",
              !selectedShowtime && "text-muted-foreground",
            )}
          >
            Scan Tickets
          </div>
        </div>
      </div>

      {/* Desktop stepper - horizontal layout */}
      <div className="hidden md:flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            currentStep === "hall"
              ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              currentStep === "hall"
                ? "bg-blue-100 text-blue-700"
                : "bg-muted text-muted-foreground",
            )}
          >
            1
          </div>
          <div>
            <div className="font-medium">Select Hall</div>
            {selectedHall && (
              <div className="text-xs text-muted-foreground">
                {selectedHall.name}
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            currentStep === "showtime"
              ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
              : selectedHall
                ? "bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              currentStep === "showtime"
                ? "bg-blue-100 text-blue-700"
                : selectedHall
                  ? "bg-muted text-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            2
          </div>
          <div>
            <div
              className={cn(
                "font-medium",
                !selectedHall && "text-muted-foreground",
              )}
            >
              Select Showtime
            </div>
            {selectedShowtime && (
              <div className="text-xs text-muted-foreground">
                {format(new Date(selectedShowtime.startTime), "HH:mm")} -{" "}
                {selectedShowtime.variant?.at(0)?.basicProduct?.title}
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            currentStep === "scan"
              ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
              : selectedShowtime
                ? "bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              currentStep === "scan"
                ? "bg-blue-100 text-blue-700"
                : selectedShowtime
                  ? "bg-muted text-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            3
          </div>
          <div
            className={cn(
              "font-medium",
              !selectedShowtime && "text-muted-foreground",
            )}
          >
            Scan Tickets
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8" role="main">
        {renderStepIndicator()}

        <div className="space-y-6">
          {currentStep === "hall" && (
            <HallSelection
              halls={hallsData?.result?.data || []}
              loading={hallsLoading}
              onHallSelect={handleHallSelect}
            />
          )}

          {currentStep === "showtime" && selectedHall && (
            <ShowtimeSelection
              hall={selectedHall}
              showtimes={showtimesData?.result?.data || []}
              loading={showtimesLoading}
              onShowtimeSelect={handleShowtimeSelect}
              onBack={handleBackToHalls}
            />
          )}

          {currentStep === "scan" && selectedHall && selectedShowtime && (
            <ScanTicketsSelection
              hall={selectedHall}
              showtime={selectedShowtime}
              totalReservations={totalReservations}
              totalAdmitted={totalAdmitted}
              admittedReservations={admittedReservations}
              allReservations={showtimeReservations}
              loading={reservationsLoading}
              onScanTicket={handleScanTicket}
              onBack={handleBackToShowtimes}
            />
          )}
        </div>
      </div>
    </div>
  );
}
