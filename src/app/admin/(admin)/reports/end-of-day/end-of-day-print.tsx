/* eslint-disable @next/next/no-css-tags */
"use client";

import { EndOfDayReportResponse } from "@/app/api/report/end-of-day/end-of-day-report";
import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { useAuthentication } from "contexts/authentication-context";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  onPrintComplete: () => void;
  data: EndOfDayReportResponse;
}

function RenderItemList({
  value,
  text,
  bold,
  qty,
  header,
}: {
  value?: string;
  text: string;
  bold?: boolean;
  qty?: string | number;
  header?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: bold ? "bold" : "normal",
        position: "relative",
        overflow: "hidden",
        backgroundColor: header ? "#000000" : "transparent",
        color: header ? "#ffffff" : "#000000",
        WebkitPrintColorAdjust: "exact",
        colorAdjust: "exact",
      }}
    >
      <div
        style={{
          padding: 2,
          width: 225,
          textTransform: "capitalize",
          backgroundColor: header ? "#000000" : "transparent",
          color: header ? "#ffffff" : "#000000",
        }}
      >
        {text.toLowerCase() === "dine in" ? "Walk In" : text}
      </div>
      {(!!qty || !!value) && (
        <>
          <div
            style={{
              width: 50,
              border: "solid black 0.1px",
              borderWidth: "0 0 0 0.1px",
              backgroundColor: header ? "#000000" : "transparent",
            }}
          ></div>
          <div
            style={{
              padding: 2,
              width: 75,
              textAlign: "right",
              backgroundColor: header ? "#000000" : "transparent",
              color: header ? "#ffffff" : "#000000",
            }}
          >
            {qty}
          </div>
          <div
            style={{
              width: 50,
              border: "solid black 0.1px",
              borderWidth: "0 0 0 0.1px",
              backgroundColor: header ? "#000000" : "transparent",
            }}
          ></div>
          <div
            style={{
              padding: 2,
              width: 150,
              textAlign: "right",
              backgroundColor: header ? "#000000" : "transparent",
              color: header ? "#ffffff" : "#000000",
            }}
          >
            {value}
          </div>
        </>
      )}
    </div>
  );
}

export function EndOfDayPrint(props: Props) {
  const { setting } = useAuthentication();
  const { formatForDisplay } = useCurrencyFormat();
  const [doc, setDoc] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (ref.current && printFrameRef.current && props.data) {
      setDoc(
        `<div>` +
          ref.current.innerHTML +
          "</div><script>window.print(); /*" +
          Math.random().toString() +
          "*/</script>",
      );
    }
  }, [props]);

  useEffect(() => {
    if (!!props.data) {
      setTimeout(() => {
        props.onPrintComplete();
      }, 500);
    }
  }, [props]);

  const invoiceReciept = setting?.data?.result?.find(
    (f) => f.option === "INVOICE_RECEIPT",
  )?.value;

  return (
    <>
      <div ref={ref} style={{ color: "#000" }}>
        <link type="text/css" rel="stylesheet" href="/printing.css" />
        <div className="noto-sans-khmer" style={{ width: "95%" }}>
          <div
            className="w-full flex flex-row justify-center"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          ></div>
          <br />
          <div
            style={{ fontWeight: "bold", textAlign: "center", color: "#000" }}
          >
            {invoiceReciept?.split(",")?.at(1)}
          </div>
          <div
            style={{ fontWeight: "bold", textAlign: "center", color: "#000" }}
          >
            End of Day Summary Report
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
              <div style={{ width: 100, textAlign: "left" }}>From:</div>
              <small>{props.data.startDate}</small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>To:</div>
              <small>{props.data.endDate}</small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>
                Close Report By:
              </div>
              <small>{props.data.user.fullname}</small>
            </div>
          </div>
          <br />
          <div
            style={{
              borderWidth: "0.1px",
              border: "solid black 0.1px",
              fontSize: 11,
            }}
          >
            <RenderItemList
              text="Description"
              bold
              value={"Amount"}
              qty={"Qty"}
              header
            />
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            <RenderItemList
              text="Total Sale"
              bold
              value={formatForDisplay(props.data.totalSale)}
            />
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            <RenderItemList
              text="Transaction"
              bold
              qty={props.data.transactionCount}
            />
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            <RenderItemList
              text="Average Sale"
              bold
              value={
                props.data.transactionCount > 0
                  ? formatForDisplay(
                      props.data.totalSale / props.data.transactionCount,
                    )
                  : formatForDisplay(0)
              }
            />
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            <RenderItemList text="ORDER SUMMARY" bold />
            {props.data.servedSummary &&
              Object.entries(props.data.servedSummary).map(([key, val]) => (
                <React.Fragment key={key}>
                  <hr
                    style={{
                      borderColor: "black",
                      margin: 0,
                    }}
                  />
                  <RenderItemList
                    key={key}
                    text={key.replaceAll("_", " ")}
                    qty={val.qty}
                    value={formatForDisplay(val.amount)}
                  />
                </React.Fragment>
              ))}
            {props.data.paymentSummary &&
              Object.entries(props.data.paymentSummary).map(([key, val]) => (
                <React.Fragment key={key}>
                  <hr
                    style={{
                      borderColor: "black",
                      margin: 0,
                    }}
                  />
                  <RenderItemList
                    key={key}
                    text={key.replaceAll("_", " ")}
                    qty={val.qty}
                    value={formatForDisplay(val.amount)}
                  />
                </React.Fragment>
              ))}
            {props.data.discountSummary &&
              Object.entries(props.data.discountSummary).map(([key, val]) => (
                <React.Fragment key={key}>
                  <hr
                    style={{
                      borderColor: "black",
                      margin: 0,
                    }}
                  />
                  <RenderItemList
                    key={key}
                    text={
                      key === "Total Discount"
                        ? key.toUpperCase()
                        : key.replaceAll("_", " ")
                    }
                    qty={val.qty}
                    value={formatForDisplay(val.amount)}
                    bold={key === "Total Discount"}
                  />
                </React.Fragment>
              ))}
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            <RenderItemList text="SALE BY SUMMARY" bold />
            {props.data.categorySummary &&
              Object.entries(props.data.categorySummary).map(([key, val]) => (
                <React.Fragment key={key}>
                  <hr
                    style={{
                      borderColor: "black",
                      margin: 0,
                    }}
                  />
                  <RenderItemList
                    key={key}
                    text={key.replaceAll("_", " ")}
                    qty={val.qty}
                    value={formatForDisplay(val.amount)}
                  />
                </React.Fragment>
              ))}
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            <RenderItemList text="SALE BY CUSTOMER" bold />
            {props.data.customerSummary &&
              Object.entries(props.data.customerSummary).map(([key, val]) => (
                <React.Fragment key={key}>
                  <hr
                    style={{
                      borderColor: "black",
                      margin: 0,
                    }}
                  />
                  <RenderItemList
                    key={key}
                    text={key.replaceAll("_", " ")}
                    qty={val.qty}
                    value={formatForDisplay(val.amount)}
                  />
                </React.Fragment>
              ))}
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
