"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const EDGE_INTERACTION_WIDTH = 24;
const EDGE_BORDER_RADIUS = 8;
const EDGE_PATH_OFFSET = 18;
const EMPTY_EDGE_HINT = "Add label";

interface EdgeLabelStyle extends CSSProperties {
  width: string;
}

function stopCanvasInteraction(event: SyntheticEvent) {
  event.stopPropagation();
}

function getMarkerId(edgeId: string) {
  return `ghost-canvas-edge-arrow-${edgeId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function CanvasEdgeRenderer({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const savedLabel = data?.label ?? "";
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(savedLabel);
  const isActive = selected || isHovered || isEditing;
  const trimmedLabel = savedLabel.trim();
  const shouldShowLabel = isEditing || trimmedLabel || isActive;
  const markerId = useMemo(() => getMarkerId(id), [id]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
    offset: EDGE_PATH_OFFSET,
  });

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [isEditing]);

  const commitLabel = useCallback(() => {
    updateEdgeData(id, { label: draftLabel });
    setIsEditing(false);
  }, [draftLabel, id, updateEdgeData]);

  const startEditing = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDraftLabel(savedLabel);
      setIsEditing(true);
    },
    [savedLabel]
  );

  const handleLabelChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraftLabel(event.target.value);
    },
    []
  );

  const handleLabelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();

      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        commitLabel();
      }
    },
    [commitLabel]
  );

  const labelStyle: EdgeLabelStyle = {
    width: `${Math.max(draftLabel.length, EMPTY_EDGE_HINT.length, 4)}ch`,
  };
  const edgeColor = isActive ? "var(--text-primary)" : "var(--text-secondary)";
  const edgeOpacity = isActive ? 0.95 : 0.58;

  return (
    <>
      <g
        onDoubleClick={startEditing}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        <defs>
          <marker
            id={markerId}
            markerHeight="8"
            markerUnits="strokeWidth"
            markerWidth="8"
            orient="auto-start-reverse"
            refX="7.25"
            refY="4"
            viewBox="0 0 8 8"
          >
            <path d="M1 1L7 4L1 7Z" fill={edgeColor} opacity={edgeOpacity} />
          </marker>
        </defs>
        <BaseEdge
          id={id}
          className="transition-[opacity,stroke] duration-150"
          interactionWidth={EDGE_INTERACTION_WIDTH}
          markerEnd={`url(#${markerId})`}
          path={edgePath}
          style={{
            opacity: edgeOpacity,
            stroke: edgeColor,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 1.6,
          }}
        />
      </g>
      {shouldShowLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan nowheel absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: labelX,
              pointerEvents: "all",
              top: labelY,
            }}
            onClick={stopCanvasInteraction}
            onDoubleClick={startEditing}
            onMouseDown={stopCanvasInteraction}
            onPointerDown={stopCanvasInteraction}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                aria-label="Edge label"
                className="h-7 rounded-full border border-brand bg-surface px-2.5 text-center text-xs font-medium text-copy-primary shadow-lg outline-none placeholder:text-copy-faint focus-visible:ring-2 focus-visible:ring-brand"
                onBlur={commitLabel}
                onChange={handleLabelChange}
                onKeyDown={handleLabelKeyDown}
                placeholder={EMPTY_EDGE_HINT}
                spellCheck={false}
                style={labelStyle}
                value={draftLabel}
              />
            ) : (
              <span
                className={cn(
                  "block max-w-48 truncate rounded-full border bg-surface/90 px-2.5 py-1 text-xs font-medium shadow-lg backdrop-blur-sm",
                  trimmedLabel
                    ? "border-surface-border text-copy-secondary"
                    : "border-surface-border-subtle text-copy-faint"
                )}
              >
                {trimmedLabel || EMPTY_EDGE_HINT}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
