import { useState, useEffect } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const SLIDES = [
  {
    overlay: "from-gold/20 via-amber-900/10 to-background/80",
    accent: "rgba(234,179,8,0.12)",
    label: "Rotate. Save. Prosper.",
  },
  {
    overlay: "from-emerald-900/25 via-teal-900/10 to-background/80",
    accent: "rgba(16,185,129,0.10)",
    label: "Trusted By Thousands.",
  },
  {
    overlay: "from-purple-900/25 via-indigo-900/10 to-background/80",
    accent: "rgba(139,92,246,0.10)",
    label: "Your Circle. Your Payout.",
  },
  {
    overlay: "from-rose-900/20 via-pink-900/10 to-background/80",
    accent: "rgba(244,63,94,0.08)",
    label: "Financial Discipline. Daily.",
  },
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 700);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${heroBg})`,
          opacity: fading ? 0.08 : 0.22,
          transform: fading ? "scale(1.04)" : "scale(1)",
        }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b ${slide.overlay} transition-all duration-700`}
        style={{ opacity: fading ? 0 : 1 }}
      />
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${slide.accent} 0%, transparent 65%)`,
          opacity: fading ? 0 : 1,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      {/* Slide indicator label */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.7s" }}
      >
        <p className="text-gold/70 text-[10px] tracking-[0.25em] uppercase font-semibold">{slide.label}</p>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === current ? "w-6 bg-gold" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
