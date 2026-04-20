"use client";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Formatter } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useAuthentication } from "contexts/authentication-context";
import Image from "next/image";
import { NewWindow } from "../new-window";
import { OrderProps } from "./types/post-types";

interface Props {
  data?: OrderProps;
  onClosed?: () => void;
}

/*
use for testing display of second window
const dummyOrder: OrderProps = {
  invoiceNo: "INV-10001",
  by: { fullname: "Test User" },
  carts: Array.from({ length: 10 }).map((_, i) => ({
    id: `item-${i + 1}`,
    productId: `prod-${i + 1}`,
    productTitle: `Product ${i + 1} (SKU${i + 1})`,
    sku: `SKU${i + 1}`,
    qty: Math.floor(Math.random() * 5) + 1,
    price: 10 + i * 2,
    discountValue: i % 2 === 0 ? 2 : 0,
    totalAfterDiscount:
      (10 + i * 2) * (Math.floor(Math.random() * 5) + 1) -
      (i % 2 === 0 ? 2 : 0),
    images: [
      {
        url: "https://via.placeholder.com/40",
        productVariantId: `var-${i + 1}`,
      },
    ],
    variantId: `var-${i + 1}`,
    warehouseId: "wh-1",
    barcode: `BARCODE${i + 1}`,
    discounts: [],
    khr: 0,
    usd: 0,
    variants: [],
  })),
  payments: [],
};
*/

export function POSSecondWindow({ data, onClosed }: Props) {
  const { setting, currency } = useAuthentication();

  if (setting?.isLoading || setting?.isValidating) {
    return <div>Loading...</div>;
  }

  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100"
  );
  const QR =
    !setting?.isLoading && setting?.data?.result
      ? setting?.data?.result?.find((f) => f.option === "QR_CODE")?.value
      : "";
  const subtotal = (data?.carts || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty),
    0
  );
  const totalDiscount = (data?.carts || []).reduce(
    (sum, item) => sum + Number(item.discountValue || 0),
    0
  );
  const tax = 10;
  const totalAfterDiscount = (data?.carts || []).reduce(
    (sum, item) => sum + Number(item.totalAfterDiscount || 0),
    0
  );
  const logo =
    !setting?.isLoading && !setting?.isValidating
      ? setting?.data?.result
          ?.find((f) => f.option === "INVOICE_RECEIPT")
          ?.value?.split(",")[2]
      : "";

  return (
    <NewWindow onClosed={onClosed}>
      <div className="flex flex-col md:flex-row w-full h-full min-h-screen bg-background">
        <div className={cn("flex-1 p-4 min-w-0 relative overflow-hidden")}>
          <Card className="flex-1 flex flex-col overflow-x-hidden h-full">
            <CardHeader className="flex flex-row items-center justify-center">
              <ImageWithFallback
                src={logo}
                alt="Company logo"
                width={80}
                height={80}
                className="object-contain aspect-auto"
              />
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-x-hidden">
              <div className="overflow-x-auto space-x-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Price
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        Qty
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        Discount
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.carts || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-[200px] text-center text-muted-foreground"
                        >
                          Cart is empty. Scan a barcode to add items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data &&
                      data.carts &&
                      data.carts.map((cart, idx) => {
                        const [title, sku] = cart.productTitle.split("(");
                        const image =
                          (cart.images || []).length > 0
                            ? cart.images?.find(
                                (f) => f.productVariantId === cart.variantId
                              )?.url ?? (cart.images || [])[0].url
                            : "";
                        return (
                          <TableRow key={idx}>
                            <TableCell className="pl-4 text-nowrap text-xs truncate text-ellipsis overflow-hidden">
                              <div className="flex flex-row gap-2 items-center">
                                <ImageWithFallback
                                  src={image}
                                  alt={title || "Product image"}
                                  width={40}
                                  height={40}
                                  className="object-contain aspect-auto"
                                />
                                <div>
                                  <div className="font-medium">{title}</div>
                                  <div className="text-[9px] text-muted-foreground">
                                    SKU: {cart.sku}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground">
                                    {sku.replace(")", "")}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {currency}
                              {Number(cart.price || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                <span className="w-8 text-center">
                                  {cart.qty}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {currency}
                              {Number(cart.discountValue).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {currency}
                              {Number(cart.totalAfterDiscount).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-[400px] p-4 bg-background">
          <div className="h-full flex-1 flex flex-col justify-between">
            <div
              className="flex flex-col justify-between bg-white/80 rounded-xl gap-4"
              // style={{ height: width < 765 ? "auto" : height - 160 }}
            >
              <div className="w-full hidden md:flex flex-col gap-2 text-sm pb-3 mb-2">
                {data?.by && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span className="font-medium">{data?.by?.fullname}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span className="font-medium">
                    {currency}1={Formatter.formatCurrencyKH(exchangeRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>
                    {currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-end font-semibold text-xs text-gray-500">
                  <span>
                    ({Formatter.formatCurrencyKH(subtotal * exchangeRate)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Included</span>
                  <span>({tax}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span>
                    -{currency}
                    {totalDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-end font-semibold text-xs text-gray-500">
                  <span>
                    (
                    {Formatter.formatCurrencyKH(
                      totalDiscount * (exchangeRate || 0)
                    )}
                    )
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-lg font-bold text-primary">
                  <span>Total:</span>
                  <span>
                    {currency}
                    {totalAfterDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-end font-semibold text-xs text-gray-500">
                  <span>
                    (
                    {Formatter.formatCurrencyKH(
                      totalAfterDiscount * (exchangeRate || 0)
                    )}
                    )
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-row justify-center gap-6">
                  <div className="bg-white p-6 rounded-md shadow-sm flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-4">Scan to Pay</h2>
                    {totalAfterDiscount > 0 ? (
                      <>
                        <div className="bg-white p-3 rounded-lg border-2 border-gray-200 mb-3">
                          {QR && (
                            <Image
                              src={QR || ""}
                              alt=""
                              width={150}
                              height={150}
                              className="object-contain aspect-auto w-[150px] h-[150px]"
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 text-center mt-1">
                          Scan with your mobile payment app
                        </p>
                      </>
                    ) : (
                      <div className="h-[200px] w-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
                        <p className="text-gray-500 text-center">
                          Add items to generate payment QR
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NewWindow>
  );
}
