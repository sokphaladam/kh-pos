import React, { useState, useMemo } from "react";
import { ExpiryProduct } from "@/classes/reports/product-expiry";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface Props {
  products: ExpiryProduct[];
}

type SortField = "expiryDate" | "quantity" | "value";
type SortDirection = "asc" | "desc" | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

const getStatusBadge = (status: string) => {
  const configs = {
    expired: {
      variant: "destructive" as const,
      icon: "⚠️",
      label: "Expired",
      className: undefined,
    },
    urgent: {
      variant: "secondary" as const,
      icon: "🔥",
      label: "Urgent",
      className: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    },
    critical: {
      variant: "secondary" as const,
      icon: "⏰",
      label: "Critical",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    },
    warning: {
      variant: "secondary" as const,
      icon: "📅",
      label: "Warning",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
  };

  const config = configs[status as keyof typeof configs];

  return (
    <div className="flex flex-col items-center space-y-1">
      <Badge variant={config.variant} className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    </div>
  );
};

const formatExpiryDate = (dateString: string) => {
  if (!dateString || dateString === "-") return "-";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (diffDays < 0) {
      return (
        <div className="text-center">
          <div className="font-medium text-destructive">{formattedDate}</div>
          <div className="text-xs text-muted-foreground">
            {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? "s" : ""} ago
          </div>
        </div>
      );
    } else if (diffDays === 0) {
      return (
        <div className="text-center">
          <div className="font-medium text-orange-600">{formattedDate}</div>
          <div className="text-xs text-muted-foreground">Today</div>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="font-medium">{formattedDate}</div>
          <div className="text-xs text-muted-foreground">
            in {diffDays} day{diffDays !== 1 ? "s" : ""}
          </div>
        </div>
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return dateString;
  }
};

const SortButton: React.FC<{
  field: SortField;
  currentSort: SortState;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}> = ({ field, currentSort, onSort, children }) => {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center space-x-1">
        <span>{children}</span>
        {direction === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : direction === "desc" ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </Button>
  );
};

export const ExpiryProductList: React.FC<Props> = ({ products }) => {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  const handleSort = (field: SortField) => {
    setSortState((prevState) => {
      if (prevState.field === field) {
        // Cycle through: asc -> desc -> null
        if (prevState.direction === "asc") {
          return { field, direction: "desc" };
        } else if (prevState.direction === "desc") {
          return { field: null, direction: null };
        } else {
          return { field, direction: "asc" };
        }
      } else {
        // New field, start with asc
        return { field, direction: "asc" };
      }
    });
  };

  const sortedProducts = useMemo(() => {
    if (!sortState.field || !sortState.direction) {
      return products;
    }

    return [...products].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortState.field) {
        case "expiryDate":
          aValue = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
          bValue = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
          break;
        case "quantity":
          aValue = Number(a.quantity) || 0;
          bValue = Number(b.quantity) || 0;
          break;
        case "value":
          aValue = Number(a.value) || 0;
          bValue = Number(b.value) || 0;
          break;
        default:
          return 0;
      }

      if (sortState.direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [products, sortState]);

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center">#</TableHead>
            <TableHead className="w-[280px]">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Product Details
              </span>
            </TableHead>
            <TableHead className="w-[140px] text-center">
              <SortButton
                field="expiryDate"
                currentSort={sortState}
                onSort={handleSort}
              >
                Expiry Date
              </SortButton>
            </TableHead>
            <TableHead className="w-[120px] text-center">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </span>
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <SortButton
                field="quantity"
                currentSort={sortState}
                onSort={handleSort}
              >
                Quantity
              </SortButton>
            </TableHead>
            <TableHead className="w-[120px] text-right">
              <SortButton
                field="value"
                currentSort={sortState}
                onSort={handleSort}
              >
                Value
              </SortButton>
            </TableHead>
            <TableHead className="w-[140px]">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Location
              </span>
            </TableHead>
            <TableHead className="w-[160px]">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-64">
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="text-muted-foreground text-6xl mb-4">📦</div>
                  <div className="text-muted-foreground text-xl font-medium mb-2">
                    No products found
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Try adjusting your filters to see more results
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedProducts.map((p, idx) => {
              const image = p.variant.basicProduct?.images.find(
                (i) => i.productVariantId === p.variant.id
              );
              return (
                <TableRow
                  key={`${p.variant?.id}-${p.slot?.id}-${p.expiryDate}-${idx}`}
                  className="hover:bg-muted/50"
                >
                  {/* Index Column */}
                  <TableCell className="w-[60px] text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      {idx + 1}
                    </div>
                  </TableCell>

                  {/* Product Details with Image */}
                  <TableCell className="w-[280px]">
                    <div className="flex items-center space-x-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {image?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.url}
                            alt={p.variant?.name || "Product Image"}
                            className="w-10 h-10 rounded-md object-cover border border-border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        {/* Fallback placeholder */}
                        <div
                          className={`w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs ${
                            image?.url ? "hidden" : ""
                          }`}
                        >
                          📦
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium truncate"
                          title={
                            p.variant?.basicProduct?.title ||
                            p.variant?.name ||
                            "Unknown Product"
                          }
                        >
                          {p.variant?.basicProduct?.title ||
                            p.variant?.name ||
                            "Unknown Product"}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          {p.variant?.sku && <span>{p.variant.name}</span>}
                          {p.variant?.barcode && (
                            <span className="text-xs">
                              #{p.variant.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="w-[140px] text-center">
                    {formatExpiryDate(p.expiryDate)}
                  </TableCell>

                  <TableCell className="w-[120px] text-center">
                    {getStatusBadge(p.status)}
                  </TableCell>

                  <TableCell className="w-[100px] text-right">
                    <div className="font-medium">
                      {(p.quantity || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">units</div>
                  </TableCell>

                  <TableCell className="w-[120px] text-right">
                    <div className="font-medium">
                      ${(p.value || 0).toLocaleString()}
                    </div>
                    {p.quantity > 0 && (
                      <div className="text-sm text-muted-foreground">
                        ${((p.value || 0) / p.quantity).toFixed(2)}/unit
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="w-[140px]">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      <span className="text-sm font-medium truncate">
                        {p.slot?.name || "Unknown Slot"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="w-[160px]">
                    <div className="flex flex-wrap gap-1">
                      {p.categories && p.categories.length > 0 ? (
                        p.categories.map((category, catIdx) => (
                          <Badge
                            key={catIdx}
                            variant="outline"
                            className="text-xs"
                          >
                            {category.title}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No category
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
