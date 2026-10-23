import hipaaLogo from "../assets/hipaa-compliant-transparent.webp";
import legitScriptLogo from "../assets/legitscript-certified.webp";

type Props = { variant?: "default" | "footer" };

export function TrustBadges({ variant = "default" }: Props) {
  const isFooter = variant === "footer";
  return (
    <div className="trust-row">
      <img
        loading="lazy"
        decoding="async"
        src={hipaaLogo}
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
          src={legitScriptLogo}
          alt="LegitScript Certified"
          style={{ height: 64, width: "auto", display: "block" }}
        />
      </a>
    </div>
  );
}
