export interface MetricsItem {
  date: string;
  orderDetailId: string;
  sale: number;
  cost: number;
  profit: number;
}

export interface MetricsSummary {
  sale: number;
  cost: number;
  profit: number;
}

export interface MetricsComparison extends MetricsSummary {
  saleDiff: number;
  salePercentChange: number;
  saleDirection: string;
  costDiff: number;
  costPercentChange: number;
  costDirection: string;
  profitDiff: number;
  profitPercentChange: number;
  profitDirection: string;
  profitMargin: number;
  profitMarginDiff: number;
  profitMarginDirection: string;
}
