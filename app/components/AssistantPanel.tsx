"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, LoaderCircle, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import type { House, Profile, Score } from "../../lib/types";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ScoredHouse = { house: House; score: Score };
type AssistantPanelProps = {
  profile: Profile;
  houses: ScoredHouse[];
  onClose: () => void;
};

const starters = [
  "Compare my tracked homes and tell me which one deserves the next tour.",
  "Find the biggest red flags and missing facts across these homes.",
  "Create a focused checklist for my next in-person tour.",
  "Review affordability using my profile and explain the assumptions.",
];

export function AssistantPanel({ profile, houses, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((response) => response.json())
      .then((result) => setConfigured(Boolean(result.configured)))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(message: string) {
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    const nextMessages = [...messages, { role: "user", content: cleanMessage } as ChatMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          profile,
          houses: houses.map(({ house, score }) => ({
            address: house.address,
            source: house.source,
            price: house.price,
            beds: house.beds,
            baths: house.baths,
            sqft: house.sqft,
            year: house.year,
            commuteMinutes: house.commute,
            status: house.status,
            favorite: house.favorite,
            visitedAt: house.visitedAt,
            notes: house.notes,
            visitCriteria: house.criteria,
            score,
          })),
          history: messages.slice(-8),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "HouseRank AI could not answer.");
      setConfigured(true);
      setMessages([...nextMessages, { role: "assistant", content: result.answer }]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "HouseRank AI could not answer.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", bounce: 0.08, duration: 0.5 }}
      className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-full min-w-0 flex-col overflow-x-hidden border-l border-zinc-200 bg-white shadow-2xl sm:max-w-xl"
      aria-label="HouseRank AI assistant"
    >
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Ask HouseRank AI</h2>
            <p className="text-xs text-zinc-500">
              {configured === null ? "Checking connection..." : configured ? "OpenAI connected" : "API key not configured"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Close AI assistant">
          <X size={20} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-900"><Bot size={16} /> Your search, in context</div>
              <p className="text-sm leading-relaxed text-zinc-600">I can reason across your buyer profile, scores, visit answers, and notes. I will identify missing evidence instead of inventing property facts.</p>
            </div>
            <div className="grid gap-2">
              {starters.map((starter) => (
                <button key={starter} type="button" onClick={() => void ask(starter)} disabled={loading || configured === false} className="rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm leading-snug text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50">
                  {starter}
                </button>
              ))}
            </div>
            {configured === false ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">The assistant is built, but the server secret still needs to be connected before it can answer.</p> : null}
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-white" : "mr-5 whitespace-pre-wrap rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800"}>
              {message.content}
            </div>
          ))
        )}
        {loading ? <div className="mr-5 flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500"><LoaderCircle className="animate-spin" size={16} /> Thinking through your homes...</div> : null}
      </div>

      <form onSubmit={submit} className="border-t border-zinc-100 p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/5">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(input); } }} rows={2} maxLength={2000} placeholder="Ask about affordability, tradeoffs, tours, or red flags..." className="min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm outline-none" disabled={loading || configured === false} />
          <button type="submit" disabled={!input.trim() || loading || configured === false} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Send question">
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-400">Planning guidance only. Verify listing, school, safety, and lending facts independently.</p>
      </form>
    </motion.aside>
  );
}
