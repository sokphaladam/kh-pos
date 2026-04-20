import { SeatReservation } from "@/classes/cinema/reservation";
import { drawImage } from "./canvas-draw-image";
import moment from "moment-timezone";
import { drawRealQRCode } from "./canvas-draw-qrcode";

interface CanvasSeatReservation extends Omit<SeatReservation, "price"> {
  price: string;
  cinema?: string;
}

export function canvasDrawReceipt(
  ctx: CanvasRenderingContext2D,
  reservation?: CanvasSeatReservation,
  width: number = 400,
  height: number = 500,
  callback: (() => void) | null = null
) {
  if (reservation) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // Draw border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Header - L192 logo and title
    ctx.fillStyle = "transparent";
    ctx.fillRect(20, 20, 60, 30);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    // Render logo image instead of text
    drawImage(
      ctx,
      reservation.showtime?.variant?.at(0)?.basicProduct?.images?.at(0)?.url ||
        "",
      30,
      35,
      120,
      155
    );

    ctx.fillStyle = "#000";
    ctx.font = "16px Kantumruy Pro";
    ctx.textAlign = "center";
    ctx.fillText(
      reservation.showtime?.variant?.at(0)?.basicProduct?.title || "",
      width / 1.7,
      50
    );

    ctx.font = "14px Kantumruy Pro";
    ctx.textAlign = "left";
    ctx.fillText(`Cinema: ${reservation.cinema}`, width / 2.6, 90);
    ctx.fillText(`Hall: ${reservation.showtime?.hall?.name}`, width / 2.6, 115);
    ctx.fillText(
      `Seat: ${reservation.seat?.row}${reservation.seat?.column}`,
      width / 2.6,
      140
    );
    ctx.fillText(`Date: ${reservation.showtime?.showDate}`, width / 2.6, 165);
    ctx.fillText(
      `Time: ${moment(reservation.showtime?.startTime).format(
        "HH:mm A"
      )} - ${moment(reservation.showtime?.endTime).format("HH:mm A")}`,
      width / 2.6,
      190
    );

    ctx.beginPath();
    ctx.moveTo(width - 15, 220);
    ctx.lineTo(10, 220);
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "16px Kantumruy Pro";
    ctx.textAlign = "left";
    ctx.fillText(`Tickets`, 30, 250);

    ctx.font = "14px Kantumruy Pro";
    ctx.textAlign = "left";
    ctx.fillText(`1x ${reservation.seat?.type}`, 32, 280);

    ctx.textAlign = "right";
    ctx.fillText(`${reservation.price}`, width - 32, 280);

    ctx.beginPath();
    ctx.moveTo(width - 15, 300);
    ctx.lineTo(10, 300);
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.stroke();

    // ctx.font = "14px Kantumruy Pro";
    // ctx.textAlign = "left";
    // ctx.fillText(`SubTotal`, 32, 330);

    // ctx.textAlign = "right";
    // ctx.fillText(`$${reservation.price}`, width - 32, 330);

    // ctx.textAlign = "left";
    // ctx.fillText(`Discount`, 32, 350);

    // ctx.textAlign = "right";
    // ctx.fillText(`$${0}`, width - 32, 350);

    // ctx.textAlign = "left";
    // ctx.fillText(`Total Amount`, 32, 370);

    // ctx.textAlign = "right";
    // ctx.fillText(`$${reservation.price}`, width - 32, 370);

    // QR Code
    const qrSize = 130;
    const qrX = width / 2.8;
    const qrY = 330;

    // Draw actual QR code with tracking info
    if (reservation.code) {
      drawRealQRCode(ctx, reservation.code || "", qrX, qrY, qrSize);
    }

    // TRACK label under QR
    ctx.font = "17px Kantumruy Pro";
    ctx.textAlign = "center";
    ctx.fillText(reservation.code || "", qrX + qrSize / 2, qrY + qrSize + 15);
  }
  if (callback) {
    callback();
  }
}
