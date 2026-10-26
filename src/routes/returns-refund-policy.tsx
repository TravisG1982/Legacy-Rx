import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../components/LegalPage";

export const Route = createFileRoute("/returns-refund-policy")({
  head: () => ({
    meta: [
      { title: "Returns & Refund - LegacyRx" },
      { name: "description", content: "LegacyRx returns and refund policy for prescription and non-prescription products." },
      { property: "og:title", content: "Returns & Refund - LegacyRx" },
      { property: "og:description", content: "Information on returns, refunds, and lost packages at LegacyRx." },
    ],
  }),
  component: () => (
    <LegalPage title="Returns & Refund">
      <p>At LegacyRx we strive to provide the highest level of quality healthcare which includes frictionless access to medical providers and medications at prices that are affordable and accessible. We also make every effort to provide the highest level of patient care before and after the sale. If you have an issue with your order or your product, please reach out to our patient care team: +1 877 361 8113 or email us at <a href="mailto:billing@legacyrx.net">billing@legacyrx.net</a>.</p>

      <p>Below are our categories and how we can help you after the sale:</p>

      <h2>Prescription Medications</h2>
      <p>State and Federal regulations do not allow the return of prescription medications after being dispensed by the pharmacy. Once your method of payment has been charged and your package has been handed over to the carrier (USPS, FedEx, UPS), all sales are final. To request a change to an order before shipment, or if your prescription medication arrives damaged or is lost during transit, please contact our patient care team: +1 877 361 8113 or email us, <a href="mailto:billing@legacyrx.net">billing@legacyrx.net</a>.</p>

      <h2>Non-Prescription (Over The Counter) Products</h2>
      <p>LegacyRx may accept returns on unopened, non-prescription items up to 30 days after the sale. You will be responsible to pay the return shipping cost and we do not accept COD returns. If you need to return an item, please contact our patient care team: +1 877 361 8113 or email us, <a href="mailto:billing@legacyrx.net">billing@legacyrx.net</a>. Include your order number, reason for the return along with the product name. LegacyRx reserves the right to deny a return that does not arrive in the original condition it was shipped or if the products appear to be tampered with or opened. After we receive the returned product and it is approved by our LegacyRx team, your purchase price will be refunded to your original method of payment.</p>

      <h2>Address for Returns</h2>
      <p>163 Church Rd<br />
      Stockton GA 31649<br />
      United States</p>

      <h2>Lost Packages</h2>
      <p>In the rare case your package is lost in transit, LegacyRx will reship your prescription or non-prescription order. We will work with your carrier (USPS, FedEx, UPS) to locate your package first and have it redirected if needed. Sometimes weather may delay your package delivery time. Since we currently do not ship refrigerated products, your product will not be affected by increased transit time. If your package is lost in transit or does not arrive at the shipping address you provided, please contact our patient care team: +1 877 361 8113 or email us at <a href="mailto:billing@legacyrx.net">billing@legacyrx.net</a>.</p>
    </LegalPage>
  ),
});
