import { ProductSearchResult } from "@/app/api/product/search-product/types";
import { BasicMenuAction } from "@/components/basic-menu-action";
import { useCommonDialog } from "@/components/common-dialog";
import { MaterialInput } from "@/components/ui/material-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthentication } from "contexts/authentication-context";
import { produce } from "immer";
import React from "react";
import { useProductForm } from "../context/product-form-context";
import { CompositeCard } from "./composite-card";
import { DropImage } from "./drop-image";

export function ProductVariantList() {
  const { currency } = useAuthentication();
  const { product, setProduct } = useProductForm();
  const { showDialog } = useCommonDialog();

  const handleToggleComposite = (idx: number, checked: boolean) => {
    showDialog({
      title: checked ? "Enable Composite" : "Disable Composite",
      content: `Are you sure you want to ${
        checked ? "enable" : "disable"
      } composite for this variant?`,
      actions: [
        {
          text: "Confirm",
          onClick: async () => {
            setProduct(
              produce(product, (draft) => {
                (draft.productVariants || [])[idx].isComposite = checked;
              })
            );
          },
        },
      ],
    });
  };

  const handleToggleVisible = (idx: number, checked: boolean) => {
    showDialog({
      title: checked ? "Make Visible" : "Make Hidden",
      content: `Are you sure you want to ${
        checked ? "make visible" : "make hidden"
      } this variant?`,
      actions: [
        {
          text: "Confirm",
          onClick: async () => {
            setProduct(
              produce(product, (draft) => {
                (draft.productVariants || [])[idx].visible = checked;
              })
            );
          },
        },
      ],
    });
  };

  if (product.productVariants.length === 0) {
    return <></>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs text-nowrap">Image</TableHead>
          <TableHead className="text-xs text-nowrap">Variant</TableHead>
          <TableHead className="text-xs text-nowrap">
            Price({currency})
          </TableHead>
          <TableHead className="text-xs text-nowrap">Barcode</TableHead>
          <TableHead className="text-xs text-nowrap">Low Stock</TableHead>
          <TableHead className="text-xs text-nowrap">Ideal Stock</TableHead>
          <TableHead className="text-xs whitespace-nowrap">
            Purchase Cost({currency})
          </TableHead>
          <TableHead className="text-xs whitespace-nowrap">Composite</TableHead>
          <TableHead className="text-xs whitespace-nowrap">Visible</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {product.productVariants.map((x, idx) => {
          const showCompositeCard = x.isComposite;
          return (
            <React.Fragment key={idx}>
              <TableRow>
                <TableCell>
                  <DropImage variantId={x.id} />
                </TableCell>
                <TableCell className="text-xs">{x.name}</TableCell>
                <TableCell className="text-xs w-[150px]">
                  <div>
                    <MaterialInput
                      placeholder=""
                      label=""
                      className="h-[30px]"
                      type="number"
                      value={Number(x.price || 0).toString()}
                      onChange={(e) => {
                        setProduct(
                          produce(product, (draft) => {
                            (draft.productVariants || [])[idx].price = Number(
                              e.target.value
                            );
                          })
                        );
                      }}
                      min={0}
                      step={0.1}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-xs w-[150px]">
                  <div>
                    <MaterialInput
                      placeholder=""
                      label=""
                      className="h-[30px]"
                      type="text"
                      value={x.barcode || ""}
                      onChange={(e) => {
                        setProduct(
                          produce(product, (draft) => {
                            (draft.productVariants || [])[idx].barcode =
                              e.target.value;
                          })
                        );
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-xs w-[150px]">
                  <div>
                    <MaterialInput
                      className="h-[30px]"
                      value={x.lowStockQty || ""}
                      onChange={(e) => {
                        setProduct(
                          produce(product, (draft) => {
                            (draft.productVariants || [])[idx].lowStockQty =
                              isNaN(Number(e.target.value))
                                ? null
                                : Number(e.target.value);
                          })
                        );
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-xs w-[150px]">
                  <div>
                    <MaterialInput
                      className="h-[30px]"
                      value={x.idealStockQty || ""}
                      onChange={(e) => {
                        setProduct(
                          produce(product, (draft) => {
                            (draft.productVariants || [])[idx].idealStockQty =
                              isNaN(Number(e.target.value))
                                ? null
                                : Number(e.target.value);
                          })
                        );
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-xs w-[150px]">
                  <div>
                    <MaterialInput
                      className="h-[30px]"
                      value={Number(x.purchasedCost || 0).toString()}
                      type="number"
                      step={1}
                      onChange={(e) => {
                        setProduct(
                          produce(product, (draft) => {
                            (draft.productVariants || [])[idx].purchasedCost =
                              isNaN(Number(e.target.value))
                                ? 0
                                : Number(e.target.value);
                          })
                        );
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-xs w-[150px]">
                  {/* Composite toggle */}
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={x.isComposite || false}
                        onChange={(e) =>
                          handleToggleComposite(idx, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-all"></div>
                      <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-3.5"></div>
                    </label>
                  </div>
                </TableCell>
                <TableCell className="text-xs w-[150px]">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={x.visible || false}
                        onChange={(e) =>
                          handleToggleVisible(idx, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-all"></div>
                      <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-3.5"></div>
                    </label>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <BasicMenuAction
                    value={x}
                    onDelete={() => {
                      setProduct(
                        produce(product, (draft) => {
                          draft.productVariants.splice(idx, 1);
                        })
                      );
                    }}
                  />
                </TableCell>
              </TableRow>
              {showCompositeCard && (
                <tr>
                  <td colSpan={9} className="p-0">
                    <CompositeCard
                      variant={x.compositeVariants?.map((cv) => ({
                        id: cv.id || undefined,
                        variantId: cv.variantId,
                        image: cv.image,
                        title: cv.title,
                        quantity: cv.quantity,
                      }))}
                      onAddComponent={(
                        item: ProductSearchResult,
                        qty: number
                      ) => {
                        setProduct(
                          produce(product, (draft) => {
                            const compositeVariants =
                              (draft.productVariants || [])[idx]
                                .compositeVariants || [];
                            const existingIdx = compositeVariants.findIndex(
                              (cv) => cv.variantId === item.variantId
                            );
                            if (existingIdx === -1) {
                              (draft.productVariants || [])[
                                idx
                              ].compositeVariants = [
                                ...compositeVariants,
                                {
                                  variantId: item.variantId,
                                  quantity: qty,
                                  image:
                                    item.images?.find(
                                      (img) =>
                                        img.productVariantId === item.variantId
                                    )?.url || undefined,
                                  title: item.productTitle || "",
                                },
                              ];
                            } else {
                              (draft.productVariants || [])[
                                idx
                              ].compositeVariants[existingIdx].quantity = qty;
                            }
                          })
                        );
                      }}
                      onRemoveComponent={(compIdx) => {
                        setProduct(
                          produce(product, (draft) => {
                            (draft.productVariants || [])[
                              idx
                            ].compositeVariants = (draft.productVariants || [])[
                              idx
                            ].compositeVariants.filter(
                              (
                                _: { variantId: string; quantity: number },
                                i: number
                              ) => i !== compIdx
                            );
                          })
                        );
                      }}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
