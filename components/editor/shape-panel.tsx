"use client";

import type { DragEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NODE_SIZE_BY_SHAPE,
  type CanvasNodeShape,
  type CanvasShapeDragPayload,
} from "@/types/canvas";

interface ShapeOption {
  shape: CanvasNodeShape;
  label: string;
  Icon: LucideIcon;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Database },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

function createShapeDragPayload(
  shape: CanvasNodeShape
): CanvasShapeDragPayload {
  return {
    shape,
    size: { ...DEFAULT_NODE_SIZE_BY_SHAPE[shape] },
  };
}

function handleShapeDragStart(
  event: DragEvent<HTMLButtonElement>,
  shape: CanvasNodeShape
) {
  const payload = createShapeDragPayload(shape);
  const serializedPayload = JSON.stringify(payload);

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(CANVAS_SHAPE_DRAG_MIME, serializedPayload);
  event.dataTransfer.setData("text/plain", serializedPayload);
}

export function ShapePanel() {
  return (
    <div
      className="nodrag nopan absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur-md"
      role="toolbar"
      aria-label="Shape tools"
    >
      {SHAPE_OPTIONS.map(({ shape, label, Icon }) => (
        <Button
          key={shape}
          type="button"
          variant="ghost"
          size="icon"
          draggable
          data-shape={shape}
          title={label}
          aria-label={`Drag ${label.toLowerCase()} shape`}
          className="h-10 w-10 cursor-grab rounded-full border border-transparent bg-transparent text-copy-secondary hover:border-surface-border hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
          onDragStart={(event) => handleShapeDragStart(event, shape)}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </Button>
      ))}
    </div>
  );
}
