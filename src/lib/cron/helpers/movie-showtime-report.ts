import { Knex } from "knex";

interface MovieShowtimeFilter {
  startDate: string;
  endDate: string;
}

interface MovieReservationData {
  reservation_id: string;
  showtime_id: string;
  seat_id: string;
  code: string;
  order_detail_id: string;
  reservation_status: string;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  confirmed_by: string;
  confirmed_at: string;
  admitted_by: string | null;
  admitted_at: string | null;
  price: string;
  branch: string;
  hall_name: string;
  seat_type: string;
  _showtime: string;
  title: string;
  director: string;
  email_producer: string | null;
  tax_rate: string;
}

export function groupByMovieHallBranch(data: MovieReservationData[]) {
  const groups: { [key: string]: MovieReservationData[] } = {};

  data.forEach((reservation) => {
    const key = `${reservation.title}|${reservation.hall_name}|${reservation.branch}|${reservation.director}|${reservation.email_producer}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(reservation);
  });

  return Object.entries(groups).map(([key, reservations]) => {
    const [title, hall_name, branch, director, email_producer] = key.split("|");
    return {
      title,
      hall_name,
      branch,
      director,
      email_producer,
      reservations,
    };
  });
}

export async function queryMovieShowtimeData(
  db: Knex,
  filter: MovieShowtimeFilter,
) {
  const query = db("seat_reservation")
    .select(
      "seat_reservation.*",
      "warehouse.name as branch",
      "cinema_hall.hall_name",
      "cinema_seat.seat_type",
      "showtime.start_time as _showtime",
      "product.title",
      "movie.director",
      "movie.email_producer",
      "movie.producer_share",
      "movie.tax_rate",
      "showtime.show_date",
      "showtime.showtime_id",
      "showtime.booking_id",
      "warehouse.id as warehouse_id",
    )
    .innerJoin(
      "showtime",
      "showtime.showtime_id",
      "seat_reservation.showtime_id",
    )
    .innerJoin("product_variant", "product_variant.id", "showtime.movie_id")
    .innerJoin("product", "product_variant.product_id", "product.id")
    .innerJoin("cinema_seat", "cinema_seat.seat_id", "seat_reservation.seat_id")
    .innerJoin("cinema_hall", "cinema_hall.hall_id", "cinema_seat.hall_id")
    .innerJoin("warehouse", "warehouse.id", "cinema_hall.warehouse_id")
    .innerJoin(
      "customer_order_detail",
      "customer_order_detail.order_detail_id",
      "seat_reservation.order_detail_id",
    )
    .innerJoin("movie", "movie.movie_id", "showtime.movie_id");

  if (filter.startDate && filter.endDate) {
    query.whereBetween("seat_reservation.confirmed_at", [
      filter.startDate,
      filter.endDate,
    ]);
  }

  const rows = await query;

  if (rows.length === 0) {
    return [];
  }

  return rows;
}

export function generateMovieShowtimeHtml(
  data: {
    title: string;
    hall_name: string;
    branch: string;
    director: string;
    email_producer: string;
    reservations: MovieReservationData[];
  }[],
  date?: string,
): string {
  // Get date range from reservations
  const allReservations = data.flatMap((group) => group.reservations);
  const dates = allReservations.map(
    (r) => new Date(r.confirmed_at || r.created_at),
  );
  const startDate =
    dates.length > 0
      ? new Date(Math.min(...dates.map((d) => d.getTime())))
      : new Date();
  const endDate =
    dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime())))
      : new Date();

  const formatDateHeader = (date: Date) => {
    return (
      date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) +
      " AM"
    );
  };

  const reportDate = (date ? new Date(date) : new Date()).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@100..900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Yellowtail&display=swap");
        @media print {
            @page { 
                size: landscape;
                margin: 15mm; 
            }
            .page-break { page-break-after: always; }
            .page:last-child .page-break { page-break-after: auto; }
        }
        body { 
            font-family: 'Lato', 'Noto Sans Khmer', 'Yellowtail', Arial, sans-serif; 
            font-size: 8pt; 
            margin: 0; 
            padding: 0; 
            background: white; 
        }
        .page { 
            width: 297mm;
            padding: 15px; 
            background: white; 
            margin: 10px auto;
        }
        .header { 
            position: relative; 
            margin-bottom: 20px; 
            height: 25px;
        }
        .cinema-name { 
            position: absolute; 
            right: 0; 
            top: 0; 
            font-size: 9pt; 
            font-weight: bold; 
        }
        .report-title { 
            text-align: center; 
            font-size: 14pt; 
            font-weight: bold; 
            margin: 25px 0 20px 0; 
            letter-spacing: 1px;
        }
        .report-info { 
            font-size: 8pt; 
            margin-bottom: 20px; 
            line-height: 1.3;
        }
        .distributor-section { 
            margin-bottom: 25px; 
        }
        .distributor-header { 
            font-size: 9pt; 
            margin-bottom: 15px; 
            line-height: 1.4;
        }
        .distributor-line {
            margin-bottom: 8px;
        }
        .main-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 8pt; 
            margin-bottom: 20px; 
        }
        .main-table th, .main-table td { 
            border: 1px solid black; 
            padding: 4px 6px; 
            text-align: center; 
            vertical-align: middle;
        }
        .main-table th { 
            background: #f5f5f5; 
            font-weight: bold; 
        }
        .main-table .seat-type { 
            text-align: left; 
            font-weight: normal; 
            padding-left: 8px;
        }
        .main-table .total-row { 
            background: #e8e8e8; 
            font-weight: bold; 
        }
        .main-table .header-row th:first-child {
            width: 180px;
        }
        .main-table .header-row th {
            width: 50px;
        }
        .main-table .admits-per-ticket {
            text-align: center;
            font-weight: bold;
            background: #f5f5f5;
        }
        .tax-section {
            margin-top: 25px;
        }
        .tax-table { 
            width: 60%; 
            border-collapse: collapse; 
            font-size: 8pt; 
        }
        .tax-table th, .tax-table td { 
            border: 1px solid black; 
            padding: 4px 8px; 
        }
        .tax-table th { 
            background: #f5f5f5; 
            font-weight: bold; 
            text-align: center; 
        }
        .tax-table .tax-label { 
            text-align: left; 
            font-weight: bold; 
            background: #f5f5f5;
        }
        .tax-table .tax-value { 
            text-align: right; 
        }
        .footer { 
            margin-top: 40px; 
            font-size: 7pt; 
            position: relative; 
            border-top: 1px solid black; 
            padding-top: 8px; 
        }
        .footer-left { 
            float: left; 
            line-height: 1.3;
        }
        .footer-right { 
            float: right; 
            text-align: right; 
            line-height: 1.3;
        }
        .vista-logo { 
            clear: both; 
            text-align: center; 
            margin-top: 15px; 
            font-weight: bold;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>`;

  data.forEach((movieGroup, index) => {
    htmlContent += `
    <div class="page">
        <div class="header">
            <div class="cinema-name">${movieGroup.branch}</div>
        </div>
        
        <div class="report-title">Sessions By Distributor Report</div>
        
        <div class="report-info">
            From: ${formatDateHeader(startDate)}&nbsp;&nbsp;Until: ${formatDateHeader(endDate)}&nbsp;&nbsp;Cinema: All<br>
            Distributor: MediaLoad Picture&nbsp;&nbsp;Movie Format: All&nbsp;&nbsp;Split Movie Format: Yes&nbsp;&nbsp;Show Comp Tickets: No&nbsp;&nbsp;Report Type: Daily
        </div>
`;

    const sessionContent = generateSessionContent(movieGroup, reportDate);
    htmlContent += sessionContent;

    htmlContent += generateFooter();
    htmlContent += `</div>`;

    // Add page break except for the last page
    if (index < data.length - 1) {
      htmlContent += `<div class="page-break"></div>`;
    }
  });

  htmlContent += `
</body>
</html>
  `;

  return htmlContent;
}

function generateSessionContent(
  movieGroup: {
    title: string;
    hall_name: string;
    branch: string;
    director: string;
    email_producer: string;
    reservations: MovieReservationData[];
  },
  reportDate: string,
): string {
  const { title, hall_name, branch, reservations } = movieGroup;

  // Extract dynamic time slots from actual reservations
  const uniqueTimeSlots = new Set<string>();
  reservations.forEach((r) => {
    const time = new Date(r._showtime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    uniqueTimeSlots.add(time);
  });
  const timeSlots = Array.from(uniqueTimeSlots).sort();
  const taxRate = Number(reservations.at(0)?.tax_rate || "0");

  // Use correct seat types from database
  const seatTypes = ["standard", "vip", "couple", "wheelchair"];

  // Create matrix of admits per seat type and showtime
  const admitsMatrix: { [seatType: string]: { [showtime: string]: number } } =
    {};
  const priceMatrix: { [seatType: string]: { [showtime: string]: number } } =
    {};
  const pricePerSeat: { [seatType: string]: { [showtime: string]: number } } =
    {};

  seatTypes.forEach((seatType) => {
    admitsMatrix[seatType] = {};
    priceMatrix[seatType] = {};
    pricePerSeat[seatType] = {};
    timeSlots.forEach((timeSlot) => {
      const admits = reservations.filter((r) => {
        const time = new Date(r._showtime).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return r.seat_type === seatType && time === timeSlot;
      }).length;

      const price = parseFloat(
        reservations.find((r) => {
          const time = new Date(r._showtime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return r.seat_type === seatType && time === timeSlot;
        })?.price || "0",
      );

      const totalPrice = admits * price;

      admitsMatrix[seatType][timeSlot] = admits;
      priceMatrix[seatType][timeSlot] = totalPrice;
      pricePerSeat[seatType][timeSlot] = price;
    });
  });

  // Calculate totals
  const seatTypeTotals: {
    [seatType: string]: { admits: number; price: number; totalPrice: number };
  } = {};
  const timeSlotTotals: { [timeSlot: string]: number } = {};
  let grandTotalAdmits = 0;
  let grandTotalPrice = 0;

  seatTypes.forEach((seatType) => {
    seatTypeTotals[seatType] = {
      admits: 0,
      price: 0,
      totalPrice: 0,
    };
    timeSlots.forEach((timeSlot) => {
      seatTypeTotals[seatType].admits += admitsMatrix[seatType][timeSlot];
      seatTypeTotals[seatType].price = pricePerSeat[seatType][timeSlot];
      seatTypeTotals[seatType].totalPrice += priceMatrix[seatType][timeSlot];

      timeSlotTotals[timeSlot] =
        (timeSlotTotals[timeSlot] || 0) + admitsMatrix[seatType][timeSlot];
    });
    grandTotalAdmits += seatTypeTotals[seatType].admits;
    grandTotalPrice += seatTypeTotals[seatType].totalPrice;
  });
  const netSale = taxRate > 0 ? grandTotalPrice / 1.1 : grandTotalPrice;
  const taxes = grandTotalPrice - netSale;

  return `
        <div class="distributor-section">
            <div class="distributor-header">
                <div class="distributor-line"><strong>Distributor</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${movieGroup.director}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Date</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${reportDate}</div>
                <div class="distributor-line"><strong>Film</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Movie Format</strong>&nbsp;&nbsp;2D&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Cinema</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${branch} ${hall_name}</div>
            </div>
            
            <table class="main-table">
                <thead>
                    <tr class="header-row">
                        <th rowspan="2" class="admits-per-ticket">Admits Per Ticket Type</th>
                        ${timeSlots.map((time) => `<th>${time}</th>`).join("")}
                        <th rowspan="2"><strong>Total<br>Admits</strong></th>
                        <th rowspan="2"><strong>Ticket<br>Price</strong></th>
                        <th rowspan="2"><strong>Gross</strong></th>
                    </tr>
                </thead>
                <tbody>
                    ${seatTypes
                      .map((seatType) => {
                        return `
                        <tr>
                            <td class="seat-type">${seatType}</td>
                            ${timeSlots
                              .map((timeSlot) => {
                                const admits =
                                  admitsMatrix[seatType][timeSlot] || 0;
                                return `<td>${admits > 0 ? admits : ""}</td>`;
                              })
                              .join("")}
                            <td><strong>${seatTypeTotals[seatType].admits}</strong></td>
                            <td><strong>${seatTypeTotals[seatType].price > 0 ? seatTypeTotals[seatType].price.toFixed(2) : "0.00"}</strong></td>
                            <td><strong>${seatTypeTotals[seatType].totalPrice.toFixed(2)}</strong></td>
                        </tr>
                      `;
                      })
                      .join("")}
                    <tr class="total-row">
                        <td class="seat-type"><strong>Total</strong></td>
                        ${timeSlots.map((timeSlot) => `<td><strong>${timeSlotTotals[timeSlot] || ""}</strong></td>`).join("")}
                        <td><strong>${grandTotalAdmits}</strong></td>
                        <td><strong></strong></td>
                        <td><strong>${grandTotalPrice.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div class="tax-section">
                <table class="tax-table">
                    <thead>
                        <tr>
                            <th><strong>Taxes</strong></th>
                            <th><strong></strong></th>
                            <th><strong>Sales Tax Level 1</strong></th>
                            <th><strong>Total Taxes</strong></th>
                            <th><strong>Net Box</strong></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="tax-label"><strong>Gross</strong></td>
                            <td class="tax-value">${grandTotalPrice.toFixed(2)}</td>
                            <td class="tax-value">${taxes.toFixed(2)}</td>
                            <td class="tax-value">${taxes.toFixed(2)}</td>
                            <td class="tax-value">${netSale.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td class="tax-label"><strong>Total Admits</strong></td>
                            <td class="tax-value">${grandTotalAdmits}</td>
                            <td class="tax-value"></td>
                            <td class="tax-value"></td>
                            <td class="tax-value"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
  `;
}

function generateFooter(): string {
  const now = new Date();
  const dateTime =
    now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return `
        <div class="footer">
            <div class="footer-left">
                Sessions By Distributor Report DSPOA 6.04 v.230520<br>
                V:\\ReportFiles\\movieSessionsByDistributor.rpt
            </div>
            <div class="footer-right">
                ${dateTime}<br>
                1 / 2
            </div>
            <div class="vista-logo">
                <strong>© Vista Entertainment Solutions Ltd</strong>
            </div>
        </div>
  `;
}
