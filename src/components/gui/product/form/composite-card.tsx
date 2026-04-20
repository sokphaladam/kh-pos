import SearchProductPicker from "@/components/search-product-picker";
import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { X } from "lucide-react";

interface CompositeComponent {
  id?: string;
  variantId: string;
  quantity: number;
  image?: string;
  title?: string;
}

interface CompositeCardProps {
  variant: CompositeComponent[];
  onAddComponent: (item: ProductSearchResult, qty: number) => void;
  onRemoveComponent: (compIdx: number) => void;
}

export function CompositeCard({
  variant,
  onAddComponent,
  onRemoveComponent,
}: CompositeCardProps) {
  // Ensure compositeVariants is always an array
  const compositeVariants: CompositeComponent[] = Array.isArray(variant)
    ? variant
    : [];
  return (
    <div className="bg-white border-l-4 border-blue-400 rounded-r-lg shadow-sm ml-8 my-2 p-3 relative">
      <div className="mb-3 flex gap-2 items-end relative">
        <div className="flex-1">
          <SearchProductPicker
            clearInput
            onChange={(item: ProductSearchResult) => {
              if (item) {
                onAddComponent(item, 1); // Default qty to 1 when adding
              }
            }}
            includeProductNotForSale
          />
        </div>
      </div>
      <div>
        <table className="w-full text-xs">
          <tbody>
            {compositeVariants.map((comp: CompositeComponent, i: number) => (
              <tr key={comp.id || i} className="border-b last:border-b-0">
                <td className="p-2">
                  <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                    <ImageWithFallback
                      src={comp.image}
                      alt={comp.title || comp.variantId}
                      title={comp.title || comp.variantId}
                      className="max-w-full max-h-full object-contain w-auto h-auto p-0.5"
                    />
                  </div>
                </td>
                <td className="p-2 align-middle">
                  {comp.title || comp.variantId}
                </td>
                <td className="p-2 text-center align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
                      onClick={() => {
                        const qty = Math.max(1, comp.quantity - 1);
                        onAddComponent(
                          {
                            variantId: comp.variantId,
                            image: comp.image,
                            title: comp.title,
                          } as unknown as ProductSearchResult,
                          qty,
                        );
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={comp.quantity}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value));
                        onAddComponent(
                          {
                            variantId: comp.variantId,
                            image: comp.image,
                            title: comp.title,
                          } as unknown as ProductSearchResult,
                          qty,
                        );
                      }}
                      className="border px-2 py-1 rounded w-14 text-xs text-center"
                    />
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
                      onClick={() => {
                        const qty = comp.quantity + 1;
                        onAddComponent(
                          {
                            variantId: comp.variantId,
                            image: comp.image,
                            title: comp.title,
                          } as unknown as ProductSearchResult,
                          qty,
                        );
                      }}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-2 align-middle w-1">
                  <div className="flex justify-end">
                    <button
                      className="ml-2 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition-colors w-7 h-7"
                      onClick={() => onRemoveComponent(i)}
                      aria-label="Remove"
                      type="button"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
