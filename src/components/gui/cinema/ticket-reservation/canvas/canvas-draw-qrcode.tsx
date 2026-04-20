import QRCode from "qrcode";

// Helper: draw real QR code
export async function drawRealQRCode(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number
) {
  try {
    // Save current canvas state
    ctx.save();

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Create image element
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    };
    img.src = qrDataURL;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    // Fallback to simple rectangle if QR generation fails
    ctx.strokeStyle = "#000";
    ctx.strokeRect(x, y, size, size);
    ctx.restore();
  }
}
