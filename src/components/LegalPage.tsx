import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="lx">
      <div className="container-lx">
        <div className="legal">
          <h1>{title}</h1>
          <p className="updated">Last updated: June 4, 2026</p>
          {children}
          <div className="callout">
            <strong>Contact.</strong> LegacyRx · legacyrx.net · Email:{" "}
            <a href="mailto:support@legacyrx.net">support@legacyrx.net</a> · Phone: +1 877 361 8113 · 163 Church Rd,
            Stockton GA 31649, United States
          </div>
        </div>
      </div>
    </section>
  );
}
