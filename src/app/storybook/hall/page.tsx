"use client";

import { HallSeatForm } from "@/components/gui/cinema/hall-seat/hall-seat-form";

export default function HallStorybookPage() {
  const handleSave = (data: Record<string, unknown>) => {
    console.log("Hall Seat Data:", data);
  };

  return <HallSeatForm onSubmit={handleSave} loading={false} />;
}
