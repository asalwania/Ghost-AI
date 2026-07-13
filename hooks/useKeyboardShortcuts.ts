"use client";

import { useEffect } from "react";
import type {
  Edge as FlowEdge,
  Node as FlowNode,
  ReactFlowInstance,
} from "@xyflow/react";

export const CANVAS_VIEWPORT_ANIMATION = { duration: 160 } as const;

interface UseKeyboardShortcutsOptions<
  NodeType extends FlowNode = FlowNode,
  EdgeType extends FlowEdge = FlowEdge,
> {
  reactFlow: ReactFlowInstance<NodeType, EdgeType>;
  onUndo: () => void;
  onRedo: () => void;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.closest("[contenteditable='true']") !== null
  );
}

export function useKeyboardShortcuts<
  NodeType extends FlowNode = FlowNode,
  EdgeType extends FlowEdge = FlowEdge,
>({
  reactFlow,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions<NodeType, EdgeType>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const hasPrimaryModifier = event.metaKey || event.ctrlKey;

      if (hasPrimaryModifier && !event.altKey && key === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }

        return;
      }

      if (hasPrimaryModifier && !event.altKey && key === "y") {
        event.preventDefault();
        onRedo();
        return;
      }

      if (!hasPrimaryModifier && !event.altKey && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        void reactFlow.zoomIn(CANVAS_VIEWPORT_ANIMATION);
        return;
      }

      if (!hasPrimaryModifier && !event.altKey && event.key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut(CANVAS_VIEWPORT_ANIMATION);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRedo, onUndo, reactFlow]);
}
