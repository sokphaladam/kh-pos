import moment from "@/lib/moment";
import { useQueryHotHourReport } from "@/app/hooks/user-query-report";
import { DateRange } from "react-day-picker";
import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  dateRange: DateRange | undefined;
}

interface HotHourData {
  week_of_day: number;
  hore_of_week: number;
  total_qty: number;
  total_amount: number;
}

export function HotHour(props: Props) {
  const { formatForDisplay } = useCurrencyFormat();
  const date = useMemo(() => {
    return {
      startDate:
        moment(props.dateRange?.from).format("YYYY-MM-DD") + " 00:00:00",
      endDate: moment(props.dateRange?.to).format("YYYY-MM-DD") + " 23:59:59",
    };
  }, [props]);

  const { data, isLoading, error } = useQueryHotHourReport({
    startDate: date.startDate,
    endDate: date.endDate,
  });

  const hotHourData = data?.result as HotHourData[] | undefined;

  // Create a matrix for the heatmap and filter hours with data
  const { heatmapMatrix, activeHours } = useMemo(() => {
    if (!hotHourData || hotHourData.length === 0)
      return { heatmapMatrix: [], activeHours: [] };

    // Get hours that have data
    const hoursWithData = new Set(hotHourData.map((item) => item.hore_of_week));
    const sortedActiveHours = Array.from(hoursWithData).sort((a, b) => a - b);

    // Initialize matrix with zeros only for active hours
    const matrix: Array<
      Array<{ qty: number; amount: number; intensity: number }>
    > = [];

    sortedActiveHours.forEach((hour) => {
      matrix[hour] = [];
      for (let day = 0; day < 7; day++) {
        matrix[hour][day] = { qty: 0, amount: 0, intensity: 0 };
      }
    });

    // Find max values for normalization
    let maxQty = 0;
    let maxAmount = 0;
    hotHourData.forEach((item) => {
      maxQty = Math.max(maxQty, item.total_qty);
      maxAmount = Math.max(maxAmount, item.total_amount);
    });

    // Fill matrix with data
    hotHourData.forEach((item) => {
      const hour = item.hore_of_week;
      const day = item.week_of_day;
      if (hour >= 0 && hour < 24 && day >= 0 && day < 7 && matrix[hour]) {
        matrix[hour][day] = {
          qty: item.total_qty,
          amount: item.total_amount,
          intensity: maxQty > 0 ? item.total_qty / maxQty : 0,
        };
      }
    });

    return { heatmapMatrix: matrix, activeHours: sortedActiveHours };
  }, [hotHourData]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Get intensity color class
  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-50 dark:bg-gray-800";
    if (intensity <= 0.2) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (intensity <= 0.4) return "bg-emerald-200 dark:bg-emerald-800/40";
    if (intensity <= 0.6) return "bg-emerald-300 dark:bg-emerald-700/50";
    if (intensity <= 0.8) return "bg-emerald-400 dark:bg-emerald-600/60";
    return "bg-emerald-500 dark:bg-emerald-500/70";
  };

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Hot Hour
          </h3>
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Hot Hour
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Failed to load data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Hot Hour
          </h3>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-hidden">
        <div className="min-w-0">
          {/* Day labels */}
          <div className="flex mb-1 sm:mb-2">
            <div className="w-8 sm:w-10"></div> {/* Space for hour labels */}
            {dayLabels.map((day) => (
              <div
                key={day}
                className="flex-1 min-w-0 text-center text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-0.5 sm:space-y-1">
            {activeHours.map((hour) => (
              <div key={hour} className="flex items-center">
                {/* Hour label */}
                <div className="w-8 sm:w-10 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 text-right pr-1 sm:pr-2 flex-shrink-0">
                  {String(hour).padStart(2, "0")}:00
                </div>

                {/* Day cells */}
                <div className="flex-1 flex gap-0.5 sm:gap-1">
                  {heatmapMatrix[hour]?.map((cell, day) => {
                    // Dynamic tooltip positioning logic
                    const hourIndex = activeHours.indexOf(hour);
                    const isFirstHalf = hourIndex < activeHours.length / 2;
                    const isLeftSide = day <= 1;
                    const isRightSide = day >= 5;

                    // Determine tooltip position based on cell location
                    let tooltipPosition = "";
                    let arrowPosition = "";

                    if (isLeftSide) {
                      // Show tooltip to the right for left-side cells
                      tooltipPosition =
                        "left-full top-1/2 transform -translate-y-1/2 ml-2";
                      arrowPosition =
                        "absolute right-full top-1/2 transform -translate-y-1/2 border-2 border-transparent border-r-gray-900 dark:border-r-gray-100";
                    } else if (isRightSide) {
                      // Show tooltip to the left for right-side cells
                      tooltipPosition =
                        "right-full top-1/2 transform -translate-y-1/2 mr-2";
                      arrowPosition =
                        "absolute left-full top-1/2 transform -translate-y-1/2 border-2 border-transparent border-l-gray-900 dark:border-l-gray-100";
                    } else if (isFirstHalf) {
                      // Show tooltip below for top cells
                      tooltipPosition =
                        "top-full left-1/2 transform -translate-x-1/2 mt-2";
                      arrowPosition =
                        "absolute bottom-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-b-gray-900 dark:border-b-gray-100";
                    } else {
                      // Show tooltip above for bottom cells (default)
                      tooltipPosition =
                        "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
                      arrowPosition =
                        "absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900 dark:border-t-gray-100";
                    }

                    return (
                      <div
                        key={`${hour}-${day}`}
                        className={`flex-1 h-3 sm:h-4 rounded-sm ${getIntensityColor(
                          cell.intensity
                        )} 
                          transition-all duration-200 hover:scale-110 hover:z-10 relative
                          cursor-pointer group`}
                        title={`${dayLabels[day]} ${String(hour).padStart(
                          2,
                          "0"
                        )}:00: ${cell.qty} items, ${formatForDisplay(
                          cell.amount
                        )}`}
                      >
                        {/* Dynamic positioned tooltip */}
                        <div
                          className={`absolute ${tooltipPosition}
                          bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] sm:text-xs rounded py-1 px-2
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                          whitespace-nowrap z-20`}
                        >
                          <div className="font-semibold">
                            {dayLabels[day]} {String(hour).padStart(2, "0")}:00
                          </div>
                          <div>Items: {cell.qty}</div>
                          <div>Sales: {formatForDisplay(cell.amount)}</div>
                          <div className={arrowPosition}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Statistics */}
          {hotHourData && hotHourData.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Peak Hour:
                  </span>
                  <span className="sm:ml-2 font-semibold text-emerald-600">
                    {(() => {
                      const peak = hotHourData.reduce((max, item) =>
                        item.total_qty > max.total_qty ? item : max
                      );
                      return `${dayLabels[peak.week_of_day]} ${String(
                        peak.hore_of_week
                      ).padStart(2, "0")}:00`;
                    })()}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Items:
                  </span>
                  <span className="sm:ml-2 font-semibold text-gray-900 dark:text-white">
                    {hotHourData
                      .reduce((sum, item) => sum + item.total_qty, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* No data state */}
          {(!hotHourData || hotHourData.length === 0) && (
            <div className="mt-6 sm:mt-8 text-center text-gray-500 dark:text-gray-400">
              <Clock className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">
                No activity data available for this period
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
