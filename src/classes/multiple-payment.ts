export class PaymentMethod {
  methodType: string; // e.g., 'cash', 'card', etc.
  currency: "USD" | "KHR"; // e.g., 'USD', 'EUR', 'JPY'
  received: number; // Amount in original currency
  exchangeRate: number; // To base currency (e.g., USD)
  converted: number; // Value in base currency
  used: number; // How much of converted is used toward order

  constructor(
    methodType: string,
    received: number,
    currency: "USD" | "KHR",
    exchangeRate: number
  ) {
    this.methodType = methodType;
    this.currency = currency;
    this.received = received;
    this.exchangeRate = exchangeRate;
    this.converted = this.received / this.exchangeRate;
    this.used = 0;
  }
}

export class MultiplePayment {
  totalAmount: number; // Total amount in base currency
  baseCurrency: string; // Base currency (e.g., 'USD')
  payments: PaymentMethod[]; // Array of payment methods

  constructor(totalAmount: number, baseCurrency = "USD") {
    this.totalAmount = totalAmount;
    this.baseCurrency = baseCurrency;
    this.payments = [];
  }

  addPayment(payment: PaymentMethod) {
    const remaining = this.getRemainingAmount();
    if (remaining <= 0) {
      console.log("Order is already fully paid.");
    }

    // Determine how much of this converted amount we need
    payment.used = Math.min(payment.converted, remaining);
    this.payments.push(payment);
  }

  getTotalConvertedUsed() {
    return this.payments.reduce((sum, p) => sum + p.used, 0);
  }

  getTotalConvertedReceived() {
    return this.payments.reduce((sum, p) => sum + p.converted, 0);
  }

  getRemainingAmount() {
    return Math.max(this.totalAmount - this.getTotalConvertedUsed(), 0);
  }

  getChange() {
    return Math.max(this.getTotalConvertedReceived() - this.totalAmount, 0);
  }

  isFullyPaid() {
    return this.getTotalConvertedUsed() >= this.totalAmount;
  }

  summary() {
    console.log(
      `Order Total: ${this.baseCurrency} ${(this.totalAmount || 0).toFixed(2)}`
    );
    console.log("Payments:");
    this.payments.forEach((p) => {
      console.log(
        `  - ${p.methodType} (${p.currency}): received ${p.received.toFixed(
          2
        )}, rate ${p.exchangeRate}, converted ${p.converted.toFixed(
          2
        )}, used ${p.used.toFixed(2)}`
      );
    });
    console.log(
      `Total received (converted): ${
        this.baseCurrency
      } ${this.getTotalConvertedReceived().toFixed(2)}`
    );
    console.log(
      `Change (converted): ${this.baseCurrency} ${this.getChange().toFixed(2)}`
    );
    console.log(this.isFullyPaid() ? "✅ Fully paid!" : "❌ Not fully paid.");

    return {
      totalOrder: Number(this.totalAmount || 0).toFixed(2),
      payments: this.payments.map((p) => {
        return {
          received: p.received.toFixed(2),
          rate: p.exchangeRate,
          converted: p.converted.toFixed(2),
          used: p.used.toFixed(2),
          methodType: p.methodType,
          currency: p.currency,
        };
      }),
      totalReceived: this.getTotalConvertedReceived().toFixed(2),
      change: this.getChange().toFixed(2),
      isFullyPaid: this.isFullyPaid(),
    };
  }
}
