import { table_customer_order } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const guestNumberOrderReport = withAuthApi<
  unknown,
  unknown,
  ResponseType<unknown[]>,
  { startDate?: string; endDate?: string }
>(async ({ db, searchParams }) => {
  const query = db.table<table_customer_order>("customer_order");

  if (searchParams?.startDate && searchParams?.endDate) {
    query.whereBetween("created_at", [
      searchParams.startDate,
      searchParams.endDate,
    ]);
  }

  const items = await query
    .clone()
    .select(
      db.raw("DATE(customer_order.created_at) as report_date"),
      db.raw("HOUR(customer_order.created_at) as report_hour"),
      db.raw("SUM(customer_order.customer) as total_guests")
    )
    .groupByRaw(
      "DATE(customer_order.created_at), HOUR(customer_order.created_at)"
    )
    .orderBy([{ column: "report_date" }, { column: "report_hour" }]);

  const result: {
    type: string;
    date: string | null;
    hour: string | null;
    total_guests: number;
  }[] = [
    {
      type: "guest_total",
      date: `${
        items.at(0)?.report_date
          ? Formatter.date(items.at(0)?.report_date)
          : null
      } - ${
        items.at(-1)?.report_date
          ? Formatter.date(items.at(-1)?.report_date)
          : null
      }`,
      hour: null,
      total_guests: items.reduce(
        (acc, item) => acc + Number(item.total_guests),
        0
      ),
    },
  ];

  const groupByDate = items.reduce(
    (acc: Record<string, typeof items>, item) => {
      const date: string = Formatter.date(item.report_date) || "";
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  for (const date of Object.keys(groupByDate)) {
    const dailyItems = groupByDate[date];
    result.push({
      type: "guest_date",
      date,
      hour: null,
      total_guests: dailyItems.reduce(
        (acc, item) => acc + Number(item.total_guests),
        0
      ),
    });

    for (const item of dailyItems) {
      result.push({
        type: "guest_time",
        date: item.report_date ? Formatter.date(item.report_date) : null,
        hour: item.report_hour,
        total_guests: Number(item.total_guests),
      });
    }
  }

  return NextResponse.json(
    {
      success: true,
      result,
      error: "",
    },
    { status: 200 }
  );
});
