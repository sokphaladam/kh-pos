import { useCallback, useEffect, useRef, useState } from "react";
import { usePOSTabContext } from "../context/pos-tab-context";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  ShoppingBag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POSContent } from "../layout-pos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermission } from "@/hooks/use-permissions";

export function POSTab() {
  const permission = usePermission("pos");
  const { tabs, onActiveTab, onNewTab, onCloseTab, sleep } = usePOSTabContext();
  const currentActive = tabs.find((f) => f.active);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const onChangeOpen = useCallback((state: boolean) => {
    if (!state) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
    setOpen(state);
  }, []);

  const checkScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        direction === "left"
          ? tabsContainerRef.current.scrollLeft - scrollAmount
          : tabsContainerRef.current.scrollLeft + scrollAmount;

      tabsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    checkScrollButtons();
  }, [tabs]);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);

      return () => {
        container.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, []);

  const canDelete = permission.includes("delete");

  const mobileTab = (
    <div className="md:hidden flex items-center justify-between p-2 bg-muted/30 border-b">
      <DropdownMenu open={open} onOpenChange={onChangeOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex-1 justify-between text-left bg-white/80 border rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingBag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {currentActive?.isDraft
                  ? currentActive?.title || "Select Tab"
                  : "New tab"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[calc(100vw-2rem)] bg-white/90 rounded-lg shadow-lg border mt-2">
          {tabs.map((tab) => (
            <DropdownMenuItem
              key={tab.id}
              onClick={() => {
                onChangeOpen(false);
                onActiveTab(tab.id);
              }}
              className="flex items-center justify-between rounded-md hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {tab.isDraft ? (
                  <Save className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">
                  {tab.isDraft ? tab.title : "New tab"}
                </span>
              </div>
              {tabs.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeOpen(false);
                    onCloseTab(tab.id);
                  }}
                  disabled={!canDelete}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 ml-2 bg-primary/10 hover:bg-primary/20 rounded-lg"
        onClick={() => {
          onChangeOpen(false);
          onNewTab();
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="w-full h-[90vh] bg-white text-gray-900 flex flex-col">
      {mobileTab}
      {/* Tab Bar */}
      <div className="hidden bg-[#f3f3f3] border-b border-[#e5e5e5] relative md:flex">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scrollTabs("left")}
            className="flex-shrink-0 w-8 h-full flex items-center justify-center bg-[#f3f3f3] hover:bg-[#e8e8e8] border-r border-[#e5e5e5] z-10"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Scrollable Tabs Container */}
        <div
          ref={tabsContainerRef}
          className="flex overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#9ca3af #e5e7eb",
          }}
        >
          {tabs.map((tab) => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <div
                  id={tab.id}
                  key={tab.id}
                  data-tab-id={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border-r border-[#e5e5e5] cursor-pointer group min-w-0 flex-shrink-0",
                    "w-[180px]", // Fixed width for consistent tab sizes
                    currentActive?.id === tab.id
                      ? "bg-white text-gray-900 border-t-2 border-t-blue-500"
                      : "bg-[#f3f3f3] text-gray-600 hover:bg-[#e8e8e8]"
                  )}
                  onClick={() => onActiveTab(tab.id)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex-shrink-0 text-gray-500">
                      {tab.isDraft ? (
                        <Save className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-sm text-nowrap">
                      {tab.isDraft ? tab.title : "New tab"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onCloseTab(tab.id);
                    }}
                    disabled={!canDelete}
                    className="flex-shrink-0 p-1 rounded hover:bg-[#e0e0e0] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-row items-center gap-1">
                  <div className="w-10">Invoice</div>
                  <div className="w-3">:</div>
                  <div className="font-bold">#{tab.title}</div>
                </div>
                <div className="flex flex-row items-center gap-1">
                  <div className="w-10">Total</div>
                  <div className="w-3">:</div>
                  <div className="font-bold">
                    $
                    {tab.value?.carts.reduce(
                      (a, b) => a + (b.totalAfterDiscount || 0),
                      0
                    ) || (0).toFixed(2)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="flex-shrink-0 w-8 h-full flex items-center justify-center bg-[#f3f3f3] hover:bg-[#e8e8e8] border-r border-[#e5e5e5] text-gray-600 hover:text-gray-800"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scrollTabs("right")}
            className="flex-shrink-0 w-8 h-full flex items-center justify-center bg-[#f3f3f3] hover:bg-[#e8e8e8] border-l border-[#e5e5e5] z-10"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      {/* Content Area */}
      <div className="flex-1 flex">
        {!sleep && (
          <div
            className="rounded-b-xl p-2 flex-1 relative overflow-hidden bg-white/90"
            style={{
              contentVisibility: "auto",
            }}
          >
            <POSContent id={currentActive?.id} />
          </div>
        )}
      </div>
    </div>
  );
}
