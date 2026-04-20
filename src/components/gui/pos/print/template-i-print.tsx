/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-css-tags */
import { Order, OrderDetail } from "@/classes/order";
import { Payment } from "@/classes/payment";
import { Formatter } from "@/lib/formatter";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import { Fragment } from "react";

export function TemplateIPrint({
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
  const { user, setting } = useAuthentication();
  const exchangeRate = Number(
    !setting?.isLoading && setting?.data?.result
      ? setting.data?.result?.find((f) => f.option === "EXCHANGE_RATE")?.value
      : "4100"
  );

  const total = Number(
    order?.orderDetail.reduce((a, b) => {
      if (!!order.orderInfo.tableNumber) {
        const qty =
          b.status?.reduce((qty, status) => qty + Number(status.qty), 0) || 0;
        const priceAfterModifier = Number(b.modiferAmount) + Number(b.price);
        a = a + priceAfterModifier * qty;
      } else {
        a = a + Number(b.price) * Number(b.qty);
      }
      return a;
    }, 0) || 0
  );
  const totalDiscount = order?.orderDetail.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0
  );
  const totalAfterDiscount = total - (totalDiscount || 0);
  const receive =
    order?.payments.reduce((a, b) => (a = a + Number(b.amountUsd)), 0) || 0;
  const change = receive <= 0 ? 0 : receive - totalAfterDiscount;
  const invoiceReceiptValue = defaultInvoice
    ? defaultInvoice
    : setting?.data?.result?.find((f) => f.option === "INVOICE_RECEIPT")?.value;
  const invoiceReceipt = invoiceReceiptValue
    ? invoiceReceiptValue.split(",")
    : [];

  return (
    <>
      <link type="text/css" rel="stylesheet" href="/printing.css" />
      <div
        className="noto-sans-khmer"
        style={{
          position: "relative",
          width: "95%",
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
            <div
              style={{
                width: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "row",
                justifyContent: "left",
              }}
            >
              <img
                src={invoiceReceipt.at(2)}
                alt=""
                style={{
                  width: 75,
                  objectFit: "cover",
                  aspectRatio: "1/1",
                }}
              />
            </div>
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
                <div style={{ fontSize: "12pt" }}>{invoiceReceipt.at(1)}</div>
              </div>
            )}
            <div
              style={{
                width: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "12pt" }}>វិក្កយបត្រ</div>
                <div style={{ fontSize: "14pt" }}>Invoice</div>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div
          style={{
            fontSize: 12,
          }}
        >
          <div>
            <div
              className="display"
              style={{ justifyContent: "space-between", flexWrap: "nowrap" }}
            >
              {order?.orderInfo.tableName && (
                <div>
                  តុលេខ: <b>{order?.orderInfo.tableName}</b>
                </div>
              )}
              <div>
                អតិថិជន: <b>General</b>
              </div>
              <div style={{ width: 100 }}>
                អ្នកលក់:{" "}
                <b>
                  {(order?.payments.length || 0) > 0
                    ? order?.payments.at(0)?.createdBy?.fullname
                    : user?.fullname || ""}
                </b>
              </div>
              {order?.orderInfo.createdBy && (
                <div style={{ width: 100, textAlign: "right" }}>
                  បញ្ជាទិញ: <b>{order.orderInfo.createdBy.fullname || ""}</b>
                </div>
              )}
            </div>
          </div>
          <div>
            <div
              className="display"
              style={{ justifyContent: "space-between", flexWrap: "nowrap" }}
            >
              <div>
                វិក្កយបត្រ:{" "}
                {order?.orderInfo.invoiceNo
                  .toString()
                  .replace(moment().format("YYYYMMDD"), "")}
              </div>
              <div style={{ width: 110 }}>
                {order?.orderInfo.paidAt
                  ? moment(order.orderInfo.paidAt).format("YYYY-MM-DD HH:MM:SS")
                  : moment(new Date()).format("MMM DD YYYY HH:MM")}
              </div>
            </div>
          </div>
        </div>
        <div>
          <table className="print_table">
            <thead>
              <tr
                className="border_header"
                style={{ backgroundColor: "gray", opacity: 0.8 }}
              >
                <th>
                  <div>
                    <div>លរ</div>
                    <div>No</div>
                  </div>
                </th>
                <th>
                  <div>
                    <div>ទំនិញ</div>
                    <div>Description</div>
                  </div>
                </th>
                <th style={{ textAlign: "right" }}>
                  <div>
                    <div>ចំនួន</div>
                    <div>QTY</div>
                  </div>
                </th>
                <th style={{ textAlign: "left" }}>
                  <div>
                    <div>តម្លៃ</div>
                    <div>Price</div>
                  </div>
                </th>
                <th style={{ textAlign: "right" }}>
                  <div>
                    <div>សរុប</div>
                    <div>Amt</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {order?.orderDetail.map((x, i) => {
                const qty = Number(
                  order.orderInfo.tableNumber
                    ? x.status?.reduce((a, b) => a + b.qty, 0)
                    : x?.qty
                );
                const priceAfterModifier =
                  Number(x.modiferAmount) + Number(x.price);
                const itemTotal = order.orderInfo.tableNumber
                  ? priceAfterModifier * qty
                  : x.totalAmount;
                return (
                  <Fragment key={i}>
                    <tr key={i} className={"border_x"}>
                      <td>{i + 1}</td>
                      <td
                        style={{
                          textAlign: "start",
                          display: "flex",
                          flexDirection: "row",
                          textWrap: "wrap",
                          maxWidth: 150,
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
                                    invoiceReceipt.at(5) || 1
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
                          textAlign: "center",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                        // className="!text-center !border-y-0"
                      >
                        {qty}
                      </td>
                      <td
                        style={{
                          textAlign: "left",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                        // className="text-left !border-y-0"
                      >
                        ${priceAfterModifier.toFixed(2)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          borderTopWidth: 0,
                          borderBottomWidth: 0,
                        }}
                        // className="text-right !border-y-0"
                      >
                        ${Number(itemTotal).toFixed(2)}
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
                              <td></td>
                              <td
                                style={{
                                  textAlign: "start",
                                  display: "flex",
                                  flexDirection: "row",
                                  textWrap: "nowrap",
                                }}
                              >
                                <div style={{ paddingLeft: 10 }}>
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
                                  ? `+$${mod.price?.toFixed(2)}`
                                  : ""}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      <></>
                    )}
                  </Fragment>
                );
              })}
              <tr className="border_t">
                <td>
                  <div className="display-sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      សរុប
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", border: "", padding: 0 }}>
                  <div className="display-sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      G.Total
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
                      {Formatter.formatCurrencyKH(
                        totalAfterDiscount * exchangeRate
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", border: "none", padding: 0 }}>
                  <div className="display-sub">
                    <div style={{ height: "1.5rem", fontWeight: "bold" }}>
                      ${totalAfterDiscount.toFixed(2)}
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border_dot_t">
                <td style={{ border: "", padding: "0 0 0 4px" }}>
                  <div className="display_sub">
                    <div style={{ height: "1.5rem" }}>ទទួល</div>
                    <div style={{ height: "1.5rem", textWrap: "nowrap" }}>
                      លុយអាប់
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", border: "", padding: 0 }}>
                  <div className="display_sub">
                    {order?.payments.map((x) => {
                      return (
                        <div style={{ height: "1.5rem" }} key={x.paymentId}>
                          {x.paymentMethod}
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
                    {order?.payments.map((x) => {
                      return (
                        <div style={{ height: "1.5rem" }} key={x.paymentId}>
                          {Formatter.formatCurrencyKH(
                            Number(x.amountUsd) * exchangeRate
                          )}
                        </div>
                      );
                    })}
                    <div style={{ height: "1.5rem" }}>
                      {Formatter.formatCurrencyKH(change * exchangeRate)}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", border: "none", padding: 0 }}>
                  <div className="display_sub">
                    {order?.payments.map((x) => {
                      return (
                        <div style={{ height: "1.5rem" }} key={x.paymentId}>
                          ${Number(x.amountUsd).toFixed(2)}
                        </div>
                      );
                    })}
                    <div style={{ height: "1.5rem" }}>${change.toFixed(2)}</div>
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
              marginTop: 7,
            }}
          >
            អរគុណ​ សូមអញ្ជើញមកម្តងទៀត!
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
    </>
  );
}
