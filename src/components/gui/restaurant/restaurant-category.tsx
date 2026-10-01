import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRestaurant } from "./contexts/restaurant-context";
import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  PROMOTIONS_CATEGORY,
  useRunningPromotionSets,
} from "./promotion/restaurant-promotion-cards";

interface Props {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  variant?: "sidebar" | "horizontal";
  className?: string;
}

export function RestaurantCategory(props: Props) {
  const { variant = "horizontal", className } = props;
  const { state, loading } = useRestaurant();
  const tPromo = useTranslations("discount.promotionSet.pos");
  const hasPromotions = useRunningPromotionSets().length > 0;
  const categories = useMemo(
    () => state.categories.filter((f) => (f.forSaleCount || 0) > 0) || [],
    [state.categories],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Check scroll position and update button states
  const checkScrollButtons = useCallback(() => {
    if (scrollRef.current) {
      const {
        scrollLeft,
        scrollWidth,
        clientWidth,
        scrollTop,
        scrollHeight,
        clientHeight,
      } = scrollRef.current;

      if (variant === "horizontal") {
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      } else {
        setCanScrollUp(scrollTop > 0);
        setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
      }
    }
  }, [variant]);

  useEffect(() => {
    checkScrollButtons();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", checkScrollButtons);
      return () => element.removeEventListener("scroll", checkScrollButtons);
    }
  }, [categories, variant, checkScrollButtons]);

  const scrollTabs = (direction: "left" | "right" | "up" | "down") => {
    if (scrollRef.current && !isScrolling) {
      setIsScrolling(true);
      const scrollAmount = 200;
      const element = scrollRef.current;

      if (direction === "left" || direction === "right") {
        element.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      } else {
        element.scrollBy({
          top: direction === "up" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }

      // Reset scrolling state after animation
      setTimeout(() => setIsScrolling(false), 300);
    }
  };

  if (loading || categories.length === 0) {
    if (variant === "sidebar") {
      return (
        <div
          className={cn(
            "bg-card border-r border-border p-4 space-y-3",
            className,
          )}
        >
          <div className="text-sm font-medium text-foreground mb-3">
            Categories
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-9 bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
      );
    }

    return (
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <div className="flex gap-2 min-w-fit">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-8 w-20 bg-muted animate-pulse rounded-md flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant for desktop
  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "bg-card border-r border-border p-4 relative",
          className,
        )}
        // style={{ height: height - 75 }}
      >
        <div className="text-sm font-medium text-foreground mb-3">Categories</div>

        {/* Up Scroll Button */}
        {canScrollUp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollTabs("up")}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-10 h-6 w-8 p-0 bg-card/90 border shadow-sm hover:bg-card hover:shadow-md transition-all duration-200"
            disabled={isScrolling}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}

        {/* Down Scroll Button */}
        {canScrollDown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollTabs("down")}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 h-6 w-8 p-0 bg-card/90 border shadow-sm hover:bg-card hover:shadow-md transition-all duration-200"
            disabled={isScrolling}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}

        <div
          ref={scrollRef}
          className="overflow-y-auto scrollbar-hide space-y-2"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {/* All Categories Button */}
          <Button
            key="all"
            variant={props.selectedCategory === "All" ? "default" : "ghost"}
            size="sm"
            onClick={() => props.setSelectedCategory("All")}
            className={cn(
              "w-full justify-start transition-all duration-200 text-base",
              props.selectedCategory === "All"
                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                : "hover:bg-muted text-foreground/80 hover:text-foreground",
            )}
          >
            All Categories
          </Button>

          {/* Promotion sets running now */}
          {hasPromotions && (
            <Button
              key={PROMOTIONS_CATEGORY}
              variant={
                props.selectedCategory === PROMOTIONS_CATEGORY
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() => props.setSelectedCategory(PROMOTIONS_CATEGORY)}
              className={cn(
                "w-full justify-start gap-2 transition-all duration-200 text-base",
                props.selectedCategory === PROMOTIONS_CATEGORY
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "text-primary hover:bg-primary/10",
              )}
            >
              <Gift className="h-4 w-4" />
              {tPromo("category")}
            </Button>
          )}

          {/* Category Buttons */}
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={
                props.selectedCategory === category.id ? "default" : "ghost"
              }
              size="sm"
              onClick={() => props.setSelectedCategory(category.id)}
              className={cn(
                "w-full justify-start transition-all duration-200 text-base",
                props.selectedCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  : "hover:bg-muted text-foreground/80 hover:text-foreground",
              )}
            >
              {category.title}
            </Button>
          ))}
        </div>

        {/* Gradient Fade Indicators */}
        {canScrollUp && (
          <div className="absolute top-16 left-0 right-0 h-8 pointer-events-none" />
        )}
        {canScrollDown && (
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" />
        )}
      </div>
    );
  }

  // Horizontal variant for mobile
  return (
    <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="relative px-4 py-3">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollTabs("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-card/90 border shadow-sm hover:bg-card hover:shadow-md transition-all duration-200"
            disabled={isScrolling}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollTabs("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-card/90 border shadow-sm hover:bg-card hover:shadow-md transition-all duration-200"
            disabled={isScrolling}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Category Tabs Container */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
        >
          <div className="flex gap-2 min-w-fit pb-1">
            {/* All Categories Button */}
            <Button
              key="all"
              variant={props.selectedCategory === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => props.setSelectedCategory("All")}
              className={cn(
                "whitespace-nowrap transition-all duration-200 flex-shrink-0 relative text-base",
                props.selectedCategory === "All"
                  ? "bg-primary text-primary-foreground shadow-sm border-primary hover:bg-primary/90"
                  : "hover:bg-muted/40 border-border hover:border-input hover:shadow-sm",
              )}
            >
              All Categories
            </Button>

            {/* Promotion sets running now */}
            {hasPromotions && (
              <Button
                key={PROMOTIONS_CATEGORY}
                variant={
                  props.selectedCategory === PROMOTIONS_CATEGORY
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => props.setSelectedCategory(PROMOTIONS_CATEGORY)}
                className={cn(
                  "whitespace-nowrap transition-all duration-200 flex-shrink-0 relative text-base gap-1.5",
                  props.selectedCategory === PROMOTIONS_CATEGORY
                    ? "bg-primary text-primary-foreground shadow-sm border-primary hover:bg-primary/90"
                    : "border-primary/40 text-primary hover:bg-primary/10",
                )}
              >
                <Gift className="h-4 w-4" />
                {tPromo("category")}
              </Button>
            )}

            {/* Category Buttons */}
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  props.selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => props.setSelectedCategory(category.id)}
                className={cn(
                  "whitespace-nowrap transition-all duration-200 flex-shrink-0 relative text-base",
                  props.selectedCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-sm border-primary hover:bg-primary/90"
                    : "hover:bg-muted/40 border-border hover:border-input hover:shadow-sm",
                )}
              >
                {category.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Gradient Fade Indicators */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
