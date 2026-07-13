"use client";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import {
  type CSSProperties,
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
import {
  NODE_COLORS,
  type CanvasNode,
  type CanvasNodeColor,
} from "@/types/canvas";

const HANDLE_CLASS =
  "h-2.5 w-2.5 border border-base bg-copy-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100";
const RESIZE_HANDLE_CLASS =
  "h-2 w-2 rounded-full border border-base opacity-80 transition-opacity duration-150";
const RESIZE_LINE_CLASS = "opacity-45 transition-opacity duration-150";
const MIN_NODE_WIDTH = 96;
const MIN_NODE_HEIGHT = 52;
const EMPTY_LABEL_PLACEHOLDER = "Untitled node";

interface NodeColorSwatchStyle extends CSSProperties {
  "--swatch-glow": string;
}

function stopCanvasInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

function isSameNodeColor(
  firstColor: CanvasNodeColor,
  secondColor: CanvasNodeColor
) {
  return (
    firstColor.background.toLowerCase() ===
      secondColor.background.toLowerCase() &&
    firstColor.text.toLowerCase() === secondColor.text.toLowerCase()
  );
}

function NodeColorToolbar({
  activeColor,
  onSelectColor,
}: {
  activeColor: CanvasNodeColor;
  onSelectColor: (color: CanvasNodeColor) => void;
}) {
  return (
    <div
      className="nodrag nopan nowheel absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-[calc(100%+0.625rem)] items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur-md"
      role="toolbar"
      aria-label="Node colors"
      onClick={stopCanvasInteraction}
      onDoubleClick={stopCanvasInteraction}
      onMouseDown={stopCanvasInteraction}
      onPointerDown={stopCanvasInteraction}
    >
      {NODE_COLORS.map((color) => {
        const isActive = isSameNodeColor(activeColor, color);
        const swatchStyle: NodeColorSwatchStyle = {
          "--swatch-glow": `color-mix(in srgb, ${color.text} 34%, transparent)`,
        };

        return (
          <button
            key={`${color.background}-${color.text}`}
            type="button"
            aria-label={`Use node color ${color.background}`}
            aria-pressed={isActive}
            title={color.background}
            className={cn(
              "relative h-7 w-7 rounded-full border border-transparent p-0.5 transition duration-150 hover:shadow-[0_0_0_3px_var(--swatch-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              isActive
                ? "border-brand bg-brand-dim shadow-[0_0_0_1px_var(--accent-primary)]"
                : "hover:border-surface-border"
            )}
            style={swatchStyle}
            onClick={(event) => {
              event.stopPropagation();
              onSelectColor(color);
            }}
          >
            <span
              className="block h-full w-full rounded-full border border-surface-border-subtle"
              style={{ backgroundColor: color.background }}
            />
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-2 rounded-full"
                style={{ backgroundColor: color.text }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
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

  const handleColorSelect = useCallback(
    (color: CanvasNodeColor) => {
      updateNodeData(id, { color });
    },
    [id, updateNodeData]
  );

  return (
    <div className="group relative h-full min-h-12 w-full min-w-20">
      {selected ? (
        <NodeColorToolbar
          activeColor={data.color}
          onSelectColor={handleColorSelect}
        />
      ) : null}
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
        isConnectableEnd
        isConnectableStart
        className={HANDLE_CLASS}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        isConnectableEnd
        isConnectableStart
        className={HANDLE_CLASS}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        isConnectableEnd
        isConnectableStart
        className={HANDLE_CLASS}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        isConnectableEnd
        isConnectableStart
        className={HANDLE_CLASS}
      />
    </div>
  );
}
