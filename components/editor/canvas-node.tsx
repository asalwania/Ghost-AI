"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { CanvasShapeFrame } from "@/components/editor/canvas-shape";
import type { CanvasNode } from "@/types/canvas";

const HANDLE_CLASS =
  "h-2.5 w-2.5 border border-base bg-copy-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100";

export function CanvasNodeRenderer({
  data,
  selected,
}: NodeProps<CanvasNode>) {
  return (
    <div className="group relative h-full min-h-12 w-full min-w-20">
      <CanvasShapeFrame
        shape={data.shape}
        backgroundColor={data.color.background}
        textColor={data.color.text}
        selected={selected}
      >
        {data.label ? (
          <span className="max-w-full truncate">{data.label}</span>
        ) : null}
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
