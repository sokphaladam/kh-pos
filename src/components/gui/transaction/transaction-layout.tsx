"use client";
import React from "react";
import { TransactionTab } from "./transaction-tab";

export function TransactionLayout() {
  return (
    <div className="w-full flex flex-col gap-4 relative">
      <div className="w-full">
        <TransactionTab />
      </div>
    </div>
  );
}
