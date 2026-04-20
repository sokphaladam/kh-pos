"use client";
import { TransactionLayout } from "@/components/gui/transaction/transaction-layout";
import { withLayoutPermission } from "@/hoc/with-layout-permission";

export default withLayoutPermission(TransactionLayout, "transaction");
