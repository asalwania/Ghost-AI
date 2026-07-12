"use client";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { CanvasShapeFrame } from "@/components/editor/canvas-shape";
import { cn } from "@/lib/utils";
import type { CanvasNode } from "@/types/canvas";

const HANDLE_CLASS =
  "h-2.5 w-2.5 border border-base bg-copy-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100";
const RESIZE_HANDLE_CLASS =
  "h-2 w-2 rounded-full border border-base opacity-80 transition-opacity duration-150";
const RESIZE_LINE_CLASS = "opacity-45 transition-opacity duration-150";
const MIN_NODE_WIDTH = 96;
const MIN_NODE_HEIGHT = 52;
const EMPTY_LABEL_PLACEHOLDER = "Untitled node";

function stopCanvasInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

export function CanvasNodeRenderer({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode>();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    syncTextareaHeight();
  }, [isEditing, syncTextareaHeight]);

  useEffect(() => {
    if (isEditing) {
      syncTextareaHeight();
    }
  }, [draftLabel, isEditing, syncTextareaHeight]);

  const startEditing = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation();
      setDraftLabel(data.label);
      setIsEditing(true);
    },
    [data.label]
  );

  const finishEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleLabelChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextLabel = event.target.value;

      setDraftLabel(nextLabel);
      updateNodeData(id, { label: nextLabel });
    },
    [id, updateNodeData]
  );

  const handleEditingKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      event.stopPropagation();

      if (event.key === "Escape") {
        event.preventDefault();
        finishEditing();
      }
    },
    [finishEditing]
  );

  return (
    <div className="group relative h-full min-h-12 w-full min-w-20">
      <NodeResizer
        nodeId={id}
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color="var(--accent-primary)"
        handleClassName={RESIZE_HANDLE_CLASS}
        lineClassName={RESIZE_LINE_CLASS}
      />
      <CanvasShapeFrame
        shape={data.shape}
        backgroundColor={data.color.background}
        textColor={data.color.text}
        selected={selected}
        contentClassName="overflow-hidden"
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
          onDoubleClick={isEditing ? stopCanvasInteraction : startEditing}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              aria-label="Node label"
              className="nodrag nopan nowheel max-h-full min-h-5 w-full resize-none overflow-y-auto border-0 bg-transparent px-0.5 text-center text-sm font-medium leading-tight text-inherit outline-none placeholder:text-current placeholder:opacity-55"
              onBlur={finishEditing}
              onChange={handleLabelChange}
              onClick={stopCanvasInteraction}
              onDoubleClick={stopCanvasInteraction}
              onKeyDown={handleEditingKeyDown}
              onMouseDown={stopCanvasInteraction}
              onPointerDown={stopCanvasInteraction}
              placeholder={EMPTY_LABEL_PLACEHOLDER}
              rows={1}
              spellCheck={false}
              value={draftLabel}
            />
          ) : (
            <span
              className={cn(
                "max-w-full cursor-text truncate px-0.5",
                data.label ? null : "opacity-55"
              )}
            >
              {data.label || EMPTY_LABEL_PLACEHOLDER}
            </span>
          )}
        </div>
      </CanvasShapeFrame>
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className={HANDLE_CLASS}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={HANDLE_CLASS}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={HANDLE_CLASS}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className={HANDLE_CLASS}
      />
    </div>
  );
}
