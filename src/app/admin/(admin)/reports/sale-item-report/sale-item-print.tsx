/* eslint-disable @next/next/no-css-tags */
"use client";

import { useCurrencyFormat } from "@/hooks/use-currency-format";
import { useAuthentication } from "contexts/authentication-context";
import moment from "moment-timezone";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  onPrintComplete: () => void;
  data: {
    description: string;
    qty: number;
    discount_amount: number;
    total_amount: number;
  }[];
  startDate: string;
  endDate: string;
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
  discount?: string | number;
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
          fontSize: "7pt !important",
        }}
      >
        {text}
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

export function SaleItemPrint(props: Props) {
  const { setting, user, currentWarehouse } = useAuthentication();
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
            Sale Item Summary Report
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
              <small>{props.startDate}</small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>To:</div>
              <small>{props.endDate}</small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>Outlet:</div>
              <small>{currentWarehouse?.name}</small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 100, textAlign: "left" }}>Print By:</div>
              <small>{user?.fullname}</small>
            </div>
          </div>
          <br />
          <div
            style={{
              borderWidth: "0.1px",
              border: "solid black 0.1px",
              fontSize: 8,
            }}
          >
            <RenderItemList
              text="Description"
              bold
              value={"Amount"}
              qty={"Qty"}
              discount={"Discount"}
              header
            />
            <hr
              style={{
                borderColor: "black",
                margin: 0,
              }}
            />
            {props.data.map((item, index) => {
              return (
                <React.Fragment key={index}>
                  <RenderItemList
                    text={item.description}
                    value={formatForDisplay(item.total_amount)}
                    qty={item.qty}
                    discount={formatForDisplay(item.discount_amount)}
                  />
                  <hr
                    style={{
                      borderColor: "black",
                      margin: 0,
                    }}
                  />
                </React.Fragment>
              );
            })}
            <RenderItemList
              text={"Grand Total"}
              value={formatForDisplay(
                props.data.reduce((acc, item) => acc + item.total_amount, 0),
              )}
              qty={props.data.reduce((acc, item) => acc + item.qty, 0)}
              discount={formatForDisplay(
                props.data.reduce((acc, item) => acc + item.discount_amount, 0),
              )}
              header
              bold
            />
          </div>
          <br />
          <div style={{ fontSize: 10 }}>
            Print On : {moment().format("DD/MM/YYYY HH:mm:ss")}
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
