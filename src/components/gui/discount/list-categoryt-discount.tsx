import { ImageWithFallback } from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@/lib/server-functions/category/create-category";
import { X } from "lucide-react";
import { DiscountSearchCategory } from "./discount-search-category";

export function ListCategoryDiscount({
  onAddCategory,
  category,
  onRemoveCategory,
}: {
  discountId: string;
  category: Category[];
  onAddCategory: (category: Category) => void;
  onRemoveCategory?: (categoryId: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4 h-full">
      <DiscountSearchCategory clearInput onChange={onAddCategory} />
      {/* Applied Category List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          Applied Category ({category.length})
        </h3>
        <div className="max-h-[70vh] overflow-y-auto space-y-2">
          {category.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No categories applied to this discount</p>
              <p className="text-xs text-gray-400 mt-1">
                Search and select category above to add them
              </p>
            </div>
          ) : (
            category.map((x, index) => (
              <Card key={index} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0 h-14 w-14">
                      <ImageWithFallback
                        src={x.imageUrl || ""}
                        alt={x.title || "Product image"}
                        height={40}
                        width={40}
                        className="rounded-md max-w-full max-h-full object-contain w-auto h-auto p-0.5"
                      />
                    </div>

                    {/* Product Information */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {x.title}
                      </h4>
                    </div>

                    {/* Remove Button */}
                    {onRemoveCategory && (
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveCategory(x.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
