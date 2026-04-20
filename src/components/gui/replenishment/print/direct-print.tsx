/* eslint-disable @next/next/no-css-tags */
import { useEffect, useRef, useState } from "react";
import { useQueryReplenishmentDetail } from "@/app/hooks/use-query-replenishment";
import { FindProductInSlotResult } from "@/classes/find-product-in-slot";

interface Props {
  id: string;
  onPrintComplete: () => void;
  autoprint?: boolean;
  pickingList?: FindProductInSlotResult[];
}

export function ReplenishmentDireactPrint({
  onPrintComplete,
  id,
  autoprint = true,
  pickingList,
}: Props) {
  const [doc, setDoc] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const { data, isLoading } = useQueryReplenishmentDetail(id);

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

  const unique = [];
  const seen = new Set();

  for (const obj of data?.replenishmentPickingList || []) {
    if (!seen.has(obj.variant?.id)) {
      seen.add(obj.variant?.id);
      unique.push(obj);
    }
  }

  let picking = data?.replenishmentPickingList || [];

  if (data?.replenishmentPickingList?.length === 0) {
    picking = pickingList || [];
  }

  return (
    <>
      <div ref={ref} style={{ color: "#000" }}>
        <link type="text/css" rel="stylesheet" href="/printing.css" />
        <div className="noto-sans-khmer" style={{ width: "95%" }}>
          <br />
          <div
            style={{ fontWeight: "bold", textAlign: "center", color: "#000" }}
          >
            {"Picking List".toUpperCase()}
          </div>
          <div
            style={{ display: "flex", justifyContent: "center", color: "#000" }}
          ></div>
          <br />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: 11,
              width: "95%",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: 100, textAlign: "left" }}>ID:</div>
              <small>
                TR-{data?.replenishmentInfo.autoId.toString().padStart(4, "0")}
              </small>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: 100, textAlign: "left" }}>From:</div>
              <small>{data?.replenishmentInfo.fromWarehouseId?.name}</small>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: 100, textAlign: "left" }}>To:</div>
              <small>{data?.replenishmentInfo.toWarehouseId?.name}</small>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: 100, textAlign: "left" }}>Created By:</div>
              <small>{data?.replenishmentInfo.createdBy?.fullname}</small>
            </div>
          </div>
          <hr style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }} />
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: "0.2rem",
            }}
          >
            ITEM TO PICK ({unique.length})
          </div>
          <div
            className="space-y-3"
            style={{
              marginTop: "calc(0.75rem /* 12px */ * calc(1 - 0))",
              marginBottom: "calc(0.75rem /* 12px */ * 0)",
            }}
          >
            {picking.map((x, idx) => {
              return (
                <div key={idx} className="pick-item">
                  <div className="index">#{idx + 1}</div>

                  {/* SKU */}
                  <div style={{ fontSize: "0.75rem", lineHeight: "1rem" }}>
                    <span className="font-semibold" style={{ fontWeight: 600 }}>
                      SKU:
                    </span>
                    <span
                      className="font-mono ml-1"
                      style={{ marginLeft: "0.25rem" }}
                    >
                      {x.variant?.sku}
                    </span>
                  </div>

                  {/* Product Name */}
                  <div className="pick-item-title">
                    {x.variant?.basicProduct?.title}
                  </div>

                  <div className="pick-item-qty-slot">
                    <div>
                      <span
                        className="font-semibold"
                        style={{ fontWeight: 600 }}
                      >
                        QTY:
                      </span>
                      <span
                        className="text-lg font-bold ml-1"
                        style={{ marginLeft: "0.25rem", fontWeight: "bold" }}
                      >
                        {x.qty}
                      </span>
                    </div>
                    <div className="text-right" style={{ textAlign: "right" }}>
                      <div>
                        <span
                          className="font-semibold"
                          style={{ fontWeight: 600 }}
                        >
                          SLOT:
                        </span>{" "}
                        {x.slot?.name}
                      </div>
                      <div>
                        <span
                          className="font-semibold"
                          style={{ fontWeight: 600 }}
                        >
                          LOT:
                        </span>{" "}
                        {x.lot?.lotNumber}
                      </div>
                    </div>
                  </div>

                  {/* Checkbox and Picked Quantity */}
                  <div className="pick-item-check-pick-qty">
                    <div></div>
                    {/* <div className="pick-item-check">
                      <div className="pick-item-checkbox"></div>
                      <span
                        className="text-xs"
                        style={{ lineHeight: "1rem", fontSize: "0.75rem" }}
                      >
                        PICKED
                      </span>
                    </div> */}
                    <div
                      className="text-xs"
                      style={{ lineHeight: "1rem", fontSize: "0.75rem" }}
                    >
                      <span>ACTUAL QTY: </span>
                      <span className="pick-item-qty"></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <hr style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }} />
          <div
            className="text-center text-xs mb-3"
            style={{
              marginBottom: "0.75rem",
              textAlign: "center",
              fontSize: "0.75rem",
              lineHeight: "1rem",
            }}
          >
            <div className="font-bold" style={{ fontWeight: "bold" }}>
              TOTAL ITEMS: {unique.length}
            </div>
            <div className="font-bold" style={{ fontWeight: "bold" }}>
              TOTAL QTY:{" "}
              {data?.replenishmentDetails.reduce(
                (sum, item) => sum + item.sentQty,
                0,
              )}
            </div>
          </div>
          <hr style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }} />
          <div
            className="text-xs"
            style={{ lineHeight: "1rem", fontSize: "0.75rem" }}
          >
            <div
              className="font-semibold mb-1"
              style={{ marginBottom: "0.25rem" }}
            >
              INSTRUCTIONS:
            </div>
            <div
              className="space-y-1"
              style={{
                marginTop: "calc(0.25rem * calc(1 - 0))",
                marginBottom: "calc(0.25rem * 0)",
              }}
            >
              <div>• Check items as picked</div>
              <div>• Verify quantities</div>
              <div>• Report discrepancies</div>
              <div>• Get supervisor approval</div>
            </div>
          </div>

          <div className="pick-item-footer">
            <div>Generated: {new Date().toLocaleString()}</div>
            <div className="mt-1" style={{ marginTop: "0.25rem" }}>
              *** END OF LIST ***
            </div>
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
