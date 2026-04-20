import { ProductImage } from "@/repository/product-image-repository";
import { createDialog } from "../create-dialog";
import { DialogHeader, DialogTitle } from "../ui/dialog";
import { ImageWithFallback } from "../image-with-fallback";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Card, CardContent } from "../ui/card";
import { useEffect, useState } from "react";

export const productDialog = createDialog<{ image: ProductImage[] }, unknown>(
  ({ image }) => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

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

    return (
      <>
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row justify-center">
          <div>
            <Carousel className="w-full max-w-xs" setApi={setApi}>
              <CarouselContent>
                {image.map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <ImageWithFallback
                            alt="Product image"
                            className="w-[300px] h-[300px] rounded-md object-contain text-xs"
                            height={300}
                            src={_.url}
                            width={300}
                            title={""}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {image.length > 1 && <CarouselPrevious />}
              {image.length > 1 && <CarouselNext />}
            </Carousel>
            <div className="py-2 text-center text-sm text-muted-foreground">
              Slide {current} of {count}
            </div>
          </div>
        </div>
      </>
    );
  },
  { defaultValue: null }
);
