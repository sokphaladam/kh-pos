import React from "react";
import { VoidOrderData } from "../types";
import { AlertTriangle, FileX, DollarSign, Package } from "lucide-react";
import { useCurrencyFormat } from "@/hooks/use-currency-format";

interface VoidOrderSummaryProps {
  data: VoidOrderData[];
}

export function VoidOrderSummary({ data }: VoidOrderSummaryProps) {
  const { formatForDisplay } = useCurrencyFormat();
  const voidedOrders = data.filter((item) => item.status === "VOIDED");
  const abnormalOrders = data.filter((item) => item.status === "ABNORMAL");

  const totalPriceDiscrepancy = data.reduce((sum, item) => {
    const amountFromPrintLog =
      item.priceFromPrintLog * (item.qtyFromPrintLog || 0);
    const amountActual = item.actualPrice * item.actualQty;
    return sum + Math.abs(amountFromPrintLog - amountActual);
  }, 0);

  const summaryCards = [
    {
      title: "Total Issues",
      value: data.length,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/15",
      description: "Total discrepancies found",
    },
    {
      title: "Voided Orders",
      value: new Set(voidedOrders.map((item) => item.orderId).filter(Boolean))
        .size,
      icon: FileX,
      color: "text-destructive",
      bgColor: "bg-destructive/15",
      description: "Completely voided orders",
    },
    {
      title: "Abnormal Orders",
      value: abnormalOrders.length,
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/15",
      description: "Orders with discrepancies",
    },
    {
      title: "Price Discrepancy",
      value: `${formatForDisplay(totalPriceDiscrepancy)}`,
      icon: DollarSign,
      color: "text-warning",
      bgColor: "bg-warning/15",
      description: "Total price difference",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards.map((card, index) => (
        <div
          key={index}
          className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className={`p-2 ${card.bgColor} rounded-lg`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
