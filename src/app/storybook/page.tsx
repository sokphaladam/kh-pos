"use client";

import DashboardLayout from "@/components/layout";
import ProductStoryPage from "./product";
import { Suspense } from "react";

export default function Storybook() {
  return (
    <Suspense>
      <DashboardLayout>
        <ProductStoryPage />
      </DashboardLayout>
    </Suspense>
  );
}
