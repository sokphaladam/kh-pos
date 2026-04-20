"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-css-tags */
import { Order, OrderDetail } from "@/classes/order";
import { Payment } from "@/classes/payment";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Formatter } from "@/lib/formatter";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import React from "react";

export function DefaultPrint({
  order,
  defaultInvoice,
}: {
  order?: {
    orderInfo: Order;
    orderDetail: OrderDetail[];
    payments: Payment[];
  };
  defaultInvoice?: string;
}) {
  const { user, setting, currency, currentWarehouse } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();
  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100",
  );

  const total = Number(
    order?.orderDetail.reduce((a, b) => {
      if (!!order.orderInfo.tableNumber) {
        const qty =
          b.status?.reduce((qty, status) => qty + Number(status.qty), 0) || 0;
        a = a + Number(b.price) * qty + Number(b.modiferAmount);
      } else {
        a = a + Number(b.price) * Number(b.qty);
      }
      return a;
    }, 0) || 0,
  );

  const totalKHR =
    currency === "$"
      ? Formatter.formatCurrencyKH(total * exchangeRate)
      : `$${(total / exchangeRate).toFixed(2)}`;
  const totalDiscount = order?.orderDetail.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0,
  );

  const totalAfterDiscount = total - (totalDiscount || 0);
  const receive =
    order?.payments.reduce((a, b) => {
      if (b.currency === "KHR" && currency === "$") {
        return a + Number(b.amount) / Number(b.exchangeRate);
      }

      return a + Number(b.amountUsd);
    }, 0) || 0;
  const change = receive <= 0 ? 0 : receive - totalAfterDiscount;
  const invoiceReceiptValue = defaultInvoice
    ? defaultInvoice
    : setting?.data?.result?.find((f) => f.option === "INVOICE_RECEIPT")?.value;
  const invoiceReceipt = invoiceReceiptValue
    ? invoiceReceiptValue.split(",")
    : [];
  const servedType =
    order?.orderInfo.servedType === "food_delivery"
      ? "Delivery"
      : order?.orderInfo.servedType === "take_away"
        ? "Take Away"
        : "Dine In";
  const customer = order?.orderInfo.customerLoader?.customerName;
  const displayTotalDiscount =
    invoiceReceipt.at(7) === "amount"
      ? formatForDisplay(Number(totalAfterDiscount))
      : ((Number(totalDiscount) / total) * 100).toFixed(2) + "%";
  let displayTotalDiscountAmount = null;
  const customerCount = order?.orderInfo.customer || 1;
  const rtb = setting?.data?.result?.find((f) => f.option === "RTB")?.value;

  if (invoiceReceipt.at(8) === "amount") {
    displayTotalDiscountAmount = formatForDisplay(Number(totalDiscount));
  } else if (invoiceReceipt.at(8) === "percentage") {
    displayTotalDiscountAmount =
      ((Number(totalDiscount) / total) * 100).toFixed(2) + "%";
  }

  return (
    <>
      <link type="text/css" rel="stylesheet" href="/printing.css" />
      <div
        className="noto-sans-khmer"
        style={{
          width: "95%",
          position: "relative",
          overflow: "hidden",
          margin: invoiceReceipt.at(3)?.split(" ").join("mm ") + "mm" || 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: invoiceReceipt.at(2) ? "space-between" : "center",
            alignItems: "center",
          }}
        >
          {invoiceReceipt.at(2) && (
            <img
              src={invoiceReceipt.at(2)}
              alt=""
              style={{
                width: 75,
                objectFit: "cover",
                aspectRatio: "1/1",
              }}
            />
          )}
          <div style={{ textWrap: "nowrap" }}>
            {invoiceReceipt.at(1) && (
              <div
                style={{
                  width: "100%",
                  position: "relative",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12pt",
                    textWrap: "wrap",
                    textAlign: "center",
                  }}
                >
                  {invoiceReceipt.at(1)}
                </div>
              </div>
            )}
            {!!rtb && (
              <>
                <div
                  style={{
                    width: "100%",
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "9pt",
                      textWrap: "wrap",
                      textAlign: "center",
                    }}
                  >
                    អ ត ប : {rtb}
                  </div>
                </div>
                {currentWarehouse?.address && (
                  <div
                    style={{
                      width: "100%",
                      position: "relative",
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9pt",
                        textWrap: "wrap",
                        textAlign: "center",
                      }}
                    >
                      {currentWarehouse?.address}
                    </div>
                  </div>
                )}
              </>
            )}
            <div
              style={{
                width: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "row",
                justifyContent: "right",
              }}
            >
              <div>
                <div style={{ fontSize: "12pt", textAlign: "right" }}>
                  វិក្កយបត្រ
                </div>
                <div style={{ fontSize: "14pt", textAlign: "right" }}>
                  Invoice
                </div>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div>
          {order?.orderInfo.tableName && (
            <div className="display">
              <div>Table</div>
              <div>:</div>
              <div>{order?.orderInfo.tableName}</div>
            </div>
          )}
          <div className="display">
            <div>Invoice No</div>
            <div>:</div>
            <div>
              #
              {order?.orderInfo.invoiceNo
                .toString()
                .substring(8, order.orderInfo.invoiceNo.toString().length)}
            </div>
          </div>
          <div className="display">
            <div>Cashier</div>
            <div>:</div>
            <div>
              {(order?.payments.length || 0) > 0
                ? order?.payments.at(0)?.createdBy?.fullname
                : user?.fullname || ""}
            </div>
          </div>
          <div className="display">
            <div>Date Time</div>
            <div>:</div>
            <div>
              {order?.orderInfo.paidAt
                ? moment(order.orderInfo.paidAt).format("MMM DD YYYY HH:mm")
                : moment(new Date()).format("MMM DD YYYY HH:mm")}
            </div>
          </div>
          {order?.orderInfo.createdBy && (
            <div className="display">
              <div>Order By</div>
              <div>:</div>
              <div>
                {order?.orderInfo.createdBy
                  ? order.orderInfo.createdBy.fullname
                  : ""}
              </div>
            </div>
          )}
          {servedType && (
            <div className="display">
              <div>Customer ({customerCount})</div>
              <div>:</div>
              <div
                style={{ textTransform: "capitalize" }}
              >{`${customer} (${servedType.replaceAll("_", " ")})`}</div>
            </div>
          )}
        </div>
        <div>
          <table className="print_table">
            <thead>
              <tr className="border_header">
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "left" }}>Price</th>
                <th style={{ textAlign: "center" }}>Dis</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order?.orderDetail.map((x, i) => {
                const qty = Number(
                  order.orderInfo.tableNumber
                    ? x.status?.reduce((a, b) => a + b.qty, 0)
                    : x?.qty,
                );

                const itemTotal = order.orderInfo.tableNumber
                  ? Number(x.price) * qty
                  : x.totalAmount;

                const booking =
                  x.reservation && x.reservation.length > 0
                    ? x.reservation.reduce(
                        (acc, booking) => {
                          if (!booking.seat || !booking.seat.hall) {
                            return acc;
                          }

                          const key = booking.seat.hall.id;

                          if (!acc[key]) {
                            acc[key] = {
                              hall: booking.seat.hall,
                              seats: [] as string[],
                            };
                          }

                          acc[key].seats.push(
                            `${booking.seat.row.toUpperCase()}${
                              booking.seat.column
                            }`,
                          );
                          return acc;
                        },
                        {} as Record<string, { hall: any; seats: string[] }>,
                      )
                    : null;

                let discount = formatForDisplay(x.discountAmount || 0);

                if (invoiceReceipt.at(7) === "percentage") {
                  discount =
                    Math.round(
                      (Number(x.discountAmount) / Number(itemTotal)) * 100,
                    ) + "%";
                }

                return (
                  <React.Fragment key={i}>
                    <tr key={i} className={"border_x"}>
                      <td
                        style={{
                          textAlign: "start",
                          display: "flex",
                          flexDirection: "row",
                        }}
                        // className="text-start flex flex-row !border-y-0"
                      >
                        <div
                          style={
                            invoiceReceipt.at(4) === "1"
                              ? {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: Number(
                                    invoiceReceipt.at(5) || 1,
                                  ),
                                  WebkitBoxOrient: "vertical",
                                }
                              : {}
                          }
                        >
                          {`${x?.title} `}
                          {booking
                            ? Object.values(booking).map((res: any, index) => {
                                return (
                                  <div
                                    key={index}
                                    className="flex flex-row gap-2 items-center justify-start"
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                      gap: "0.5rem",
                                      alignItems: "center",
                                      justifyContent: "flex-start",
                                      width: 100,
                                    }}
                                  >
                                    <div
                                      className="capitalize"
                                      style={{
                                        textTransform: "capitalize",
                                        textWrap: "wrap",
                                      }}
                                    >
                                      {res.hall.name}: {res.seats.join(" | ")}
                                    </div>
                                  </div>
                                );
                              })
                            : ""}
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: booking ? "right" : "center",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                      >
                        {booking
                          ? Object.values(booking)
                              .map((res: any) => {
                                return res.seats.length;
                              })
                              .reduce((a, b) => (a += b), 0)
                          : qty}
                      </td>
                      <td
                        style={{
                          textAlign: "left",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                      >
                        {formatForDisplay(Number(x.price))}
                      </td>
                      <td
                        style={{
                          textAlign: "left",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                      >
                        {discount}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                      >
                        {formatForDisplay(
                          Number(itemTotal) - Number(x.discountAmount || 0),
                        )}
                      </td>
                    </tr>
                    {(x.orderModifiers?.length || 0) > 0 ? (
                      <>
                        {x.orderModifiers?.map((mod) => {
                          const modifier =
                            x.productVariant?.basicProduct?.modifiers
                              .flatMap((m) => m.items)
                              .find((f) => f?.id === mod.modifierItemId);
                          return (
                            <tr
                              key={mod.orderDetailId + mod.modifierItemId}
                              className={"border_x"}
                            >
                              <td
                                style={{
                                  textAlign: "start",
                                  display: "flex",
                                  flexDirection: "row",
                                  width: "65px",
                                }}
                              >
                                <div
                                  style={
                                    invoiceReceipt.at(4) === "1"
                                      ? {
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          display: "-webkit-box",
                                          WebkitLineClamp: Number(
                                            invoiceReceipt.at(5) || 1,
                                          ),
                                          WebkitBoxOrient: "vertical",
                                          paddingLeft: 10,
                                        }
                                      : {}
                                  }
                                >
                                  {mod.notes ? mod.notes : modifier?.name}
                                </div>
                              </td>
                              <td></td>
                              <td
                                style={{
                                  textAlign: "left",
                                  borderTopWidth: 0,
                                  borderBottomWidth: 0,
                                }}
                              >
                                {Number(mod.price) > 0
                                  ? `+${formatForDisplay(
                                      Number(mod.price) * x.qty,
                                    )}`
                                  : ""}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      <></>
                    )}
                  </React.Fragment>
                );
              })}
              {invoiceReceipt.at(7) === "amount" && (
                <tr className="border_t">
                  <td
                    colSpan={2}
                    style={{ textAlign: "right", border: "", padding: 0 }}
                  >
                    <div className="display-sub">
                      <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                        Sub Total
                      </div>
                      <div style={{ height: "1.5rem" }}>
                        Discount{" "}
                        {displayTotalDiscountAmount
                          ? `(${displayTotalDiscountAmount})`
                          : ""}
                      </div>
                    </div>
                  </td>
                  <td
                    colSpan={2}
                    suppressHydrationWarning
                    style={{ textAlign: "right", border: "none", padding: 0 }}
                  >
                    <div className="display-sub">
                      <div style={{ height: "1.5rem" }}>
                        {totalKHR ? totalKHR : ""}
                      </div>
                      <div style={{ height: "1.5rem" }}>
                        {totalDiscount && invoiceReceipt.at(7) === "amount"
                          ? currency === "$"
                            ? Formatter.formatCurrencyKH(
                                (totalDiscount || 0) * exchangeRate,
                              )
                            : `$${(
                                Number(totalDiscount) / exchangeRate
                              ).toFixed(2)}`
                          : displayTotalDiscount}
                      </div>
                    </div>
                  </td>
                  <td
                    style={{ textAlign: "right", border: "none", padding: 0 }}
                  >
                    <div className="display-sub">
                      <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                        {formatForDisplay(Number(total))}
                      </div>
                      <div style={{ height: "1.5rem" }}>
                        {displayTotalDiscount}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              <tr className="border_dot_t">
                <td
                  colSpan={2}
                  style={{ textAlign: "right", border: "", padding: 0 }}
                >
                  <div className="display-sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      Grand Total
                    </div>
                  </div>
                </td>
                <td
                  colSpan={2}
                  suppressHydrationWarning
                  style={{ textAlign: "right", border: "none", padding: 0 }}
                >
                  <div className="display-sub">
                    <div
                      style={{
                        marginLeft: "20%",
                        height: "1.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {totalAfterDiscount
                        ? currency === "$"
                          ? Formatter.formatCurrencyKH(
                              totalAfterDiscount * exchangeRate,
                            )
                          : `$${(
                              Number(totalAfterDiscount) / exchangeRate
                            ).toFixed(2)}`
                        : ""}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", border: "none", padding: 0 }}>
                  <div className="display-sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      {formatForDisplay(Number(totalAfterDiscount))}
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border_dot_t">
                <td
                  colSpan={2}
                  style={{ textAlign: "right", border: "", padding: 0 }}
                >
                  <div className="display_sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      Received Total
                    </div>
                    {order?.payments.map((payment) => {
                      return (
                        <div
                          style={{
                            height: "1.5rem",
                            textWrap: "nowrap",
                            whiteSpace: "nowrap",
                          }}
                          key={payment.paymentId}
                        >
                          ({payment.paymentMethod})
                        </div>
                      );
                    })}
                    <div style={{ height: "1.5rem" }}>Change</div>
                  </div>
                </td>
                <td
                  colSpan={2}
                  suppressHydrationWarning
                  style={{ textAlign: "right", border: "none", padding: 0 }}
                >
                  <div className="display_sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      {currency === "$"
                        ? Formatter.formatCurrencyKH(receive * exchangeRate)
                        : `$${(Number(receive) / exchangeRate).toFixed(2)}`}
                    </div>
                    {order?.payments.map((payment) => {
                      const amount =
                        payment.currency === "KHR" && currency === "$"
                          ? Number(payment.amount) /
                            Number(payment.exchangeRate)
                          : Number(payment.amountUsd);
                      return (
                        <div
                          style={{ height: "1.5rem" }}
                          key={payment.paymentId}
                        >
                          {currency === "$"
                            ? Formatter.formatCurrencyKH(amount * exchangeRate)
                            : `$${(Number(amount) / exchangeRate).toFixed(2)}`}
                        </div>
                      );
                    })}

                    <div style={{ height: "1.5rem" }}>
                      {currency === "$"
                        ? Formatter.formatCurrencyKH(change * exchangeRate)
                        : `$${(Number(change) / exchangeRate).toFixed(2)}`}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", border: "none", padding: 0 }}>
                  <div className="display_sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      {formatForDisplay(Number(receive))}
                    </div>
                    {order?.payments.map((payment) => {
                      const amount =
                        payment.currency === "KHR" && currency === "$"
                          ? Number(payment.amount) /
                            Number(payment.exchangeRate)
                          : Number(payment.amountUsd);
                      return (
                        <div
                          style={{ height: "1.5rem" }}
                          key={payment.paymentId}
                        >
                          {formatForDisplay(amount)}
                        </div>
                      );
                    })}

                    <div style={{ height: "1.5rem" }}>
                      {formatForDisplay(Number(change))}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            Thanks, Please come again!
          </div>
          <div style={{ marginTop: 5 }}>
            <div
              style={{
                fontWeight: "bold",
                border: "dotted 1px #666",
                textAlign: "center",
                width: "100%",
                fontSize: 12,
              }}
            >
              Payment Method:{" "}
              {order?.payments.map((x) => x.paymentMethod).join(", ")}
            </div>
          </div>
          {(order?.orderInfo.printCount || 0) > 1 && (
            <div>
              <div
                style={{
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "100%",
                  fontSize: 12,
                }}
              >
                Re-Print Invoice
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
