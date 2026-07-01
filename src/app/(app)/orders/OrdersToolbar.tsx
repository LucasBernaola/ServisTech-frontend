"use client";

import React from "react";
import { Plus } from "lucide-react";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";

export function OrdersToolbar({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary w-full gap-2 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Nueva orden
      </button>

      <CreateOrderModal
        apiBaseUrl={apiBaseUrl}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
