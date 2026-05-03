/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-css-tags */
"use client";

import { Order, OrderDetail } from "@/classes/order";
import { Payment } from "@/classes/payment";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { Formatter } from "@/lib/formatter";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import React from "react";

interface Props {
  order?: {
    orderInfo: Order;
    orderDetail: OrderDetail[];
    payments: Payment[];
  };
  defaultInvoice?: string;
}

export function TemplateFunbeerking(props: Props) {
  const { setting, currentWarehouse, user, currency } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();

  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100",
  );
  const invoiceReceiptValue = props.defaultInvoice
    ? props.defaultInvoice
    : setting?.data?.result?.find((f) => f.option === "INVOICE_RECEIPT")?.value;
  const invoiceReceipt = invoiceReceiptValue
    ? invoiceReceiptValue.split(",")
    : [];
  const rtb = setting?.data?.result?.find((f) => f.option === "RTB")?.value;
  const servedType =
    props.order?.orderInfo.servedType === "food_delivery"
      ? "Delivery"
      : props.order?.orderInfo.servedType === "take_away"
        ? "Take Away"
        : "";
  const customer = props.order?.orderInfo.customerLoader?.customerName;
  const customerCount = props.order?.orderInfo.customer || 1;

  const receive =
    props.order?.payments.reduce((a, b) => {
      if (b.currency === "KHR" && currency === "$") {
        return a + Number(b.amount) / Number(b.exchangeRate);
      }

      return a + Number(b.amountUsd);
    }, 0) || 0;

  const total = Number(
    props.order?.orderDetail.reduce((a, b) => {
      if (!!props.order?.orderInfo.tableNumber) {
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

  const totalDiscount = props.order?.orderDetail.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0,
  );

  const totalAfterDiscount = total - (totalDiscount || 0);

  const change = receive <= 0 ? 0 : receive - totalAfterDiscount;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const displayTotalDiscount =
    invoiceReceipt.at(7) === "amount"
      ? formatForDisplay(Number(totalAfterDiscount))
      : ((Number(totalDiscount) / total) * 100).toFixed(2) + "%";

  let displayTotalDiscountAmount = null;

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
            flexDirection: "column",
          }}
        >
          {invoiceReceipt.at(2) && (
            <img
              src={invoiceReceipt.at(2)}
              alt=""
              style={{
                width: 65,
                objectFit: "contain",
                aspectRatio: "1/1",
                marginBottom: "-5%",
                marginTop: "-5%",
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
                  flexDirection: "column",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                <div
                  style={{
                    fontSize: "10pt",
                    textWrap: "wrap",
                    textAlign: "center",
                  }}
                >
                  {invoiceReceipt.at(1)}
                </div>
                {currentWarehouse?.name && (
                  <div
                    style={{
                      fontSize: "10pt",
                      textWrap: "wrap",
                      textAlign: "center",
                    }}
                  >
                    {currentWarehouse.name}
                  </div>
                )}
              </div>
            )}
            <>
              {!!rtb && (
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
                      fontSize: "8pt",
                      textWrap: "wrap",
                      textAlign: "center",
                      flexDirection: "row",
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      fontWeight: "bold",
                    }}
                  >
                    <div>អ ត ប</div> <div style={{ marginInline: 3 }}>:</div>{" "}
                    <div>{rtb}</div>
                  </div>
                </div>
              )}
              {currentWarehouse?.address && (
                <div
                  style={{
                    width: "100%",
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    marginTop: 4,
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
              {currentWarehouse?.phone && (
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
                    Tel: {currentWarehouse?.phone.split("/").join(" / ")}
                  </div>
                </div>
              )}
            </>
          </div>
        </div>
        <br />
        <div style={{ fontSize: "9pt" }}>
          {props.order?.orderInfo.tableName && (
            <div className="display">
              <div style={{ minWidth: 110 }}>Table</div>
              <div>:</div>
              <div>{props.order?.orderInfo.tableName}</div>
            </div>
          )}
          <div className="display">
            <div style={{ minWidth: 110 }}>Invoice No</div>
            <div>:</div>
            <div>
              POS
              {props.order?.orderInfo.invoiceNo
                .toString()
                .substring(8, props.order.orderInfo.invoiceNo.toString().length)
                .padStart(5, "0")}
            </div>
          </div>

          <div className="display">
            <div style={{ minWidth: 110 }}>Time In</div>
            <div>:</div>
            <div>
              {props.order?.orderInfo.createdAt
                ? moment(props.order.orderInfo.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss",
                  )
                : moment(new Date()).format("DD/MM/YYYY HH:mm:ss")}
            </div>
          </div>

          <div className="display">
            <div style={{ minWidth: 110 }}>Time Out</div>
            <div>:</div>
            <div>
              {props.order?.orderInfo.paidAt
                ? moment(props.order.orderInfo.paidAt).format(
                    "DD/MM/YYYY HH:mm:ss",
                  )
                : moment(new Date()).format("DD/MM/YYYY HH:mm:ss")}
            </div>
          </div>
          <div className="display">
            <div style={{ minWidth: 110 }}>Cashier</div>
            <div>:</div>
            <div>
              {(props.order?.payments.length || 0) > 0
                ? props.order?.payments.at(0)?.createdBy?.fullname
                : user?.fullname || ""}
            </div>
          </div>
          {customerCount && (
            <div className="display">
              <div style={{ minWidth: 110 }}>Customer ({customerCount})</div>
              <div>:</div>
              <div
                style={{ textTransform: "capitalize" }}
              >{`${customer ? customer : ""} ${servedType ? `(${servedType.replaceAll("_", " ")})` : ""}`}</div>
            </div>
          )}
        </div>
        <div style={{ marginTop: 4 }}>
          <table className="print_table">
            <thead>
              <tr
                className="border_header"
                style={{
                  background: "#000000",
                  WebkitPrintColorAdjust: "exact",
                  colorAdjust: "exact",
                  color: "#FFFFFF",
                }}
              >
                <th style={{ color: "#FFFFFF" }}>Item</th>
                <th style={{ textAlign: "right", color: "#FFFFFF" }}>Qty</th>
                <th style={{ textAlign: "left", color: "#FFFFFF" }}>Price</th>
                <th style={{ textAlign: "center", color: "#FFFFFF" }}>Dis</th>
                <th style={{ textAlign: "right", color: "#FFFFFF" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {props.order?.orderDetail.map((x, i) => {
                const qty = Number(
                  props.order?.orderInfo.tableNumber
                    ? x.status?.reduce((a, b) => a + b.qty, 0)
                    : x?.qty,
                );

                const itemTotal = props.order?.orderInfo.tableNumber
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
                          {`${x?.title}`}
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
                        {totalDiscount === 0
                          ? formatForDisplay(0)
                          : invoiceReceipt.at(7) === "amount"
                            ? currency === "$"
                              ? Formatter.formatCurrencyKH(
                                  (totalDiscount || 0) * exchangeRate,
                                )
                              : `$${(
                                  Number(totalDiscount) / exchangeRate
                                ).toFixed(2)}`
                            : formatForDisplay(0)}
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
                        {totalDiscount === 0
                          ? formatForDisplay(0)
                          : totalDiscount}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              <tr
                className="border_dot_t"
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  WebkitPrintColorAdjust: "exact",
                  colorAdjust: "exact",
                }}
              >
                <td
                  colSpan={2}
                  style={{
                    textAlign: "right",
                    border: "",
                    padding: 0,
                    color: "#ffffff",
                  }}
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
                  style={{
                    textAlign: "right",
                    border: "none",
                    padding: 0,
                    color: "#ffffff",
                  }}
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
                <td
                  style={{
                    textAlign: "right",
                    border: "none",
                    padding: 0,
                    color: "#ffffff",
                  }}
                >
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
                    <div style={{ height: "1.5rem" }}>Received Total</div>
                    <div style={{ height: "1.5rem" }}>Discount Total</div>
                    {props.order?.payments.map((payment) => {
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
                    <div style={{ height: "1.5rem" }}>
                      {currency === "$"
                        ? Formatter.formatCurrencyKH(receive * exchangeRate)
                        : `$${(Number(receive) / exchangeRate).toFixed(2)}`}
                    </div>
                    <div style={{ height: "1.5rem" }}>
                      {currency === "$"
                        ? Formatter.formatCurrencyKH(
                            (totalDiscount || 0) * exchangeRate,
                          )
                        : `$${(Number(totalDiscount || 0) / exchangeRate).toFixed(2)}`}
                    </div>
                    {props.order?.payments.map((payment) => {
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
                    <div style={{ height: "1.5rem" }}>
                      {formatForDisplay(Number(receive))}
                    </div>
                    <div style={{ height: "1.5rem" }}>
                      {totalDiscount
                        ? `${formatForDisplay(Number(totalDiscount))}`
                        : formatForDisplay(0)}
                    </div>
                    {props.order?.payments.map((payment) => {
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
              {props.order?.payments.map((x) => x.paymentMethod).join(", ")}
            </div>
          </div>
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

          {(props.order?.orderInfo.printCount || 0) > 1 && (
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
