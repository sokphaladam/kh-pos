async function urlToBase64(url: string, isLocal?: boolean): Promise<string> {
  const fetchUrl = isLocal
    ? url
    : "/api/image-proxy?url=" + encodeURIComponent(url);
  const response = await fetch(fetchUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result?.toString() || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper: draw image
export async function drawImage(
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  x: number,
  y: number,
  width: number,
  height: number,
  isLocal?: boolean,
) {
  try {
    ctx.save();

    const proxyUrl = await urlToBase64(imageUrl, isLocal);

    // Create image element
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS if needed
    img.style.objectFit = "contain";
    img.style.width = `${width}px`;
    img.style.height = `auto`;
    img.src = proxyUrl;

    img.onload = () => {
      // Draw image with specified dimensions
      ctx.drawImage(img, x, y, width, height);

      // Optional: Add border around image
      ctx.strokeStyle = "transparent";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);

      ctx.restore();
    };

    img.onerror = (err) => {
      console.log("Image failed to load:", err);
    };

    // Start loading the image
    // img.src = imageUrl;
  } catch (error) {
    console.error("Failed to load image:", error);

    // Draw placeholder rectangle
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Error", x + width / 2, y + height / 2);

    ctx.restore();
  }
}
