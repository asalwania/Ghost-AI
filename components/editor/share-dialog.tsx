"use client";

import { useState } from "react";
import { Check, Copy, Loader2, UserMinus, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CollaboratorEntry } from "@/hooks/use-share-dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

function CollaboratorAvatar({
  entry,
}: {
  entry: CollaboratorEntry;
}) {
  const initials = entry.displayName
    ? entry.displayName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : entry.email[0].toUpperCase();

  if (entry.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entry.imageUrl}
        alt={entry.displayName ?? entry.email}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated border border-surface-border text-xs font-semibold text-copy-secondary">
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collaborator row
// ---------------------------------------------------------------------------

function CollaboratorRow({
  entry,
  isOwner,
  isLoading,
  onRemove,
}: {
  entry: CollaboratorEntry;
  isOwner: boolean;
  isLoading: boolean;
  onRemove: (email: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-elevated transition-colors">
      <CollaboratorAvatar entry={entry} />
      <div className="min-w-0 flex-1">
        {entry.displayName && (
          <p className="truncate text-sm font-medium text-copy-primary">
            {entry.displayName}
          </p>
        )}
        <p
          className={cn(
            "truncate text-xs",
            entry.displayName ? "text-copy-muted" : "text-sm text-copy-secondary"
          )}
        >
          {entry.email}
        </p>
      </div>
      {isOwner && (
        <Button
          id={`remove-collaborator-${entry.email}`}
          type="button"
          variant="ghost"
          size="icon"
          disabled={isLoading}
          onClick={() => onRemove(entry.email)}
          aria-label={`Remove ${entry.displayName ?? entry.email}`}
          className="shrink-0 h-7 w-7 text-copy-faint hover:text-state-error hover:bg-state-error/10"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share dialog
// ---------------------------------------------------------------------------

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
  collaborators: CollaboratorEntry[];
  isFetching: boolean;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
  onInvite: (email: string) => Promise<void>;
  onRemove: (email: string) => Promise<void>;
  onCopyLink: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  isOwner,
  collaborators,
  isFetching,
  isLoading,
  error,
  copied,
  onInvite,
  onRemove,
  onCopyLink,
}: ShareDialogProps) {
  const [emailInput, setEmailInput] = useState("");

  const handleInvite = async () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    await onInvite(trimmed);
    setEmailInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleInvite();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-surface-border bg-surface p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-surface-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            <DialogTitle className="text-base font-semibold text-copy-primary">
              Share project
            </DialogTitle>
          </div>
          <Button
            id="share-copy-link-btn"
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopyLink}
            className={cn(
              "h-8 gap-1.5 border-surface-border text-xs transition-colors",
              copied
                ? "border-state-success/40 bg-state-success/10 text-state-success"
                : "bg-subtle text-copy-secondary hover:bg-elevated hover:text-copy-primary"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy link
              </>
            )}
          </Button>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Invite section — owners only */}
          {isOwner && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="share-invite-email"
                className="text-xs font-medium uppercase tracking-wider text-copy-muted"
              >
                Invite by email
              </label>
              <div className="flex gap-2">
                <Input
                  id="share-invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="h-9 flex-1 rounded-xl border-surface-border bg-elevated text-sm text-copy-primary placeholder:text-copy-faint focus-visible:ring-brand/40"
                />
                <Button
                  id="share-invite-btn"
                  type="button"
                  size="sm"
                  disabled={isLoading || !emailInput.trim()}
                  onClick={() => void handleInvite()}
                  className="h-9 gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-base hover:bg-brand/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Invite
                </Button>
              </div>
              {error && (
                <p className="text-xs text-state-error">{error}</p>
              )}
            </div>
          )}

          {/* Collaborators list */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-copy-muted">
              {collaborators.length === 0 && !isFetching
                ? isOwner
                  ? "No collaborators yet"
                  : "Collaborators"
                : `Collaborators · ${collaborators.length}`}
            </p>

            {isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-copy-faint" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-surface-border py-8 text-center">
                <Users className="h-8 w-8 text-copy-faint" />
                <p className="text-sm text-copy-muted">
                  {isOwner
                    ? "Invite someone above to collaborate."
                    : "No collaborators on this project."}
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-56">
                <div className="flex flex-col">
                  {collaborators.map((entry) => (
                    <CollaboratorRow
                      key={entry.email}
                      entry={entry}
                      isOwner={isOwner}
                      isLoading={isLoading}
                      onRemove={(email) => void onRemove(email)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
