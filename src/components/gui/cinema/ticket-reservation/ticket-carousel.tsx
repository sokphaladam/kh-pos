import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { CanvasDraw } from "./canvas/canvas-draw";
import { canvasDrawReceipt } from "./canvas/canvas-drawer-receipt";
import { useEffect, useMemo, useState } from "react";
import { Order } from "@/classes/order";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { useAuthentication } from "contexts/authentication-context";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Share2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  order: Order | null;
}

export function TicketCarousel({ order }: Props) {
  const isMobile = useIsMobile();
  const { formatForDisplay } = useCurrencyFormat();
  const { currentWarehouse } = useAuthentication();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<
    "save" | "share" | null
  >(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const booking = useMemo(() => {
    const items = [];

    for (const item of order?.items || []) {
      for (const res of item.reservation || []) {
        items.push({
          ...res,
          price: formatForDisplay(res.price || "0"),
          cinema: currentWarehouse?.name,
        });
      }
    }
    return items;
  }, [order, formatForDisplay, currentWarehouse]);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const captureReceipt = async (callback: BlobCallback) => {
    const canvas = document.getElementById(
      `canvas-draw-${current - 1}`
    ) as HTMLCanvasElement | null;
    canvas?.toBlob(callback, "image/png");
  };

  const blobToFile = (blob: Blob): File => {
    const fileName = `receipt-${Date.now()}.png`;
    const mimeType = blob.type || "image/png";
    return new File([blob], fileName, { type: mimeType });
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const onSaveReceipt = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingAction("save");

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        captureReceipt((b) => resolve(b));
      });

      if (!blob) {
        toast.error("Failed to generate receipt image");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cinema-ticket-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Ticket receipt saved successfully");
    } catch (error) {
      console.error("Error saving receipt:", error);
      toast.error("Failed to save receipt");
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const onShareReceipt = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingAction("share");

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        captureReceipt((b) => resolve(b));
      });

      if (!blob) {
        toast.error("Failed to generate receipt image");
        return;
      }

      if (isMobile && navigator.share) {
        // For mobile, try sharing directly
        try {
          const file = blobToFile(blob);

          // Check if files can be shared
          const canShareFiles =
            navigator.canShare && navigator.canShare({ files: [file] });

          if (canShareFiles) {
            await navigator.share({
              files: [file],
              title: "Cinema Ticket Receipt",
              text: "Cinema ticket receipt",
            });
            toast.success("Receipt shared successfully");
            return;
          } else {
            // If can't share files, convert to data URL and share that
            const dataUrl = await blobToDataURL(blob);
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `cinema-ticket-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(
              "Receipt downloaded. Please share from your gallery."
            );
            return;
          }
        } catch (shareError) {
          console.log("Share failed, trying download:", shareError);
          // Fall through to download
        }
      }

      // For desktop or if mobile share failed, try clipboard then download
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          toast.success("Receipt copied to clipboard");
          return;
        } catch (clipboardError) {
          console.log("Clipboard failed:", clipboardError);
          // Fall through to download
        }
      }

      // Final fallback: download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cinema-ticket-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Error sharing receipt:", error);
      toast.error("Failed to share receipt");
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Controls Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => api?.scrollPrev()}
                disabled={current === 1 || count === 0}
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0"
                aria-label="Previous ticket"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="px-3 py-1 text-sm font-medium text-muted-foreground bg-muted rounded-md min-w-[80px] text-center">
                {count > 0 ? `${current} of ${count}` : "No tickets"}
              </div>

              <Button
                onClick={() => api?.scrollNext()}
                disabled={current === count || count === 0}
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0"
                aria-label="Next ticket"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onShareReceipt}
                disabled={isProcessing || count === 0}
                size="sm"
                variant="secondary"
                className="gap-2"
              >
                {processingAction === "share" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {processingAction === "share" ? "Sharing..." : "Share"}
              </Button>

              <Button
                onClick={onSaveReceipt}
                disabled={isProcessing || count === 0}
                size="sm"
                className="gap-2"
              >
                {processingAction === "save" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {processingAction === "save" ? "Saving..." : "Download"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carousel Section */}
      <div className="flex justify-center">
        <Carousel
          setApi={setApi}
          className="w-full max-w-md"
          opts={{
            align: "center",
            loop: false,
          }}
          style={{ maxWidth: isMobile ? 400 : 460 }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {booking.length > 0 ? (
              booking.map((book, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4">
                  <div className="relative">
                    <Card className="overflow-hidden shadow-lg">
                      <CardContent className="p-0">
                        <CanvasDraw
                          draw={(ctx) =>
                            canvasDrawReceipt(
                              ctx,
                              book,
                              isMobile ? 400 : 460,
                              525
                            )
                          }
                          width={isMobile ? "400" : "460"}
                          height="525"
                          id={`canvas-draw-${index}`}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem className="pl-2 md:pl-4">
                <Card className="w-full">
                  <CardContent className="flex aspect-[460/525] items-center justify-center p-6">
                    <div className="text-center text-muted-foreground">
                      <div className="text-lg font-medium mb-2">
                        No tickets available
                      </div>
                      <div className="text-sm">
                        Complete your booking to view tickets
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
