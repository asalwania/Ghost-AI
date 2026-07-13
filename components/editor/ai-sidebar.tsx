"use client";

import { useEffect, useRef, useState } from "react";
import {
  BotMessageSquare,
  Download,
  FileText,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

function EmptyArchitectState({
  onSelectPrompt,
}: {
  onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-subtle text-ai-text">
        <BotMessageSquare className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-copy-primary">
          Start shaping the workspace with AI.
        </p>
        <p className="text-sm leading-5 text-copy-muted">
          Ask Ghost AI to draft, refine, or explain a system design.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-surface-border bg-subtle px-3 py-1.5 text-xs font-medium text-ai-text transition-colors hover:border-ai/40 hover:bg-ai/10"
            onClick={() => onSelectPrompt(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-5",
          isUser
            ? "border-2 border-brand/50 bg-brand-dim text-copy-primary"
            : "border border-surface-border bg-elevated text-ai-text"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function AiArchitectTab() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextMessageId = useRef(1);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [draft]);

  const selectStarterPrompt = (prompt: string) => {
    setDraft(prompt);
    textareaRef.current?.focus();
  };

  const submitDraft = () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextMessageId.current,
      role: "user",
      content: trimmedDraft,
    };
    const assistantMessage: ChatMessage = {
      id: nextMessageId.current + 1,
      role: "assistant",
      content:
        "I can use this prompt once generation is connected. For now, the workspace chat shell is ready.",
    };

    nextMessageId.current += 2;
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);
    setDraft("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-h-[19rem] flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <EmptyArchitectState onSelectPrompt={selectStarterPrompt} />
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-surface-border p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-surface-border bg-surface p-2">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitDraft();
              }
            }}
            placeholder="Ask Ghost AI about this architecture..."
            className="max-h-40 min-h-[72px] resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 bg-ai text-ai-foreground hover:bg-ai/90"
            onClick={submitDraft}
            disabled={draft.trim().length === 0}
            aria-label="Send AI prompt"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <Button
        type="button"
        className="w-full bg-ai text-ai-foreground hover:bg-ai/90"
      >
        <Sparkles className="h-4 w-4" />
        Generate Spec
      </Button>

      <article className="rounded-2xl border border-surface-border bg-elevated p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-ai-text">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-copy-primary">
              Architecture Specification
            </h3>
            <p className="mt-1 text-sm leading-5 text-copy-muted">
              Draft spec preview for the current canvas, including services,
              data flow, and operational notes.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-surface-border bg-subtle text-copy-muted"
          disabled
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </article>
    </div>
  );
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      id="workspace-ai-sidebar"
      className={cn(
        "fixed right-4 top-20 z-30 flex h-[calc(100vh-6rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-surface-border bg-base/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out sm:w-96",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none translate-x-[calc(100%+1.5rem)]"
      )}
      aria-label="AI workspace panel"
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between gap-3 border-b border-surface-border px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-ai-text">
            <BotMessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-copy-primary">
              AI Workspace
            </h2>
            <p className="truncate text-sm text-copy-muted">
              Collaborate with Ghost AI
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 border border-surface-border bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col px-4 pt-4"
      >
        <TabsList className="grid w-full grid-cols-2 bg-surface">
          <TabsTrigger
            value="architect"
            className="text-copy-muted data-[state=active]:bg-ai data-[state=active]:text-ai-foreground"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="text-copy-muted data-[state=active]:bg-ai data-[state=active]:text-ai-foreground"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="architect"
          className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/70"
        >
          <AiArchitectTab />
        </TabsContent>

        <TabsContent
          value="specs"
          className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/70"
        >
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
