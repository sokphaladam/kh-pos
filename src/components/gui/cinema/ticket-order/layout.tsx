"use client";

import { useMutationManualTicketOrder } from "@/app/hooks/cinema/use-query-ticket-ordet";
import { useLazyPublicProductList } from "@/app/hooks/use-query-product";
import { useQueryHallList } from "@/app/hooks/cinema/use-query-hall";
import { useAuthentication } from "contexts/authentication-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle, Trash2, Clock, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeColumn = { id: string; time: string };

type TicketRow = {
  id: string;
  movieId: string;
  hallId: string;
  showdate: string;
  basePrice: string;
  tickets: Record<string, string>; // timeColumnId → ticket count
};

function makeRow(): TicketRow {
  return {
    id: crypto.randomUUID(),
    movieId: "",
    hallId: "",
    showdate: "",
    basePrice: "",
    tickets: {},
  };
}

function makeTimeColumn(): TimeColumn {
  return { id: crypto.randomUUID(), time: "" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeaderTimeCell({
  col,
  onChange,
  onRemove,
  isOnly,
}: {
  col: TimeColumn;
  onChange: (id: string, time: string) => void;
  onRemove: (id: string) => void;
  isOnly: boolean;
}) {
  return (
    <th className="px-2 py-2 min-w-[120px] border-r border-border last:border-r-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          <Input
            type="time"
            value={col.time}
            onChange={(e) => onChange(col.id, e.target.value)}
            className="h-7 text-xs py-0 px-1 text-center"
            placeholder="HH:MM"
          />
          {!isOnly && (
            <button
              type="button"
              onClick={() => onRemove(col.id)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title="Remove time column"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground text-center leading-tight">
          Tickets
        </span>
      </div>
    </th>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TicketOrderLayout() {
  const { trigger, isMutating } = useMutationManualTicketOrder();
  const { user } = useAuthentication();

  const [triggerMovieSearch, movieQuery] = useLazyPublicProductList({
    categoryKeys: "movies-category-id",
    limit: 200,
    warehouse: user?.currentWarehouseId,
  });
  const { data: hallData } = useQueryHallList(100, 0, ["active"]);

  const movies = useMemo(
    () => movieQuery.data?.result ?? [],
    [movieQuery.data?.result],
  );
  const halls = useMemo(
    () => hallData?.result?.data ?? [],
    [hallData?.result?.data],
  );

  const [rows, setRows] = useState<TicketRow[]>([makeRow()]);
  const [timeCols, setTimeCols] = useState<TimeColumn[]>([makeTimeColumn()]);

  useEffect(() => {
    triggerMovieSearch();
  }, [triggerMovieSearch]);

  // ── Row helpers ────────────────────────────────────────────────────────────

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );

  // ── Seat capacity helper ──────────────────────────────────────────────────

  const getHallCapacity = useCallback(
    (hallId: string): number | undefined => {
      const hall = halls.find((h) => h.id === hallId);
      if (!hall) return undefined;
      return hall.seats.filter((s) => s.type !== "blocked").length;
    },
    [halls],
  );

  // ── Row helpers ────────────────────────────────────────────────────────────

  const updateRow = useCallback(
    (
      id: string,
      field: keyof Omit<TicketRow, "id" | "tickets">,
      value: string,
    ) =>
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          // Reset ticket counts when hall changes to avoid stale over-capacity values
          if (field === "hallId") return { ...r, hallId: value, tickets: {} };
          return { ...r, [field]: value };
        }),
      ),
    [],
  );

  const updateTicket = useCallback(
    (rowId: string, colId: string, value: string) =>
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const capacity =
            halls
              .find((h) => h.id === r.hallId)
              ?.seats.filter((s) => s.type !== "blocked").length ?? Infinity;
          const clamped =
            value === ""
              ? ""
              : String(Math.min(Math.max(0, Number(value)), capacity));
          return { ...r, tickets: { ...r.tickets, [colId]: clamped } };
        }),
      ),
    [halls],
  );

  // ── Column helpers ─────────────────────────────────────────────────────────

  const addTimeCol = () => setTimeCols((prev) => [...prev, makeTimeColumn()]);

  const removeTimeCol = (id: string) =>
    setTimeCols((prev) => prev.filter((c) => c.id !== id));

  const updateTimeCol = (id: string, time: string) =>
    setTimeCols((prev) => prev.map((c) => (c.id === id ? { ...c, time } : c)));

  // ── Form completeness ─────────────────────────────────────────────────────

  const isFormComplete = useMemo(() => {
    if (
      rows.some(
        (r) =>
          !r.movieId ||
          !r.hallId ||
          !r.showdate ||
          !r.basePrice ||
          isNaN(Number(r.basePrice)),
      )
    )
      return false;
    if (timeCols.some((c) => !c.time)) return false;
    return rows.some((r) =>
      timeCols.some((c) => Number(r.tickets[c.id] ?? 0) > 0),
    );
  }, [rows, timeCols]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const payload = rows.map((row) => ({
      movieId: row.movieId,
      showdate: row.showdate,
      hallId: row.hallId,
      basePrice: Number(row.basePrice),
      showtimes: timeCols
        .filter((col) => Number(row.tickets[col.id] ?? 0) > 0)
        .map((col) => ({
          datetime: `${row.showdate} ${col.time}:00`,
          ticket: Number(row.tickets[col.id] ?? 0),
        })),
    }));

    try {
      const res = await trigger(payload);
      if (res?.success) {
        toast.success("Tickets uploaded successfully.");
        setRows([makeRow()]);
        setTimeCols([makeTimeColumn()]);
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const FIXED_COL_CLASS =
    "px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="w-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Manual Ticket Upload</h2>
          <p className="text-sm text-muted-foreground">
            Fill in each row to upload showtimes and ticket quantities.
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isFormComplete || isMutating}
          title={
            !isFormComplete
              ? "Fill in all fields and add at least one ticket"
              : undefined
          }
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {isMutating ? "Uploading…" : "Upload Tickets"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-auto">
        <table className="w-full text-sm border-collapse">
          {/* ── Table head ── */}
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {/* Fixed columns */}
              <th
                className={cn(
                  FIXED_COL_CLASS,
                  "w-8 text-center border-r border-border",
                )}
              >
                #
              </th>
              <th
                className={cn(
                  FIXED_COL_CLASS,
                  "min-w-[180px] border-r border-border",
                )}
              >
                Movie
              </th>
              <th
                className={cn(
                  FIXED_COL_CLASS,
                  "min-w-[140px] border-r border-border",
                )}
              >
                Hall
              </th>
              <th
                className={cn(
                  FIXED_COL_CLASS,
                  "min-w-[140px] border-r border-border",
                )}
              >
                Show Date
              </th>
              <th
                className={cn(
                  FIXED_COL_CLASS,
                  "min-w-[110px] border-r border-border",
                )}
              >
                Base Price
              </th>

              {/* Dynamic time columns */}
              {timeCols.map((col) => (
                <HeaderTimeCell
                  key={col.id}
                  col={col}
                  onChange={updateTimeCol}
                  onRemove={removeTimeCol}
                  isOnly={timeCols.length === 1}
                />
              ))}

              {/* Add time column button */}
              <th className="px-2 py-2 text-center w-10">
                <button
                  type="button"
                  onClick={addTimeCol}
                  className="inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
                  title="Add time column"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </th>

              {/* Remove row column - spacer */}
              <th className="w-8" />
            </tr>
          </thead>

          {/* ── Table body ── */}
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border transition-colors align-top",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                  "hover:bg-primary/5",
                )}
              >
                {/* Row number */}
                <td className="px-3 py-1.5 text-center text-xs text-muted-foreground border-r border-border">
                  {idx + 1}
                </td>

                {/* Movie select */}
                <td className="px-2 py-1.5 border-r border-border">
                  <Select
                    value={row.movieId}
                    onValueChange={(v) => updateRow(row.id, "movieId", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select movie…" />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((m) => (
                        <SelectItem
                          key={m.variantId}
                          value={m.variantId}
                          className="text-xs"
                        >
                          {m.productTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Hall select */}
                <td className="px-2 py-1.5 border-r border-border">
                  <Select
                    value={row.hallId}
                    onValueChange={(v) => updateRow(row.id, "hallId", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select hall…" />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={h.id} className="text-xs">
                          {h.name} (
                          {h.seats.filter((f) => f.type !== "blocked").length}{" "}
                          seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>

                {/* Show date */}
                <td className="px-2 py-1.5 border-r border-border">
                  <Input
                    type="date"
                    value={row.showdate}
                    onChange={(e) =>
                      updateRow(row.id, "showdate", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </td>

                {/* Base price */}
                <td className="px-2 py-1.5 border-r border-border">
                  <Input
                    type="number"
                    min={0}
                    value={row.basePrice}
                    onChange={(e) =>
                      updateRow(row.id, "basePrice", e.target.value)
                    }
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </td>

                {/* Ticket count per time column */}
                {timeCols.map((col) => {
                  const capacity = getHallCapacity(row.hallId);
                  const val = Number(row.tickets[col.id] ?? 0);
                  const atMax =
                    capacity !== undefined && val > 0 && val >= capacity;
                  return (
                    <td
                      key={col.id}
                      className="px-2 py-1.5 border-r border-border last:border-r-0"
                    >
                      <div className="flex flex-col gap-0.5">
                        <Input
                          type="number"
                          min={0}
                          max={capacity}
                          value={row.tickets[col.id] ?? ""}
                          onChange={(e) =>
                            updateTicket(row.id, col.id, e.target.value)
                          }
                          placeholder="0"
                          className={cn(
                            "h-8 text-xs w-full min-w-[80px]",
                            atMax &&
                              "border-amber-400 focus-visible:ring-amber-400/30",
                          )}
                        />
                        {capacity !== undefined && (
                          <span
                            className={cn(
                              "text-[10px] text-center leading-tight",
                              atMax
                                ? "text-amber-500 font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            max {capacity}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Spacer for add-column th */}
                <td />

                {/* Remove row */}
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className={cn(
                      "text-muted-foreground transition-colors",
                      rows.length === 1
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:text-destructive",
                    )}
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          {/* ── Add row footer ── */}
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td colSpan={5 + timeCols.length + 2} className="px-3 py-2">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add row
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          {rows.length} row{rows.length !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>
          {timeCols.length} showtime{timeCols.length !== 1 ? "s" : ""} per row
        </span>
        <span>·</span>
        <span>
          {rows.reduce(
            (acc, r) =>
              acc +
              timeCols.reduce(
                (s, c) => s + (Number(r.tickets[c.id] ?? 0) || 0),
                0,
              ),
            0,
          )}{" "}
          total tickets
        </span>
        {!isFormComplete && (
          <>
            <span>·</span>
            <span className="text-amber-500">
              Fill all fields and add at least one ticket to enable upload.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
