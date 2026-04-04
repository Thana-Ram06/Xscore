import { useEffect, useState } from "react";

export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 1000;
    let incrementTime = (totalDuration / end) * 2;
    if (incrementTime < 10) incrementTime = 10;
    if (incrementTime > 50) incrementTime = 50;

    let current = 0;
    const timer = setInterval(() => {
      const step = Math.ceil(end / (totalDuration / incrementTime));
      current += step;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className={className}>{count}</span>;
}
