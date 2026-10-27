import { useId, useState } from "react";

export function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  return (
    <div>
      {items.map((f, i) => (
        <div key={i} className={`faq-item ${open === i ? "open" : ""}`}>
          <button
            type="button"
            id={`${id}-question-${i}`}
            className="faq-q"
            aria-expanded={open === i}
            aria-controls={`${id}-answer-${i}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {f[0]}
            <span className="pm" aria-hidden="true">+</span>
          </button>
          <div
            id={`${id}-answer-${i}`}
            className="faq-a"
            role="region"
            aria-labelledby={`${id}-question-${i}`}
            hidden={open !== i}
          >
            <div className="faq-a-inner" style={{ whiteSpace: "pre-line" }}>{f[1]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
