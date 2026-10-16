import { useEffect, useState } from "react";

export function Countdown({
  className = "countdown",
  seconds = 15 * 60,
}: {
  className?: string;
  seconds?: number;
}) {
  const [sec, setSec] = useState(seconds);
  useEffect(() => {
    setSec(seconds);
    const id = setInterval(() => setSec((s) => (s <= 0 ? seconds : s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return <span className={className}>{mm}:{ss}</span>;
}
