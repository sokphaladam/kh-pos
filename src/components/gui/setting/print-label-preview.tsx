import QRCode from "react-qr-code";
import { useAuthentication } from "../../../../contexts/authentication-context";
import { PrintLabelJson } from "./print-label";

export function PrintLabelPreview({ data }: { data: PrintLabelJson }) {
  const { currency } = useAuthentication();
  return (
    <div
      style={{
        width: data.paperSize?.width + "mm",
        height: data.paperSize?.height + "mm",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 10,
        textAlign: "center",
        flexDirection: "column",
        paddingLeft: data.paperSize?.padding?.left,
        paddingBottom: data.paperSize?.padding?.bottom,
        paddingRight: data.paperSize?.padding?.right,
        paddingTop: data.paperSize?.padding?.top,
        border: "1px dashed #ccc",
      }}
      className="pagebreak"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          width: data.paperSize?.width + "mm",
          justifyContent:
            data.price || data.barcode?.displayValue ? "inherit" : "center",
        }}
      >
        {(data.price || data.barcode?.displayValue) && (
          <div
            style={{
              width: (data.paperSize?.width || 0) / 2 + "mm",
              display: "flex",
              flexWrap: "wrap",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
              overflowWrap: "break-word",
            }}
          >
            {data.price && <div>{currency}9.99</div>}
            {data.barcode?.displayValue ? (
              <div
                style={{ textWrap: "wrap", width: "100%", textAlign: "left" }}
              >
                {"8809253649255::123456"}
              </div>
            ) : (
              <></>
            )}
          </div>
        )}
        <div style={{ width: data.barcode?.height }}>
          <QRCode
            value={"8809253649255::123456"}
            fontSize={10}
            size={data.barcode?.height}
            title={
              data.barcode?.displayValue ? "8809253649255::123456" : undefined
            }
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 256 256`}
          />
        </div>
      </div>
    </div>
  );
}
