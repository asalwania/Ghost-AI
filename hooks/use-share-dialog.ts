"use client";

import { useCallback, useState } from "react";

import type { CollaboratorEntry } from "@/app/api/projects/[projectId]/collaborators/route";

export type { CollaboratorEntry };

interface UseShareDialogOptions {
  projectId: string;
  isOwner: boolean;
}

interface ShareDialogState {
  open: boolean;
  collaborators: CollaboratorEntry[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  copied: boolean;
  setOpen: (open: boolean) => void;
  invite: (email: string) => Promise<void>;
  remove: (email: string) => Promise<void>;
  copyLink: () => void;
}

async function fetchCollaborators(projectId: string): Promise<CollaboratorEntry[]> {
  const res = await fetch(`/api/projects/${projectId}/collaborators`);
  if (!res.ok) throw new Error("Failed to load collaborators");
  const data = await res.json();
  return data.collaborators as CollaboratorEntry[];
}

export function useShareDialog({
  projectId,
  isOwner,
}: UseShareDialogOptions): ShareDialogState {
  const [open, setOpenState] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCollaborators = useCallback(async () => {
    setIsFetching(true);
    try {
      const list = await fetchCollaborators(projectId);
      setCollaborators(list);
    } catch {
      // non-fatal; keep existing list
    } finally {
      setIsFetching(false);
    }
  }, [projectId]);

  const setOpen = useCallback(
    (value: boolean) => {
      setOpenState(value);
      if (value) {
        void loadCollaborators();
      }
    },
    [loadCollaborators]
  );

  const invite = useCallback(
    async (email: string) => {
      if (!isOwner) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : "Failed to invite"
          );
        }
        await loadCollaborators();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to invite");
      } finally {
        setIsLoading(false);
      }
    },
    [isOwner, projectId, loadCollaborators]
  );

  const remove = useCallback(
    async (email: string) => {
      if (!isOwner) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : "Failed to remove"
          );
        }
        setCollaborators((prev) => prev.filter((c) => c.email !== email));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove");
      } finally {
        setIsLoading(false);
      }
    },
    [isOwner, projectId]
  );

  const copyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return {
    open,
    collaborators,
    isLoading,
    isFetching,
    error,
    copied,
    setOpen,
    invite,
    remove,
    copyLink,
  };
}
