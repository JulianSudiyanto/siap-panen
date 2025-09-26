"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TypingDots from "./components/TypingDots";
import { BotAvatar, UserAvatar } from "./components/Avatar";
import Welcome from "./components/Welcome";

type Msg = { role: "user" | "assistant"; content: string };

function formatIncoming(text: string): string {
  try {
    const obj = JSON.parse(text);
    if (obj && (obj.response || obj.message)) {
      text = String(obj.response ?? obj.message);
    }
  } catch (_) {}
  const lines = text.split("\n").map((l) => l.trimEnd());
  let inList = false;
  const htmlParts: string[] = [];
  const pushText = (t: string) =>
    htmlParts.push(
      t
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br/>")
    );
  for (const l of lines) {
    if (/^[-*]\s+/.test(l)) {
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      htmlParts.push("<li>" + l.replace(/^[-*]\s+/, "") + "</li>");
    } else {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      pushText(l + "\n");
    }
  }
  if (inList) htmlParts.push("</ul>");
  return htmlParts.join("");
}

export default function Home() {
  const [showChat, setShowChat] = useState(false);

const startChat = () => setShowChat(true);


  const welcome: Msg[] = useMemo(
    () => [
      {
        role: "assistant",
        content:
          "Halow! 👋, Diskusi apa kita hari ini ! 🌾✨",
      },
    ],
    []
  );

  const [messages, setMessages] = useState<Msg[]>(welcome);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
      setIsAtBottom(nearBottom);
      if (nearBottom) setUnread(0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setUnread((n) => n + 1);
    }
  }, [messages, loading, isAtBottom]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const newMessages: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      let assistantReply = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantReply += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const content = formatIncoming(assistantReply);
          if (prev[prev.length - 1]?.role === "assistant") {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content };
            return next;
          }
          return [...prev, { role: "assistant", content }];
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Terjadi error. Coba lagi ya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitQuick(text: string) {
  if (!text.trim() || loading) return;

  const newMessages: Msg[] = [...messages, { role: "user", content: text }];
  setMessages(newMessages);
  setInput("");
  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No stream");

    let assistantReply = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantReply += decoder.decode(value, { stream: true });

      setMessages((prev) => {
        const content = formatIncoming(assistantReply);
        if (prev[prev.length - 1]?.role === "assistant") {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content };
          return next;
        }
        return [...prev, { role: "assistant", content }];
      });
    }
  } catch {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "⚠️ Terjadi error. Coba lagi ya." },
    ]);
  } finally {
    setLoading(false);
  }
}

  function newChat() {
  setMessages(welcome);
  setInput("");
  setUnread(0);
  setShowChat(false); 
}
  if (!showChat) {
    return (
      <main className="min-h-dvh flex flex-col">
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card header-solid px-4 py-3 mt-2 header-sticky"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="size-10 rounded-full bg-white/90 grid place-items-center border border-white/30"
              animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span aria-hidden>🌱</span>
            </motion.div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">Siap Panen</h1>
              <p className="text-xs subtitle">
                Bantu petani atur waktu tanam & perawatan
              </p>
            </div>
            <span className="badge text-xs px-2 py-1 rounded-full">Group 3</span>
          </div>
        </motion.header>

        <Welcome
  onStart={() => setShowChat(true)}
  onQuick={(q) => {
    setShowChat(true);
    setTimeout(() => submitQuick(q), 0);
  }}
/>

      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col">
      {/* HEADER (ikon animasi) */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card header-solid px-4 py-3 mt-2 header-sticky"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="size-10 rounded-full bg-white/90 grid place-items-center border border-white/30"
            animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span aria-hidden>🌱</span>
          </motion.div>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Siap Panen</h1>
            <p className="text-xs subtitle">
              Bantu petani atur waktu tanam & perawatan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge text-xs px-2 py-1 rounded-full">Group 3</span>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={newChat}
              className="text-xs px-2.5 py-1 rounded-full bg-white text-emerald-800 border border-white/40 shadow-sm"
              title="Mulai percakapan baru"
            >
              New Chat
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* KARTU UTAMA DENGAN BORDER */}
      <section className="card mt-3 flex-1 flex flex-col">
        {/* area chat */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
          <div className="mt-1 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-start gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && <BotAvatar />}
                  <div
                    className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}
                    dangerouslySetInnerHTML={{ __html: m.content }}
                  />
                  {m.role === "user" && <UserAvatar />}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex justify-start items-start gap-2">
                <BotAvatar />
                <div className="bubble bubble-bot"><TypingDots /></div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {!isAtBottom && unread > 0 && (
            <button
              className="fab px-3 py-1.5 rounded-full text-sm bg-emerald-600 text-white shadow"
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              title="Lompat ke pesan terbaru"
            >
              {unread} new {unread > 1 ? "messages" : "message"}
            </button>
          )}
        </div>



        {/* input bar gelap */}
        <form onSubmit={sendMessage} className="input-bar">
          <div className="px-3 sm:px-4 pb-3">
            <div className="input-dark rounded-2xl p-2 flex items-end gap-2">
              <textarea
                className="flex-1 resize-none rounded-xl px-3 py-2 leading-5 outline-none focus:ring-2 focus:ring-emerald-300/60 max-h-36 min-h-10 placeholder:opacity-60"
                placeholder="Tanya sesuatu dong..!"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
              />
              <motion.button
                type="submit"
                disabled={loading || !input.trim()}
                whileTap={{ scale: 0.97 }}
                className="min-w-20 px-4 py-2 rounded-xl font-medium text-emerald-950 bg-emerald-300 hover:bg-emerald-200 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin size-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity=".35" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                    Memproses…
                  </span>
                ) : "Kirim"}
              </motion.button>
            </div>
            <p className="hint text-[11px] mt-1">
              Tips: ketik <code className="px-1 py-0.5 bg-white/10 rounded">/cuaca</code>,{" "}
              <code className="px-1 py-0.5 bg-white/10 rounded">/tanam</code>,{" "}
              <code className="px-1 py-0.5 bg-white/10 rounded">/hama</code>.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
