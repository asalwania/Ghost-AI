"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import type { CanvasNode } from "@/types/canvas";

const HANDLE_CLASS =
  "h-2.5 w-2.5 border border-base bg-copy-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100";

export function CanvasNodeRenderer({
  data,
  selected,
}: NodeProps<CanvasNode>) {
  return (
    <div
      className={cn(
        "group relative flex h-full min-h-12 w-full min-w-20 items-center justify-center rounded-xl border px-4 py-2 text-center text-sm font-medium shadow-lg",
        selected ? "border-brand" : "border-surface-border"
      )}
      style={{
        backgroundColor: data.color.background,
        color: data.color.text,
      }}
    >
      {data.label ? (
        <span className="max-w-full truncate">{data.label}</span>
      ) : null}
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
