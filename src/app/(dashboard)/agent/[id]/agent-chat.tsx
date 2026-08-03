"use client";

import { useEffect, useRef, useState } from "react";

type Turn = {
  role: "user" | "assistant";
  text: string;
  tools?: string[];
};

const TOOL_LABEL: Record<string, string> = {
  query_table: "Reading school data",
  count_rows: "Counting records",
  propose_action: "Drafting a proposal",
};

export function AgentChat({
  conversationId,
  initialTurns,
  specialistLabel,
}: {
  conversationId: string;
  initialTurns: Turn[];
  specialistLabel: string;
}) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, activeTool]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    setError(null);
    setBusy(true);
    setTurns((t) => [...t, { role: "user", text: message }]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, message }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        setError(detail?.error ?? `Request failed (${res.status}).`);
        setBusy(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let started = false;
      const usedTools: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const eventLine = chunk.match(/^event: (.+)$/m);
          const dataLine = chunk.match(/^data: (.+)$/m);
          if (!eventLine || !dataLine) continue;

          const event = eventLine[1];
          const data = JSON.parse(dataLine[1]);

          if (event === "text") {
            assistantText += data.delta;
            setActiveTool(null);
            setTurns((t) => {
              const next = [...t];
              if (!started) {
                next.push({ role: "assistant", text: assistantText, tools: usedTools });
                started = true;
              } else {
                next[next.length - 1] = {
                  role: "assistant",
                  text: assistantText,
                  tools: usedTools,
                };
              }
              return next;
            });
          } else if (event === "tool") {
            usedTools.push(data.name);
            setActiveTool(TOOL_LABEL[data.name] ?? data.name);
          } else if (event === "error") {
            setError(data.message);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setBusy(false);
      setActiveTool(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-slate-200 bg-white p-5">
        {turns.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              {specialistLabel} specialist
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ask about your classes, pacing, assessment data, or lesson design.
            </p>
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={turn.role === "user" ? "flex justify-end" : "flex"}
          >
            <div
              className={
                turn.role === "user"
                  ? "max-w-[80%] rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white"
                  : "max-w-[85%] rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-800"
              }
            >
              {turn.role === "assistant" && turn.tools && turn.tools.length > 0 && (
                <p className="mb-2 text-xs text-slate-500">
                  Consulted {turn.tools.length} data source
                  {turn.tools.length === 1 ? "" : "s"}
                </p>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">
                {turn.text}
              </div>
            </div>
          </div>
        ))}

        {activeTool && (
          <div className="flex">
            <div className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
              <span className="inline-block animate-pulse">{activeTool}…</span>
            </div>
          </div>
        )}

        {busy && !activeTool && turns[turns.length - 1]?.role === "user" && (
          <div className="flex">
            <div className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Ask about your classes, pacing, or lesson design…"
          className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="h-fit self-end rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
