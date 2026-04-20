"use client";

import { useQueryShowtimeList } from "@/app/hooks/cinema/use-query-showtime";
import moment from "moment-timezone";
import { useMemo, useState } from "react";
import { Showtime } from "@/classes/cinema/showtime";
import LoadingSpinner from "@/components/loading-spinner";
import { SeatReservation } from "@/classes/cinema/reservation";
import { TicketReservationMovieInformation } from "./components/ticket-reservation-movie-information";
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { TicketReservationDateSelection } from "./components/ticket-reservation-date-seletion";
import { TicketReservationSeatSelection } from "./components/ticket-reservation-seat-selection";
import { TicketReservationShowtimeHall } from "./components/ticket-reservation-showtime-hall";
import { TicketReservationDateSection } from "./components/ticket-reservation-confirmation-section";
import { useWindowSize } from "@/components/use-window-size";

interface Props {
  movieId?: string;
  onConfirm?: (
    data: {
      showtimeId: string;
      seatId: string;
      price: number;
      code: string;
    }[],
  ) => void;
  currentSelected?: SeatReservation[];
  variant?: ProductVariantType;
}

export function TicketReservationLayout(props: Props) {
  const { height } = useWindowSize();
  const today = moment().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(
    props.currentSelected && props.currentSelected.length > 0
      ? props.currentSelected.at(0)?.showtime?.showDate || today
      : today,
  );
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    props.currentSelected && props.currentSelected.length > 0
      ? props.currentSelected.at(0)?.showtime || null
      : null,
  );
  const [selectedSeats, setSelectedSeats] = useState<string[]>(
    props.currentSelected ? props.currentSelected.map((x) => x.seatId) : [],
  );

  const { data } = useQueryShowtimeList(
    100,
    0,
    undefined,
    today,
    props.movieId || undefined,
  );
  const showtimes = useMemo(() => data?.result?.data || [], [data]);
  const uniqueShowDates = [
    ...new Set(showtimes.map((showtime) => showtime.showDate)),
  ];
  const uniqueHalls = useMemo(() => {
    return Object.values(
      showtimes
        .filter((f) => f.showDate === selectedDate)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((acc: Record<string, any>, showtime) => {
          const key = showtime.hallId || "";
          if (showtime && showtime.hall && !acc[key]) {
            acc[key] = showtime.hall;
          }
          return acc;
        }, {}),
    );
  }, [showtimes, selectedDate]);

  const showtimeGroupByHall = useMemo(() => {
    return showtimes
      .filter((f) => f.showDate === selectedDate)
      .reduce(
        (acc: Record<string, typeof showtimes>, showtime) => {
          const key = showtime.hallId || "";
          if (!acc[key]) {
            acc[key] = [];
          }

          acc[key].push(showtime);
          return acc;
        },
        {} as Record<string, typeof showtimes>,
      );
  }, [showtimes, selectedDate]);

  const seatReserved =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedShowtime?.reservations.map((x: any) => x.seatId) || [];

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const variant = props.variant
    ? props.variant
    : showtimes.at(0)?.variant?.at(0);

  return (
    <div className="pt-6 overflow-auto" style={{ height: height / 1.1 }}>
      <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Select Your Showtime & Seats
          </h1>
          <p className="text-slate-600">
            Choose your preferred date, showtime, and seats for the best
            experience
          </p>
        </div>

        {/* Movie Information */}
        {variant && <TicketReservationMovieInformation variant={variant} />}

        {/* Date Selection */}
        <TicketReservationDateSelection
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setSelectedSeats={setSelectedSeats}
          setSelectedShowtime={() => setSelectedShowtime(null)}
          uniqueShowDates={uniqueShowDates}
          currentSelected={props.currentSelected?.map((x) => x.seatId)}
        />

        {/* Showtimes & Halls */}
        <TicketReservationShowtimeHall
          selectedShowtime={selectedShowtime}
          setSelectedSeats={setSelectedSeats}
          setSelectedShowtime={setSelectedShowtime}
          showtimeGroupByHall={showtimeGroupByHall}
          uniqueHalls={uniqueHalls}
          currentSelected={props.currentSelected}
        />

        {/* Seat Selection */}
        <TicketReservationSeatSelection
          selectedShowtime={selectedShowtime}
          seatReserved={seatReserved}
          selectedSeats={selectedSeats}
          setSelectedSeats={setSelectedSeats}
          currentSelected={props.currentSelected}
        />
        {/* Confirmation Section */}
        {selectedShowtime && (
          <TicketReservationDateSection
            selectedSeats={selectedSeats}
            selectedShowtime={selectedShowtime}
            setSelectedSeats={setSelectedSeats}
            onConfirm={props.onConfirm}
            currentSelected={props.currentSelected}
          />
        )}
      </div>
    </div>
  );
}
