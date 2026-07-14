"use client";

import { useFeedMessages } from "@liveblocks/react";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BotMessageSquare,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AI_STATUS_FEED_ID,
  aiStatusFeedMessageSchema,
  isActiveAiStatusMessage,
  type AiStatusFeedMessage,
} from "@/types/tasks";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

interface AiSidebarProps {
  isOpen: boolean;
  projectId: string;
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

function AiStatusStrip({ status }: { status: AiStatusFeedMessage }) {
  const isActive = isActiveAiStatusMessage(status);
  const isError = status.level === "error";
  const isSuccess = status.level === "success";
  const Icon = isActive ? Loader2 : isError ? AlertCircle : CheckCircle2;
  const fallbackText = isActive
    ? "Ghost AI is working."
    : isError
      ? "Ghost AI could not finish that task."
      : "Ghost AI finished.";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-ai/40 bg-ai/10 px-3 py-2 text-xs text-copy-secondary",
        isSuccess && "border-state-success/40",
        isError && "border-state-error/40 text-state-error"
      )}
      aria-live="polite"
      aria-label="AI activity status"
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-ai-text",
          isActive && "animate-spin",
          isSuccess && "text-state-success",
          isError && "text-state-error"
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">
        {status.text ?? fallbackText}
      </span>
    </div>
  );
}

function readDesignError(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "Ghost AI could not start that design run.";
  }

  const error = (payload as { error?: unknown }).error;

  return typeof error === "string" && error.trim()
    ? error
    : "Ghost AI could not start that design run.";
}

function AiArchitectTab({ projectId }: { projectId: string }) {
  const feedMessagesResult = useFeedMessages(AI_STATUS_FEED_ID, { limit: 1 });
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextMessageId = useRef(1);
  const feedMessages = feedMessagesResult.messages ?? [];
  const latestFeedMessage = feedMessages[feedMessages.length - 1];
  const latestStatusResult = aiStatusFeedMessageSchema.safeParse(
    latestFeedMessage?.data
  );
  const latestStatus = latestStatusResult.success
    ? latestStatusResult.data
    : null;
  const isGenerationActive = latestStatus
    ? isActiveAiStatusMessage(latestStatus)
    : false;
  const isInputDisabled = isSubmitting || isGenerationActive;

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

  const submitDraft = async () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || isInputDisabled) {
      return;
    }

    const userMessage: ChatMessage = {
      id: nextMessageId.current,
      role: "user",
      content: trimmedDraft,
    };
    nextMessageId.current += 1;
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);
    setDraft("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedDraft,
          roomId: projectId,
          projectId,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      const assistantMessage: ChatMessage = {
        id: nextMessageId.current,
        role: "assistant",
        content: response.ok
          ? "I am generating that on the canvas now."
          : readDesignError(payload),
      };

      nextMessageId.current += 1;
      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch {
      const assistantMessage: ChatMessage = {
        id: nextMessageId.current,
        role: "assistant",
        content: "Ghost AI could not reach the design service.",
      };

      nextMessageId.current += 1;
      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="space-y-2 border-t border-surface-border p-4">
        {latestStatus ? <AiStatusStrip status={latestStatus} /> : null}
        <div className="flex items-end gap-2 rounded-2xl border border-surface-border bg-surface p-2">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitDraft();
              }
            }}
            placeholder="Ask Ghost AI about this architecture..."
            className="max-h-40 min-h-[72px] resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
            disabled={isInputDisabled}
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 bg-ai text-ai-foreground hover:bg-ai/90"
            onClick={() => void submitDraft()}
            disabled={draft.trim().length === 0 || isInputDisabled}
            aria-label="Send AI prompt"
            aria-busy={isInputDisabled}
          >
            {isInputDisabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SpecsTab({ projectId }: { projectId: string }) {
  const [specs, setSpecs] = useState<{ id: string; createdAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [specContent, setSpecContent] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadSpecs() {
      try {
        const response = await fetch(`/api/projects/${projectId}/specs`, {
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.specs) {
            setSpecs(data.specs);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load specs", error);
      } finally {
        setIsLoading(false);
      }
    }
    void loadSpecs();

    return () => {
      abortController.abort();
    };
  }, [projectId]);

  const handleDownload = (specId: string) => {
    window.open(`/api/projects/${projectId}/specs/${specId}/download`, '_blank');
  };

  const handlePreview = async (specId: string) => {
    setSelectedSpecId(specId);
    setSpecContent("Loading...");
    setIsPreviewOpen(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/specs/${specId}/download`);
      if (response.ok) {
        const text = await response.text();
        setSpecContent(text);
      } else {
        setSpecContent("Failed to load spec content.");
      }
    } catch {
      setSpecContent("Failed to load spec content.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <Button
        type="button"
        className="w-full bg-ai text-ai-foreground hover:bg-ai/90"
      >
        <Sparkles className="h-4 w-4" />
        Generate Spec
      </Button>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 pb-4">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-copy-muted">Loading specs...</div>
          ) : specs.length === 0 ? (
            <div className="p-4 text-center text-sm text-copy-muted">No specs generated yet.</div>
          ) : (
            specs.map((spec) => (
              <article 
                key={spec.id} 
                className="group cursor-pointer rounded-2xl border border-surface-border bg-elevated p-4 transition-colors hover:border-ai/50"
                onClick={() => handlePreview(spec.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handlePreview(spec.id);
                  }
                }}
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-ai-text transition-colors group-hover:bg-ai/10">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-copy-primary transition-colors group-hover:text-ai-text">
                      Architecture Specification
                    </h3>
                    <p className="mt-1 text-xs text-copy-muted">
                      {new Date(spec.createdAt).toLocaleDateString()} at {new Date(spec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 border-surface-border bg-subtle text-copy-muted hover:bg-elevated hover:text-copy-primary"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDownload(spec.id); 
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col p-0">
          <DialogHeader className="border-b border-surface-border px-6 py-4">
            <DialogTitle>Spec Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="font-mono text-sm leading-relaxed text-copy-primary whitespace-pre-wrap">
              {specContent}
            </div>
          </ScrollArea>
          <div className="flex justify-end border-t border-surface-border p-4">
            <Button
              type="button"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={() => selectedSpecId && handleDownload(selectedSpecId)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Spec
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AiSidebar({ isOpen, projectId, onClose }: AiSidebarProps) {
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
          <AiArchitectTab projectId={projectId} />
        </TabsContent>

        <TabsContent
          value="specs"
          className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/70"
        >
          <SpecsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
