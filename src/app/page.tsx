"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll setiap ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: input }];
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
      if (!reader) return;

      let assistantReply = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantReply += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          // update pesan terakhir kalau sudah ada assistant
          if (prev[prev.length - 1]?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { role: "assistant", content: assistantReply },
            ];
          }
          // kalau belum ada, tambahin pesan assistant baru
          return [...prev, { role: "assistant", content: assistantReply }];
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Terjadi error. Coba lagi ya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto flex flex-col h-screen">
      <h1 className="text-2xl font-bold mb-4">🌱 Siap Panen Chatbot</h1>

      {/* Chat box */}
      <div className="flex-1 border p-4 rounded mb-4 overflow-y-auto bg-white">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-blue-100 text-blue-800 self-end ml-auto"
                : "bg-green-100 text-green-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya sesuatu..."
          disabled={loading}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          type="submit"
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Kirim"}
        </button>
      </form>
    </main>
  );
}
