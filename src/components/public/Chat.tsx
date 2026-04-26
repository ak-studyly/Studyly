"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Reply, X, Trash2, CornerDownRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import { cn, formatPostTime } from "@/lib/utils";
import type { Message } from "@/types";

type Props = {
  collegeId: string;
  branch: string;
  year: number;
  section: string;
};

const NAME_KEY = "studyly_chat_name";
const TOKENS_KEY = "studyly_msg_tokens";

function getStoredTokens(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}"); }
  catch { return {}; }
}

function storeToken(messageId: string, token: string) {
  const tokens = getStoredTokens();
  tokens[messageId] = token;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export default function Chat({ collegeId, branch, year, section }: Props) {
  const supabase = createClient();
  const { profile } = useAuth();
  const isCR = profile?.role === "cr" &&
    profile.college_id === collegeId &&
    profile.branch === branch &&
    profile.year === year &&
    profile.section === section;

  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load stored name and tokens
  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    if (profile?.full_name) {
      setSenderName(profile.full_name);
    } else if (stored) {
      setSenderName(stored);
    }
    setTokens(getStoredTokens());
  }, [profile]);

  // Fetch initial messages
  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .eq("college_id", collegeId)
      .eq("branch", branch)
      .eq("year", year)
      .eq("section", section)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }, [collegeId, branch, year, section]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${collegeId}:${branch}:${year}:${section}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `college_id=eq.${collegeId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => {
              if (prev.find((m) => m.id === (payload.new as Message).id)) return prev;
              return [...prev, payload.new as Message];
            });
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
          if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => m.id === (payload.new as Message).id ? payload.new as Message : m)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [collegeId, branch, year, section]);

  function handleNameSave() {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    setSenderName(name);
    localStorage.setItem(NAME_KEY, name);
    setShowNamePrompt(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSend() {
    if (!body.trim()) return;

    // Ask for name if not set
    if (!senderName) {
      setShowNamePrompt(true);
      return;
    }

    setSending(true);
    const token = crypto.randomUUID();
    const displayName = profile?.full_name ?? senderName;

    const payload: Record<string, unknown> = {
      college_id: collegeId,
      branch,
      year,
      section,
      sender_name: displayName,
      sender_id: profile?.id ?? null,
      body: body.trim(),
    };

    if (replyTo) {
      payload.reply_to_id = replyTo.id;
      payload.reply_preview = replyTo.body.slice(0, 80);
      payload.reply_sender = replyTo.sender_name;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      // Store token for guest self-delete
      await supabase.from("message_tokens").insert({ message_id: data.id, token });
      storeToken(data.id, token);
      setTokens(getStoredTokens());
    }

    setSending(false);
    setBody("");
    setReplyTo(null);
  }

  async function handleDelete(message: Message) {
    if (isCR) {
      // CR soft-delete directly
      await supabase
        .from("messages")
        .update({ deleted: true, body: "[deleted]" })
        .eq("id", message.id);
    } else {
      // Guest delete via token RPC
      const token = tokens[message.id];
      if (!token) return;
      await supabase.rpc("delete_message_with_token", {
        p_message_id: message.id,
        p_token: token,
      });
    }
  }

  function canDelete(message: Message) {
    if (isCR) return true;
    return !!tokens[message.id];
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Group messages by date
  const grouped = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const date = new Date(msg.created_at).toDateString();
    const last = acc[acc.length - 1];
    if (last?.date === date) { last.msgs.push(msg); return acc; }
    return [...acc, { date, msgs: [msg] }];
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">

      {/* Name prompt modal */}
      {showNamePrompt && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl">
          <div className="card p-5 w-72 flex flex-col gap-3">
            <h3 className="font-serif text-base font-semibold text-gray-900 dark:text-gray-100">
              what's your name?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This is how you'll appear in the chat. You can change it anytime.
            </p>
            <input
              className="input"
              placeholder="e.g. Riya"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(); }}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNamePrompt(false)} className="btn-secondary flex-1 text-sm">cancel</button>
              <button onClick={handleNameSave} disabled={!nameInput.trim()} className="btn-primary flex-1 text-sm">join chat</button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-600 text-center">
              No messages yet. Be the first to say something!
            </p>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-black/8 dark:bg-white/8" />
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {new Date(date).toDateString() === new Date().toDateString()
                  ? "today"
                  : new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              <div className="flex-1 h-px bg-black/8 dark:bg-white/8" />
            </div>

            {msgs.map((msg, i) => {
              const prevMsg = msgs[i - 1];
              const isSameAuthor = prevMsg?.sender_name === msg.sender_name && !prevMsg?.deleted;
              const isOwn = !!tokens[msg.id] || (profile?.id && msg.sender_id === profile.id);

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={!!isOwn}
                  isSameAuthor={isSameAuthor}
                  canDelete={canDelete(msg)}
                  onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                  onDelete={() => handleDelete(msg)}
                />
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mx-4 mb-1 flex items-center gap-2 bg-brand-light dark:bg-green-950 border border-brand-mid dark:border-brand rounded-lg px-3 py-2">
          <CornerDownRight size={13} className="text-brand dark:text-brand-mid flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-brand dark:text-brand-mid">{replyTo.sender_name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{replyTo.body}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-end gap-2 card px-3 py-2">
          {/* Name badge */}
          {senderName && (
            <button
              onClick={() => { setNameInput(senderName); setShowNamePrompt(true); }}
              className="text-xs text-brand dark:text-brand-mid font-medium whitespace-nowrap pb-1.5 hover:underline flex-shrink-0"
              title="change name"
            >
              {senderName}
            </button>
          )}
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none focus:outline-none min-h-[36px] max-h-32 py-1.5"
            placeholder={senderName ? "type a message…" : "type a message…"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className={cn(
              "p-1.5 rounded-lg transition-colors flex-shrink-0 mb-0.5",
              body.trim()
                ? "text-brand dark:text-brand-mid hover:bg-brand-light dark:hover:bg-green-950"
                : "text-gray-300 dark:text-gray-700"
            )}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 text-center">
          {senderName
            ? <>chatting as <button onClick={() => { setNameInput(senderName); setShowNamePrompt(true); }} className="underline hover:text-gray-600 dark:hover:text-gray-400">{senderName}</button> · Enter to send</>
            : "press send to set your name"
          }
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message: m, isOwn, isSameAuthor, canDelete, onReply, onDelete,
}: {
  message: Message;
  isOwn: boolean;
  isSameAuthor: boolean;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  if (m.deleted) {
    return (
      <div className="flex items-center gap-2 py-0.5 px-1 my-0.5">
        <span className="text-xs text-gray-300 dark:text-gray-700 italic">[message deleted]</span>
      </div>
    );
  }

  return (
    <div
      className={cn("group flex gap-2 py-0.5", isOwn ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar — only show when author changes */}
      <div className="w-7 flex-shrink-0 flex items-end">
        {!isSameAuthor && (
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
            isOwn
              ? "bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400"
          )}>
            {m.sender_name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className={cn("flex flex-col max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        {/* Name — only show when author changes */}
        {!isSameAuthor && (
          <span className="text-xs text-gray-400 dark:text-gray-600 mb-1 px-1">
            {m.sender_name}
          </span>
        )}

        {/* Reply preview */}
        {m.reply_to_id && m.reply_preview && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-t-lg mb-0.5 max-w-full",
            isOwn
              ? "bg-brand-light dark:bg-green-950 text-brand-dark dark:text-green-300"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
          )}>
            <CornerDownRight size={11} className="flex-shrink-0" />
            <span className="font-medium">{m.reply_sender}</span>
            <span className="truncate">{m.reply_preview}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          "px-3 py-2 rounded-2xl text-sm leading-relaxed",
          isOwn
            ? "bg-brand dark:bg-brand text-white rounded-br-sm"
            : "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border border-black/8 dark:border-white/8 rounded-bl-sm"
        )}>
          {m.body}
        </div>

        <span className="text-xs text-gray-300 dark:text-gray-700 mt-0.5 px-1">
          {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Action buttons — show on hover */}
      <div className={cn(
        "flex items-center gap-1 self-center transition-opacity",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        <button
          onClick={onReply}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          title="reply"
        >
          <Reply size={14} />
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            title="delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
