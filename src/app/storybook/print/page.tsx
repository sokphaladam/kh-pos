"use client";

import { DefaultPrint } from "@/components/gui/pos/print/default-print";
import { TemplateIPrint } from "@/components/gui/pos/print/template-i-print";
import { Badge } from "@/components/ui/badge";
import moment from "moment-timezone";
import dynamic from "next/dynamic";

function PrintPageComponent() {
  const DUMMY_DATA = {
    orderInfo: {
      orderId: "ORDER12345",
      customerId: "CUSTOMER1",
      orderStatus: "PAID",
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
      invoiceNo: Number(
        `${moment().format("YYYYMMDD")}${Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, "0")}`
      ),
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
    },
    orderDetail: [
      {
        orderDetailId: "OD1",
        variantId: "V1",
        sku: "SKU1",
        barcode: "BARCODE1",
        modiferAmount: "0",
        title: "Sample Item 1",
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
        title: "Sample Item 2",
        qty: 1,
        price: "15.0",
        discountAmount: "0",
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

  return (
    <div className="flex-1 max-w-[1200px] w-full p-4 mx-auto">
      <h1 className="font-bold text-lg text-center">Print Page</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="max-w-[80mm] border mx-auto">
          <div className="p-2">
            <Badge>Default</Badge>
          </div>
          <DefaultPrint order={DUMMY_DATA} />
        </div>
        <div className="max-w-[80mm] mx-auto">
          <div className="border">
            <div className="p-2">
              <Badge>Template I</Badge>
            </div>
            <TemplateIPrint order={DUMMY_DATA} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component with SSR disabled
export default dynamic(() => Promise.resolve(PrintPageComponent), {
  ssr: false,
});
