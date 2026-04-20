import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Search, ShoppingBag, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRestaurant } from "./contexts/restaurant-context";
import { RestaurantSummarySheet } from "./restaurant-summary-sheet";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";

interface Props extends WithLayoutPermissionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function RestaurantFilter({
  searchQuery,
  setSearchQuery,
  ...rest
}: Props) {
  const { state, loading, isRequest } = useRestaurant();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const params = useSearchParams();

  const currentTable = state.activeTables.find(
    (t) => t.tables?.id === params.get("table") || ""
  );

  const handleSearchButtonClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchClose = () => {
    setIsSearchExpanded(false);
    // Don't clear the search query - just collapse the input
  };

  const handleCartView = () => {
    // code cart view
    RestaurantSummarySheet.show({ table: currentTable, ...rest });
  };

  return (
    <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-30">
      <div
        className={cn(
          isSearchExpanded
            ? ""
            : "flex items-center flex-row gap-3 justify-between md:justify-end"
        )}
      >
        {!isSearchExpanded && (
          <>
            {currentTable &&
              currentTable.orders &&
              currentTable.orders.items.length > 0 && (
                <div className="sm:hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCartView}
                        className="h-8 w-8 p-0 relative hover:bg-orange-50 hover:text-orange-700 transition-colors"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <div
                          className={`absolute top-0 -right-1 w-auto text-xs py-0 px-[6px] shadow-md text-white rounded-full border border-white ${"bg-red-500"}`}
                        >
                          <small>
                            {currentTable?.orders?.items.reduce(
                              (acc, item) => acc + item.qty,
                              0
                            )}
                          </small>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Cart</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
          </>
        )}
        <div className="flex flex-row items-center w-full justify-end gap-3">
          {!isSearchExpanded && (
            <>
              {/* Search Button */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchButtonClick}
                  className="h-9 px-3 flex-1 hover:bg-gray-50 transition-colors"
                  disabled={loading || isRequest}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Query Display */}
              {searchQuery && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <Search className="h-3 w-3 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="h-auto p-0 hover:bg-blue-100 rounded-full text-blue-600 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Expanded Search Input */}
        {isSearchExpanded && (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Type to search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 w-full rounded-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleSearchClose();
                  }
                }}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchClose}
              className="h-9 px-3 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
