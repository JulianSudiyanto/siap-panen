"use client";

import { motion } from "framer-motion";

export default function Welcome({
  onStart,
  onQuick,
}: {
  onStart: () => void;
  onQuick: (text: string) => void;
}) {
  const chips = [
    "Waktu tanam padi terbaik",
    "Cek curah hujan minggu ini",
    "Atur jadwal penyiraman",
    "Solusi hama wereng",
  ];

  return (
  <section className="min-h-dvh flex flex-col items-center justify-center px-4">
    <div className="welcome-glass w-full max-w-[560px] px-6 py-7 text-center">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="welcome-title text-3xl font-extrabold tracking-tight">
          Hi, selamat datang 👋
        </h1>
        <p className="welcome-subtext mt-2 text-sm">
          Aku <b>Siap Panen</b>—pendamping tanimu. Tanya soal waktu tanam, cuaca,
          penyiraman, atau hama. 🌾
        </p>
      </motion.div>

      <motion.div className="mt-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="px-5 py-2 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow"
        >
          Mulai Chat
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <div className="flex gap-2 flex-wrap items-center justify-center">
          {["Waktu tanam padi terbaik","Cek curah hujan minggu ini","Atur jadwal penyiraman","Solusi hama wereng"].map((c) => (
            <button
              key={c}
              onClick={() => { onQuick(c); onStart(); }}
              className="px-3 py-1.5 rounded-full text-xs bg-white/70 hover:bg-white/90 border border-white/60 text-emerald-900"
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);
}
