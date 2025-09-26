"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setMounted(true);

    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });

    update(); 
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      {/* gradient utama */}
      <div aria-hidden className="bg-animated" />

      {/* partikel hanya dirender setelah mounted */}
      {mounted && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[-1]"
          style={{ opacity: 0.5 }}
        >
          {[...Array(10)].map((_, i) => {
            const left = Math.random() * size.w;
            const top = Math.random() * size.h;
            return (
              <motion.span
                key={i}
                className="absolute size-2 rounded-full"
                style={{ left, top, background: "rgba(34,197,94,.35)" }}
                initial={{ opacity: 0.4, scale: 0.6 }}
                animate={{ y: ["0%", "-10%", "0%"], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 8 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

