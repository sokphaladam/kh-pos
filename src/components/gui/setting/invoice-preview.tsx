/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import moment from "moment-timezone";
import { DefaultPrint } from "../pos/print/default-print";
import { TemplateIPrint } from "../pos/print/template-i-print";
import { Button } from "@/components/ui/button";
import { useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { TemplateChhounHour } from "../pos/print/template-chhoun-hour";
import { CustomPrint } from "../pos/print/custom-print";
import { TemplateFunbeerking } from "../pos/print/template-funbeerking";

interface Props {
  value: string;
  onChangeValue: (v: string) => void;
}

export function InvoicePreview({ value, onChangeValue }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState("");

  const DUMMY_DATA: any = {
    orderInfo: {
      orderId: "ORDER12345",
      customerId: "CUSTOMER1",
      orderStatus: "PAID",
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
      invoiceNo: Number(
        `${moment().format("YYYYMMDD")}${Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, "0")}`,
      ),
      tableName: "Table 1",
      // Add any other required fields for Order type here
      createdBy: {
        fullname: "Test User",
        username: "testuser",
        id: "user123",
        phoneNumber: "1234567890",
        profile: "",
        roleId: "admin",
        token: "sample-token",
      },
      totalAmount: "25.0",
      servedType: "DINE_IN",
    },
    orderDetail: [
      {
        orderDetailId: "OD1",
        variantId: "V1",
        sku: "SKU1",
        barcode: "BARCODE1",
        modiferAmount: "0",
        title: "lorem ipsum dolor sit amet consectetur adipiscing elit 1",
        qty: 2,
        price: "5.0",
        discountAmount: "0",
        totalAmount: "10.0",
      },
      {
        orderDetailId: "OD2",
        variantId: "V2",
        sku: "SKU2",
        barcode: "BARCODE2",
        modiferAmount: "0",
        title: "lorem ipsum dolor sit amet consectetur adipiscing elit 2",
        qty: 1,
        price: "15.0",
        discountAmount: "5.0",
        totalAmount: "15.0",
      },
    ],
    payments: [
      {
        paymentId: "PAYMENT1",
        orderId: "ORDER12345",
        paymentMethod: "Cash",
        currency: "USD",
        amount: "25",
        amountUsd: "25",
        exchangeRate: "4100",
        paidAt: moment().toISOString(),
        reference: "",
        note: "",
        createdBy: {
          fullname: "Test User",
          username: "testuser",
          id: "user123",
          phoneNumber: "1234567890",
          profile: "",
          roleId: "admin",
          token: "sample-token",
        },
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString(),
        updatedBy: {
          fullname: "Test User",
          username: "testuser",
          id: "user123",
          phoneNumber: "1234567890",
          profile: "",
          roleId: "admin",
          token: "sample-token",
        },
        deletedAt: null,
        deletedBy: null,
      },
    ],
  };

  const [
    template,
    title,
    logo,
    margin,
    limitProductName,
    productNameLimitLine,
  ] = useMemo(() => value.split(","), [value]);

  const onPrint = () => {
    if (ref.current && printFrameRef.current) {
      setDoc(
        `<div>` +
          ref.current.innerHTML +
          "</div><script>window.print(); window.onafterprint = function() {parent.postMessage('print-complete', '*');};/*" +
          Math.random().toString() +
          "*/</script>",
      );
    }
  };

  const renderTemplate = () => {
    if (value.split(",")[0] === "default") {
      return <DefaultPrint order={DUMMY_DATA} defaultInvoice={value} />;
    } else if (value.split(",")[0] === "template-ch") {
      return <TemplateChhounHour order={DUMMY_DATA} defaultInvoice={value} />;
    } else if (value.split(",")[0] === "template-i") {
      return <TemplateIPrint order={DUMMY_DATA} defaultInvoice={value} />;
    } else if (value.split(",")[0] === "template-funbeerking") {
      return <TemplateFunbeerking order={DUMMY_DATA} defaultInvoice={value} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          value={template}
          onValueChange={(e) =>
            onChangeValue(
              `${e},${title},${logo},${margin},${limitProductName},${productNameLimitLine}`,
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select template invoice" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="template-i">Template I</SelectItem>
              <SelectItem value="template-ch">Template CH</SelectItem>
              <SelectItem value="template-funbeerking">
                Template Funbeerking
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant={"secondary"} onClick={onPrint}>
            Print
          </Button>
          <CustomPrint order={DUMMY_DATA} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Invoice preview</Label>
        <div className="w-[80mm] border">
          <div ref={ref}>{renderTemplate()}</div>
        </div>
      </div>
      <iframe
        ref={printFrameRef}
        style={{ position: "absolute", width: "0", height: "0", border: "0" }}
        srcDoc={doc}
        title="Print Frame"
      />
    </div>
  );
}
