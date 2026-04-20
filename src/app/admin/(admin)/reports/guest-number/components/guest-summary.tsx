import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import moment from "moment-timezone";

interface GuestNumberData {
  type: string;
  date: string | null;
  hour: string | null;
  total_guests: number;
}

export function GuestSummaryCards({ data }: { data: GuestNumberData[] }) {
  const totalGuests =
    data.find((item) => item.type === "guest_total")?.total_guests || 0;
  const dailyData = data.filter((item) => item.type === "guest_date");
  const hourlyData = data.filter((item) => item.type === "guest_time");

  const averageGuestsPerDay =
    dailyData.length > 0 ? Math.round(totalGuests / dailyData.length) : 0;

  const peakHour = hourlyData.reduce(
    (peak, current) =>
      current.total_guests > peak.total_guests ? current : peak,
    hourlyData[0] || { hour: "N/A", total_guests: 0 }
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardDescription className="text-blue-600">
            Total Guests
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-blue-700">
            {totalGuests.toLocaleString()}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardDescription className="text-green-600">
            Daily Average
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-green-700">
            {averageGuestsPerDay.toLocaleString()}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardDescription className="text-orange-600">
            Peak Hour
          </CardDescription>
          <CardTitle className="text-2xl font-bold text-orange-700">
            {peakHour.hour
              ? moment(peakHour.hour, "HH:mm:ss").format("h:mm A")
              : "N/A"}
          </CardTitle>
          <CardDescription className="text-sm text-orange-600">
            {peakHour.total_guests} guests
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
