"use client";

import React from "react";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";

export function OrdersToolbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-end gap-2">
        
        <button
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto cursor-pointer rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15 transition"
        >
          + Nueva orden
        </button>

      </div>

      <CreateOrderModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}