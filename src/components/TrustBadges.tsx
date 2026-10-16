import hipaaLogo from "../assets/hipaa-compliant-transparent.webp.asset.json";
import legitScriptLogo from "../assets/legitscript-certified.webp.asset.json";

type Props = { variant?: "default" | "footer" };

export function TrustBadges({ variant = "default" }: Props) {
  const isFooter = variant === "footer";
  return (
    <div className="trust-row">
      <img
        loading="lazy"
        decoding="async"
        src={hipaaLogo.url}
        alt="HIPAA Compliant"
        style={{
          height: 64,
          width: "auto",
          display: "block",
          filter: isFooter ? "brightness(0) invert(1)" : undefined,
        }}
      />
      <a
        href="https://www.legitscript.com/websites/?checker_keywords=legacyrx.net"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LegitScript Certified - verify"
      >
        <img
          loading="lazy"
          decoding="async"
          src={legitScriptLogo.url}
          alt="LegitScript Certified"
          style={{ height: 64, width: "auto", display: "block" }}
        />
      </a>
    </div>
  );
}
