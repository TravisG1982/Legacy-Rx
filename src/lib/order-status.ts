/** Public-facing wording for statuses stored on our orders. Unknown values stay private. */
export function orderStatusMessage(status: string): string {
  switch (status) {
    case "pending_payment":
      return "Checkout has not been completed.";
    case "paid":
      return "Payment received. Your order is awaiting the next update.";
    case "prescribed":
      return "A prescription has been recorded. Fulfillment is the next step.";
    case "order_processing":
      return "Your order is being prepared for shipment.";
    case "shipped":
      return "Your order has been marked as shipped. Tracking details are not available here yet.";
    case "delivered":
      return "Your order has been marked as delivered.";
    case "rejected":
      return "The clinical review did not approve this order. Ask support how to reach the clinical team for details without including medical information in a general message.";
    case "refunded":
      return "This order has been refunded.";
    case "abandoned":
      return "Checkout was not completed.";
    case "payment_failed":
      return "Payment was not completed. Please contact support for help with this order.";
    case "cancelled":
      return "This order was cancelled.";
    case "order_error":
      return "We need to check this order. Please contact support.";
    default:
      return "A current status is not available here. Please contact support for help.";
  }
}
