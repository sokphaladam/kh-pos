"use client";

import { useQueryOrder } from "@/app/hooks/use-query-order";
import { CanvasDraw } from "@/components/gui/cinema/ticket-reservation/canvas/canvas-draw";
import { canvasDrawReceipt } from "@/components/gui/cinema/ticket-reservation/canvas/canvas-drawer-receipt";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TicketReservationStorybookPage() {
  const isMobile = useIsMobile();
  const { data } = useQueryOrder("699b98e0-a1f0-46d6-babe-3725eb34fd53");

  const reservation = data?.result?.orderDetail
    .map((od) => od.reservation?.flat())
    .flat();

  return (
    <div className="p-4">
      {reservation?.map((x, i) => {
        if (!x || !x.showtimeId) return null;
        return (
          <CanvasDraw
            draw={(ctx) =>
              canvasDrawReceipt(
                ctx,
                {
                  ...x,
                  price: `$${x.price}`,
                  cinema: "Testing",
                  id: "1234",
                  showtimeId: x.showtimeId,
                },
                isMobile ? 400 : 460,
                625
              )
            }
            width={isMobile ? "400" : "460"}
            height="625"
            key={i}
          />
        );
      })}
    </div>
  );
}
