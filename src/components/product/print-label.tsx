"use client";
/* eslint-disable @next/next/no-css-tags */
import { ProductVariantType } from "@/dataloader/product-variant-loader";
import { createDialog } from "../create-dialog";
import { DirectPrint } from "../gui/print/direct-print";
import { DialogHeader, DialogTitle } from "../ui/dialog";
import { MaterialInput } from "../ui/material-input";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useAuthentication } from "contexts/authentication-context";
import { PrintLabelJson } from "../gui/setting/print-label";
import { useQueryAppliesDiscountProduct } from "@/app/hooks/use-query-discount";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import QRCode from "react-qr-code";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Printing } from "@/classes/cinema/printing";

export const printLabel = createDialog<{ data: ProductVariantType }, unknown>(
  ({ data }) => {
    const ref = useRef<HTMLDivElement>(null);
    const printingRef = useRef<Printing | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isPrinting, setIsPrinting] = useState(false);
    const [cssText, setCssText] = useState("");
    const barcode = data.barcode;
    const price = data.price?.toFixed(2);
    const { formatForDisplay } = useCurrencyFormat();
    const { setting } = useAuthentication();
    const [isApplied, setIsApplied] = useState<string | null>(null);
    const { data: discountData, isLoading: isLoadingDiscount } =
      useQueryAppliesDiscountProduct({
        productId: data.productId || "",
      });

    const labelSetting = setting?.data?.result?.find(
      (s) => s.option === "LABEL_PRINT",
    )?.value;
    const labelJson: PrintLabelJson = useMemo(() => {
      return labelSetting ? JSON.parse(labelSetting) : {};
    }, [labelSetting]);

    const printerInfo = useMemo(() => {
      return {
        id: "4782906b-492f-4ff9-a1ee-04efd181733d",
        ip: "127.0.0.1",
        name: labelJson.printerName ?? "Print to Chasier",
        port: 9100,
        printer_name: labelJson.printerName ?? "Print to Chasier",
        print_server_ip: "192.168.1.100:8080",
        page_size: labelJson.paperSize?.width + "mm",
        type: "data:text/html",
      };
    }, [labelJson]);

    useEffect(() => {
      // only run in browser
      if (typeof window !== "undefined") {
        printingRef.current = new Printing();
        fetch("/printing.css")
          .then((res) => res.text())
          .then(setCssText);
      }

      // optional cleanup if you want to close connection on unmount
      return () => {
        if (printingRef.current && Printing.connection) {
          Printing.connection.close();
          Printing.connection = null;
        }
      };
    }, [labelJson]);

    const handlePrint = () => {
      const contents = [...new Array(quantity)].map((content, idx) => {
        const element = document.getElementById(`print-label-${idx}`);
        return `<html><head><style>${cssText}</style></head><body>${element?.innerHTML}</body></html>`;
      });
      printingRef.current?.send(
        JSON.stringify({
          content: contents,
          printer_info: printerInfo,
        }),
      );
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle>Print Label</DialogTitle>
        </DialogHeader>
        <div className="w-full">
          <MaterialInput
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            type="number"
            label="Number of Labels"
            placeholder="Number of labels"
          />
        </div>
        <div>
          {discountData &&
          !isLoadingDiscount &&
          (discountData.result?.length || 0) > 0 ? (
            <div className="space-y-2 my-4">
              {discountData.result?.map((promotion, index) => {
                const discountText = `${
                  promotion.discount.discountType === "AMOUNT"
                    ? formatForDisplay(promotion.discount.value)
                    : promotion.discount.value
                }${
                  promotion.discount.discountType === "PERCENTAGE" ? "%" : ""
                }`;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border transition-colors ${
                      isApplied === promotion.discount.autoId
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`promotion_${index}`}
                        checked={
                          String(isApplied) ===
                          String(promotion.discount.autoId)
                        }
                        onCheckedChange={(checked) => {
                          if (!!checked) {
                            setIsApplied(String(promotion.discount.autoId));
                          } else {
                            setIsApplied(null);
                          }
                        }}
                        className="scale-75"
                      />
                      <div>
                        <Label
                          htmlFor={`promotion_${index}`}
                          className="text-xs font-medium cursor-pointer"
                        >
                          {promotion.discount.title}
                        </Label>
                      </div>
                    </div>
                    <Badge
                      variant={
                        isApplied === String(promotion.discount.autoId)
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {discountText}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <></>
          )}
        </div>
        <Button
          onClick={() => {
            if (labelJson.using === "SOCKET") {
              handlePrint();
            } else {
              setIsPrinting(true);
            }
          }}
        >
          Print
        </Button>

        {labelJson.using === "SOCKET" ? (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: "-9999px",
              top: "-9999px",
              visibility: "hidden",
            }}
          >
            <link type="text/css" rel="stylesheet" href="/printing.css" />
            <style>{cssText}</style>
            {[...new Array(quantity)].map((_, idx) => {
              return (
                <div
                  style={{
                    width: labelJson.paperSize?.width + "mm",
                    height: labelJson.paperSize?.height + "mm",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 10,
                    textAlign: "center",
                    flexDirection: "column",
                    paddingLeft: labelJson.paperSize?.padding?.left,
                    paddingBottom: labelJson.paperSize?.padding?.bottom,
                    paddingRight: labelJson.paperSize?.padding?.right,
                    paddingTop: labelJson.paperSize?.padding?.top,
                  }}
                  key={idx}
                  className="pagebreak"
                  id={`print-label-${idx}`}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 2,
                      width: labelJson.paperSize?.width + "mm",
                      justifyContent:
                        labelJson.price || labelJson.barcode?.displayValue
                          ? "inherit"
                          : "center",
                    }}
                  >
                    {(price || labelJson.barcode?.displayValue) && (
                      <div
                        style={{
                          width: (labelJson.paperSize?.width || 0) / 2 + "mm",
                          display: "flex",
                          flexWrap: "wrap",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 2,
                          overflowWrap: "break-word",
                        }}
                      >
                        {price && <div>${price}</div>}
                        {labelJson.barcode?.displayValue && (
                          <div
                            style={{
                              textWrap: "wrap",
                              width: "100%",
                              textAlign: "left",
                            }}
                          >
                            {isApplied ? `${barcode}::${isApplied}` : barcode}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ width: labelJson.barcode?.height }}>
                      <QRCode
                        value={isApplied ? `${barcode}::${isApplied}` : barcode}
                        size={labelJson.barcode?.height ?? 50}
                        fontSize={10}
                        style={{
                          height: "auto",
                          maxWidth: "100%",
                          width: "100%",
                        }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          isPrinting && (
            <DirectPrint autoprint onPrintComplete={() => setIsPrinting(false)}>
              <div>
                <link type="text/css" rel="stylesheet" href="/printing.css" />
                {[...new Array(quantity)].map((_, idx) => {
                  return (
                    <div
                      style={{
                        width: labelJson.paperSize?.width + "mm",
                        height: labelJson.paperSize?.height + "mm",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: 10,
                        textAlign: "center",
                        flexDirection: "column",
                        paddingLeft: labelJson.paperSize?.padding?.left,
                        paddingBottom: labelJson.paperSize?.padding?.bottom,
                        paddingRight: labelJson.paperSize?.padding?.right,
                        paddingTop: labelJson.paperSize?.padding?.top,
                      }}
                      key={idx}
                      className="pagebreak"
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 2,
                          width: labelJson.paperSize?.width + "mm",
                          justifyContent:
                            labelJson.price || labelJson.barcode?.displayValue
                              ? "inherit"
                              : "center",
                        }}
                      >
                        {(price || labelJson.barcode?.displayValue) && (
                          <div
                            style={{
                              width:
                                (labelJson.paperSize?.width || 0) / 2 + "mm",
                              display: "flex",
                              flexWrap: "wrap",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: 2,
                              overflowWrap: "break-word",
                            }}
                          >
                            {price && <div>${price}</div>}
                            {labelJson.barcode?.displayValue && (
                              <div
                                style={{
                                  textWrap: "wrap",
                                  width: "100%",
                                  textAlign: "left",
                                }}
                              >
                                {isApplied
                                  ? `${barcode}::${isApplied}`
                                  : barcode}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ width: labelJson.barcode?.height }}>
                          <QRCode
                            value={
                              isApplied ? `${barcode}::${isApplied}` : barcode
                            }
                            size={labelJson.barcode?.height ?? 50}
                            fontSize={10}
                            style={{
                              height: "auto",
                              maxWidth: "100%",
                              width: "100%",
                            }}
                            viewBox={`0 0 256 256`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DirectPrint>
          )
        )}
      </>
    );
  },
  { defaultValue: null },
);
