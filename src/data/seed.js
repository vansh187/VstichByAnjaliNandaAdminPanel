// Matches the VStitch_Orders.OrderStatus CHECK constraint (see ADMIN_API_CONTRACT.md).
export const STATUS_FLOW = [
  "payment_pending",
  "payment_failed",
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "delivery_failed",
];

export const STATUS_LABELS = {
  payment_pending: "Payment Pending",
  payment_failed: "Payment Failed",
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  delivery_failed: "Delivery Failed",
};

// Single source of truth for "does this order count as revenue" — an order
// counts once it's actually placed and isn't cancelled/failed. Payments,
// Dashboard, and the mock adapter all derive their totals from this set so
// they can't silently disagree when a status is added or reclassified.
export const REVENUE_COUNTING_STATUSES = new Set(STATUS_FLOW.filter(
  (s) => !["payment_pending", "payment_failed", "cancelled"].includes(s)
));

// Orders still awaiting admin action (not yet shipped, not terminal).
export const PENDING_ACTION_STATUSES = new Set(["placed", "confirmed", "processing"]);

// COD cash is collected at the delivery step, so a delivered COD order's
// cash is no longer "pending collection" — only orders that count as
// revenue but haven't reached delivered yet are still outstanding.
export const COD_PENDING_STATUSES = new Set(
  [...REVENUE_COUNTING_STATUSES].filter((s) => s !== "delivered")
);

export const STATUS_STYLES = {
  payment_pending: "bg-[#3A2E1F] text-[#D9A441] border-[#5A4726]",
  payment_failed: "bg-[#3A1F1F] text-[#E0716A] border-[#5E2A2A]",
  placed: "bg-[#3A2E1F] text-[#D9A441] border-[#5A4726]",
  confirmed: "bg-[#1F2E3A] text-[#5FA8D3] border-[#2A4A5E]",
  processing: "bg-[#2A2440] text-[#9B8AD1] border-[#40376B]",
  shipped: "bg-[#1F3A34] text-[#4FC3A1] border-[#2A5A4E]",
  out_for_delivery: "bg-[#1F3A34] text-[#4FC3A1] border-[#2A5A4E]",
  delivered: "bg-[#1F3A24] text-[#6FCF7A] border-[#2A5E36]",
  cancelled: "bg-[#3A1F1F] text-[#E0716A] border-[#5E2A2A]",
  delivery_failed: "bg-[#3A2A1F] text-[#D19A6A] border-[#5E3E2A]",
};
