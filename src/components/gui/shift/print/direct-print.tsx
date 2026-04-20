/* eslint-disable @next/next/no-css-tags */
import { useEffect, useRef, useState } from "react";
import { useAuthentication } from "../../../../../contexts/authentication-context";
import { useQueryShift } from "@/app/hooks/use-query-shift";
import moment from "moment-timezone";
import { table_shift } from "@/generated/tables";
import { Formatter } from "@/lib/formatter";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface Props {
  shiftId: string;
  onPrintComplete: () => void;
  autoprint?: boolean;
}

function RenderShiftItemList({
  value,
  text,
  bold,
}: {
  value: string;
  text: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: bold ? "bold" : "normal",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 2, width: 150 }}>{text}</div>
      <div
        style={{
          width: 50,
          border: "solid black 0.1px",
          borderWidth: "0 0 0 0.1px",
        }}
      ></div>
      <div style={{ padding: 2, width: 150, textAlign: "right" }}>{value}</div>
    </div>
  );
}

export function ShiftDireactPrint({
  onPrintComplete,
  shiftId,
  autoprint = true,
}: Props) {
  const { user } = useAuthentication();
  const { currencyCode, formatForDisplay } = useCurrencyFormat();
  const [doc, setDoc] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const { data, isLoading } = useQueryShift(user?.id, 1, 0, shiftId);

  useEffect(() => {
    if (ref.current && printFrameRef.current && data && !isLoading) {
      setDoc(
        `<div>` +
          ref.current.innerHTML +
          "</div><script>window.print(); /*" +
          Math.random().toString() +
          "*/</script>",
      );
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (autoprint && data && !isLoading) {
      setTimeout(() => {
        onPrintComplete();
      }, 500);
    }
  }, [autoprint, onPrintComplete, data, isLoading]);

  if (isLoading) return <div>Loading...</div>;

  const shift = data
    ? (data.result?.data as unknown as table_shift[])[0]
    : null;
  const receipt = shift?.receipt;
  const method = receipt.amountByMethod;
  const bank = Object.keys(method)
    .filter((f) => f !== "CASH")
    .map((x) => method[x]);

  return (
    <>
      <div ref={ref} style={{ color: "#000" }}>
        <link type="text/css" rel="stylesheet" href="/printing.css" />
        <div className="noto-sans-khmer" style={{ width: "95%" }}>
          <div className="w-full flex flex-row justify-center">
            {/* <img
              src={config_app.public.assets.logo}
              alt=""
              style={{ width: 'auto', height: 35, objectFit: 'contain' }}
            /> */}
          </div>
          <br />
          <div
            style={{ fontWeight: "bold", textAlign: "center", color: "#000" }}
          >
            {"Minutes of shift handover".toUpperCase()}
          </div>
          <div
            style={{ display: "flex", justifyContent: "center", color: "#000" }}
          >
            <small>
              Shift on{" "}
              {moment(new Date(shift?.opened_at || "")).format("DD/MMM/YYYY")}
            </small>
          </div>
          <br />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: 11,
              width: "70mm",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>
                Opening shift:
              </div>
              <small>
                {moment(new Date(shift?.opened_at || "")).format(
                  "YYYY-MMM-DD HH:mm:ss",
                )}
              </small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>
                Closing shift:
              </div>
              <small>
                {moment(new Date(shift?.closed_at || "")).format(
                  "YYYY-MMM-DD HH:mm:ss",
                )}
              </small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>
                Handover person:
              </div>
              <small>{receipt.employee}</small>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <h6>HANDOVER CONTENT</h6>
          </div>
          <div
            style={{
              borderWidth: "0.1px",
              border: "solid black 0.1px",
              fontSize: 11,
            }}
          >
            <div style={{ padding: 2 }}>
              <strong
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "left",
                }}
              >
                ✔️ Cash
              </strong>
            </div>
            <hr style={{ borderColor: "black", margin: 0 }} />
            <div style={{ padding: 2 }}>
              <strong>Cash ({currencyCode === "USD" ? "USD" : "KHR"})</strong>
            </div>
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Opening Shift"
              value={formatForDisplay(Number(shift?.opened_cash_usd || 0))}
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Closing Shift"
              value={formatForDisplay(Number(shift?.closed_cash_usd || 0))}
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Actual Balance"
              value={formatForDisplay(Number(shift?.actual_cash_usd || 0))}
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Difference"
              value={formatForDisplay(
                Number(shift?.actual_cash_usd || 0) -
                  Number(shift?.closed_cash_usd || 0),
              )}
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Handover amount"
              value={formatForDisplay(Number(shift?.actual_cash_usd || 0))}
              bold
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <div style={{ padding: 2 }}>
              <strong>Cash ({currencyCode === "USD" ? "KHR" : "USD"})</strong>
            </div>
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Opening Shift"
              value={
                currencyCode === "USD"
                  ? Formatter.formatCurrencyKH(
                      Number(shift?.opened_cash_khr || 0),
                    )
                      ?.toString()
                      .replace("៛", "") + "៛"
                  : `$${Number(shift?.opened_cash_khr || 0).toFixed(2)}`
              }
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Closing Shift"
              value={
                currencyCode === "USD"
                  ? Formatter.formatCurrencyKH(
                      Number(shift?.closed_cash_khr || 0),
                    )
                      ?.toString()
                      .replace("៛", "") + "៛"
                  : `$${Number(shift?.closed_cash_khr || 0).toFixed(2)}`
              }
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Actual Balance"
              value={
                currencyCode === "USD"
                  ? Formatter.formatCurrencyKH(
                      Number(shift?.actual_cash_khr || 0),
                    )
                      ?.toString()
                      .replace("៛", "") + "៛"
                  : `$${Number(shift?.actual_cash_khr || 0).toFixed(2)}`
              }
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Difference"
              value={
                currencyCode === "USD"
                  ? Formatter.formatCurrencyKH(
                      Number(shift?.actual_cash_khr || 0) -
                        Number(shift?.closed_cash_khr || 0),
                    )
                      ?.toString()
                      .replace("៛", "") + "៛"
                  : `$${(
                      Number(shift?.actual_cash_khr || 0) -
                      Number(shift?.closed_cash_khr || 0)
                    ).toFixed(2)}`
              }
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Handover amount"
              value={
                currencyCode === "USD"
                  ? Formatter.formatCurrencyKH(
                      Number(shift?.actual_cash_khr || 0),
                    )
                      ?.toString()
                      .replace("៛", "") + "៛"
                  : `$${Number(shift?.actual_cash_khr || 0).toFixed(2)}`
              }
              bold
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Handover amount"
              value={
                currencyCode === "USD"
                  ? Formatter.formatCurrencyKH(
                      Number(shift?.actual_cash_khr || 0),
                    )
                      ?.toString()
                      .replace("៛", "") + "៛"
                  : `$${Number(shift?.actual_cash_khr || 0).toFixed(2)}`
              }
              bold
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="✔️ Payment Method"
              value={receipt.payments}
              bold
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            {Object.keys(method).map((x) => {
              return (
                <div key={x}>
                  <div>
                    <RenderShiftItemList
                      value={`${formatForDisplay(method[x].usd)}`}
                      text={`${x} (${method[x].qty || 0})`}
                    />
                    <hr style={{ borderColor: "black", margin: 0 }} />
                  </div>
                  <div>
                    <RenderShiftItemList
                      value={
                        currencyCode === "USD"
                          ? `${Formatter.formatCurrencyKH(Number(method[x].khr))
                              ?.toString()
                              .replace("៛", "")}​​៛`
                          : `$${Number(method[x].khr).toFixed(2)}`
                      }
                      text={``}
                    />
                    <hr style={{ borderColor: "black", margin: 0 }} />
                  </div>
                </div>
              );
            })}
            <RenderShiftItemList
              text="✔️ Sales"
              value={formatForDisplay(Number(receipt.sales))}
              bold
            />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="✔️ Returns"
              value={formatForDisplay(Number(receipt.amountReturned))}
              bold
            />
            {receipt.totalCustomer && (
              <>
                <hr style={{ borderColor: "black", margin: 0 }} />
                <RenderShiftItemList
                  text="Total number of Customers"
                  value={Number(receipt.totalCustomer).toString()}
                  bold
                />
              </>
            )}
            {receipt.avgCustomer && (
              <>
                <hr style={{ borderColor: "black", margin: 0 }} />
                <RenderShiftItemList
                  text="Average Spending"
                  value={formatForDisplay(Number(receipt.avgCustomer))}
                />
              </>
            )}
            <hr style={{ borderColor: "black", margin: 0 }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <div style={{ padding: 2, width: 150 }}>✔️ Other</div>
            </div>
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList text="Qty. of bills" value={receipt.orders} />
            <hr style={{ borderColor: "black", margin: 0 }} />
            <RenderShiftItemList
              text="Qty. of card slips"
              value={bank.reduce((a, b) => (a = a + b.qty), 0)}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              margin: "0 20px",
            }}
          >
            <div>
              <div>
                <strong>Handover person</strong>
                <div style={{ marginTop: 75 }}>{receipt.employee}</div>
              </div>
            </div>
            <div>
              <strong>Takeover person</strong>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: 11,
              margin: 10,
            }}
          >
            <strong>Manager/Head</strong>
          </div>
        </div>
      </div>
      <iframe
        ref={printFrameRef}
        style={{ position: "absolute", width: "0", height: "0", border: "0" }}
        srcDoc={doc}
        title="Print Frame"
      />
    </>
  );
}
