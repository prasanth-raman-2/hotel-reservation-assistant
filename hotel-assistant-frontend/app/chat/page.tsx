"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolUsed?: string | null;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Welcome! I'm your hotel assistant. I can help you with:\n\n- **Hotel information** - food, facilities, policies, hygiene, and more\n- **Reservations** - book, view, cancel, or list your bookings\n\nHow can I help you today?",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions list on mount
  useEffect(() => {
    fetchSessions();
    // Restore last session from localStorage
    const savedId = localStorage.getItem("hotel_session_id");
    if (savedId) {
      loadSession(savedId);
    }
  }, []);

  // Persist session_id to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("hotel_session_id", sessionId);
    }
  }, [sessionId]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // Server might not be running yet
    }
  };

  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/sessions/${id}`);
      if (!res.ok) {
        // Session not found, start fresh
        startNewChat();
        return;
      }
      const data = await res.json();
      setSessionId(id);

      if (data.messages && data.messages.length > 0) {
        const loaded: Message[] = data.messages.map(
          (m: { role: string; content: string; tool_used?: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            toolUsed: m.tool_used,
          })
        );
        setMessages(loaded);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch {
      startNewChat();
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    localStorage.removeItem("hotel_session_id");
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) {
        startNewChat();
      }
    } catch {
      // Ignore
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          session_id: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.session_id);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
        toolUsed: data.tool_used,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh sessions list
      fetchSessions();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting to the server. Please make sure the backend is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      search_hotel_info: "Hotel Info",
      create_reservation: "Booking Created",
      view_reservation: "Booking Viewed",
      list_my_reservations: "Bookings Listed",
      cancel_reservation: "Booking Cancelled",
      guardrail: "Guardrail",
    };
    return labels[tool] || tool;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-200 border-r bg-muted/30 flex flex-col overflow-hidden shrink-0`}
      >
        <div className="p-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Chat History</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                No conversations yet
              </p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm hover:bg-muted ${
                  sessionId === s.id ? "bg-muted font-medium" : ""
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.updated_at || s.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => deleteSession(s.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Toggle sidebar button */}
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {sessionId ? "Conversation" : "New Chat"}
          </span>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  {msg.toolUsed && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {toolLabel(msg.toolUsed)}
                    </Badge>
                  )}
                </Card>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="px-4 py-3 bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the hotel or manage your reservation..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mx-auto max-w-3xl text-xs text-muted-foreground mt-2 text-center">
            Answers are based on hotel documentation. For emergencies, contact
            the front desk directly.
          </p>
        </div>
      </div>
    </div>
  );
}
