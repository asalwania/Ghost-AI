"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createCanvasSnapshot } from "@/lib/canvas-snapshot";
import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

export type CanvasSaveStatus = "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
  debounceMs?: number;
}

interface UseCanvasAutosaveResult {
  status: CanvasSaveStatus;
  lastSavedAt: Date | null;
  saveNow: () => void;
}

const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1200;

function isEmptySnapshot(snapshot: CanvasSnapshot) {
  return snapshot.nodes.length === 0 && snapshot.edges.length === 0;
}

async function saveCanvasSnapshot(projectId: string, snapshot: CanvasSnapshot) {
  const response = await fetch(`/api/projects/${projectId}/canvas`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    throw new Error(`Canvas save failed with status ${response.status}`);
  }
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = DEFAULT_AUTOSAVE_DEBOUNCE_MS,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const snapshot = useMemo(
    () => createCanvasSnapshot(nodes, edges),
    [edges, nodes]
  );
  const snapshotSignature = useMemo(
    () => JSON.stringify(snapshot),
    [snapshot]
  );
  const [status, setStatus] = useState<CanvasSaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const enabledRef = useRef(enabled);
  const snapshotRef = useRef(snapshot);
  const snapshotSignatureRef = useRef(snapshotSignature);
  const lastSavedSignatureRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const hasQueuedSaveRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    snapshotRef.current = snapshot;
    snapshotSignatureRef.current = snapshotSignature;
  }, [snapshot, snapshotSignature]);

  useEffect(() => {
    lastSavedSignatureRef.current = null;
  }, [projectId]);

  const saveCurrentSnapshot = useCallback(async () => {
    if (!enabledRef.current) {
      return;
    }

    if (isSavingRef.current) {
      hasQueuedSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;

    try {
      while (enabledRef.current) {
        hasQueuedSaveRef.current = false;

        const nextSnapshot = snapshotRef.current;
        const nextSignature = snapshotSignatureRef.current;

        if (nextSignature === lastSavedSignatureRef.current) {
          setStatus("saved");
          return;
        }

        if (
          lastSavedSignatureRef.current === null &&
          isEmptySnapshot(nextSnapshot)
        ) {
          lastSavedSignatureRef.current = nextSignature;
          setStatus("saved");
          return;
        }

        setStatus("saving");

        try {
          await saveCanvasSnapshot(projectId, nextSnapshot);
          lastSavedSignatureRef.current = nextSignature;
          setLastSavedAt(new Date());
          setStatus("saved");
        } catch (error) {
          console.error("Canvas autosave failed", error);
          setStatus("error");
          return;
        }

        if (
          !hasQueuedSaveRef.current &&
          snapshotSignatureRef.current === lastSavedSignatureRef.current
        ) {
          return;
        }
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (snapshotSignature === lastSavedSignatureRef.current) {
      return;
    }

    if (
      lastSavedSignatureRef.current === null &&
      isEmptySnapshot(snapshot)
    ) {
      lastSavedSignatureRef.current = snapshotSignature;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveCurrentSnapshot();
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, enabled, saveCurrentSnapshot, snapshot, snapshotSignature]);

  return {
    status,
    lastSavedAt,
    saveNow: () => {
      void saveCurrentSnapshot();
    },
  };
}
