import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getMyOrderStatus } from "@/lib/account.functions";
import { orderStatusMessage } from "@/lib/order-status";

const TOPICS = [
  {
    id: "categories",
    label: "What product categories can I browse?",
    answer:
      "Browse the categories below to learn what LegacyRX offers. A category is not a personal treatment recommendation. A licensed clinician makes any treatment decision.",
    links: [
      ["Medications", "/medications"],
      ["Men's health", "/mens-health"],
      ["Women's HRT", "/womens-hrt"],
      ["Anti-aging", "/anti-aging"],
      ["Sexual health", "/sexual-health"],
    ],
  },
  {
    id: "products",
    label: "Where can I read about products?",
    answer:
      "Product pages explain the available options and general program information. They cannot tell you which medication is appropriate for you. Your clinician reviews medical questions during the consultation.",
    links: [["Browse products", "/medications"]],
  },
  {
    id: "prices",
    label: "Where can I see prices?",
    answer:
      "Check the product pages for current advertised prices and the checkout summary for your total before payment. The final amount can depend on the product and plan you choose.",
    links: [["Browse products", "/medications"]],
  },
  {
    id: "registration",
    label: "How do I create an account?",
    answer:
      "Open the sign-in page and choose the sign-up option. Confirm your email using the link sent to you. If you previously ordered as a guest, use the same email to view that order after verification.",
    links: [["Sign in or create an account", "/auth"]],
  },
  {
    id: "assessment",
    label: "How do I start the assessment?",
    answer:
      "Start from the assessment and complete its required questions in order. A clinician, not this guide, decides whether treatment is appropriate.",
    links: [["Get started", "/qualify"]],
  },
  {
    id: "checkout",
    label: "How do I complete an order?",
    answer:
      "Complete the assessment, review the product and price, then follow the secure checkout instructions. Your order is subject to clinical review. If a page does not load, reopen the flow from Get started or contact support without sharing medical details.",
    links: [
      ["Get started", "/qualify"],
      ["Contact support", "/contact-us"],
    ],
  },
  {
    id: "payment",
    label: "Where do I pay or get payment help?",
    answer:
      "The checkout shows the payment step and final total before you submit. If payment fails or you need billing help, contact support. Do not include card numbers or medical details in your message.",
    links: [["Contact support", "/contact-us"]],
  },
  {
    id: "consultation",
    label: "What happens during the consultation?",
    answer:
      "The secure intake collects information for a licensed clinician to review. The clinical team may request more information or a consultation. Approval and timing are determined through that clinical process; this guide cannot assess eligibility.",
  },
  {
    id: "support",
    label: "How do I contact general support?",
    answer:
      "Use the contact page for account, order, payment, and other general questions. Please do not include symptoms, medical history, or other medical details.",
    links: [["Contact support", "/contact-us"]],
  },
  {
    id: "medical",
    label: "Where should I ask a medical question?",
    answer:
      "Medical questions belong with the clinical partner through an approved secure channel. If you have not been given one, ask general support how to reach the clinical team without including symptoms or medical history in that message.",
    links: [["General support", "/contact-us"]],
  },
  {
    id: "status",
    label: "Where is my order or delivery?",
    answer:
      "Sign in and confirm your email to see orders linked to your account. Choose an order there for its current recorded status. Tracking details are not available in this account yet.",
    links: [["My account", "/account"]],
  },
] as const;

type TopicId = (typeof TOPICS)[number]["id"];

/** Fixed topics keep patient-entered text out of third-party AI services. */
export function OrderHelp({ orderNumbers }: { orderNumbers?: readonly string[] }) {
  const loadStatus = useServerFn(getMyOrderStatus);
  const [open, setOpen] = useState(false);
  const [topicId, setTopicId] = useState<TopicId>("categories");
  const [orderNumber, setOrderNumber] = useState("");
  const [statusAnswer, setStatusAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const topic = TOPICS.find((item) => item.id === topicId) ?? TOPICS[0];

  async function showStatus() {
    if (!orderNumbers?.includes(orderNumber) || busy) return;
    setBusy(true);
    setError(null);
    setStatusAnswer(null);
    try {
      const result = await loadStatus({ data: { orderNumber } });
      setStatusAnswer(`Order #${result.orderNumber}: ${orderStatusMessage(result.status)}`);
    } catch {
      setError("We could not verify this order right now. Please try again or contact support.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="order-help">
      {!open ? (
        <button type="button" className="order-help-toggle" onClick={() => setOpen(true)}>
          Need help with products or your order?
        </button>
      ) : (
        <div className="order-help-box">
          <div className="order-help-head">
            <strong>How can we help?</strong>
            <button
              type="button"
              className="order-help-close"
              onClick={() => setOpen(false)}
              aria-label="Close help"
            >
              ×
            </button>
          </div>
          <label className="order-help-label">
            Choose a question
            <select
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value as TopicId);
                setStatusAnswer(null);
                setError(null);
              }}
            >
              {TOPICS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="order-help-answer" aria-live="polite">
            <p>{topic.answer}</p>
            {"links" in topic && (
              <div className="order-help-links">
                {topic.links.map(([label, to]) => (
                  <Link key={to} to={to}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {topicId === "status" &&
            orderNumbers &&
            (orderNumbers.length ? (
              <div className="order-help-status">
                <label className="order-help-label">
                  Your order
                  <select
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value);
                      setStatusAnswer(null);
                    }}
                  >
                    <option value="">Select an order</option>
                    {orderNumbers.map((number) => (
                      <option key={number} value={number}>
                        #{number}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!orderNumber || busy}
                  onClick={() => void showStatus()}
                >
                  {busy ? "Checking…" : "Check order status"}
                </button>
                {statusAnswer && (
                  <p className="order-help-answer" aria-live="polite">
                    {statusAnswer}
                  </p>
                )}
                {error && (
                  <p className="order-help-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <p className="order-help-note">
                No completed orders are linked to this verified account yet.
              </p>
            ))}
          <p className="order-help-note">
            This guide answers general questions only. A licensed clinician handles medical
            decisions. Do not send medical details through general support.
          </p>
        </div>
      )}
    </div>
  );
}
