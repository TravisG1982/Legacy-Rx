import { useState } from "react";

export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map((f, i) => (
        <div key={i} className={`faq-item ${open === i ? "open" : ""}`}>
          <button type="button" className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
            {f[0]}
            <span className="pm">+</span>
          </button>
          <div className="faq-a">
            <div className="faq-a-inner" style={{ whiteSpace: "pre-line" }}>{f[1]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
