"use client";

import { Import, LayoutTemplate } from "lucide-react";

import { CanvasShapeFrame } from "@/components/editor/canvas-shape";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_NODE_SIZE_BY_SHAPE, type CanvasNode } from "@/types/canvas";

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 172;
const PREVIEW_PADDING = 18;

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

interface PreviewNodeLayout {
  node: CanvasNode;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface PreviewEdgeLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function readNodeDimension(
  value: unknown,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function getNodeSize(node: CanvasNode) {
  const fallback = DEFAULT_NODE_SIZE_BY_SHAPE[node.data.shape];

  return {
    width: readNodeDimension(node.style?.width, fallback.width),
    height: readNodeDimension(node.style?.height, fallback.height),
  };
}

function getPreviewLayout(template: CanvasTemplate) {
  const nodeRects = template.nodes.map((node) => {
    const size = getNodeSize(node);

    return {
      node,
      x: node.position.x,
      y: node.position.y,
      width: size.width,
      height: size.height,
    };
  });

  const minX = Math.min(...nodeRects.map((node) => node.x));
  const minY = Math.min(...nodeRects.map((node) => node.y));
  const maxX = Math.max(...nodeRects.map((node) => node.x + node.width));
  const maxY = Math.max(...nodeRects.map((node) => node.y + node.height));
  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / contentWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / contentHeight
  );
  const offsetX = (PREVIEW_WIDTH - contentWidth * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - contentHeight * scale) / 2;

  const nodes: PreviewNodeLayout[] = nodeRects.map((rect) => {
    const x = offsetX + (rect.x - minX) * scale;
    const y = offsetY + (rect.y - minY) * scale;
    const width = rect.width * scale;
    const height = rect.height * scale;

    return {
      node: rect.node,
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.node.id, node]));
  const edges: PreviewEdgeLine[] = template.edges.flatMap((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);

    if (!source || !target) {
      return [];
    }

    return [
      {
        id: edge.id,
        x1: source.centerX,
        y1: source.centerY,
        x2: target.centerX,
        y2: target.centerY,
      },
    ];
  });

  return { edges, nodes };
}

function StarterTemplatePreview({ template }: { template: CanvasTemplate }) {
  const { edges, nodes } = getPreviewLayout(template);

  return (
    <div
      className="relative h-40 overflow-hidden rounded-xl border border-surface-border bg-base"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      >
        {edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="var(--text-secondary)"
            strokeLinecap="round"
            strokeWidth={1.6}
            opacity={0.58}
          />
        ))}
      </svg>
      {nodes.map(({ node, x, y, width, height }) => (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: x,
            top: y,
            width,
            height,
          }}
        >
          <CanvasShapeFrame
            shape={node.data.shape}
            backgroundColor={node.data.color.background}
            textColor={node.data.color.text}
            className="p-0 shadow-none"
          />
        </div>
      ))}
    </div>
  );
}

function StarterTemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: (template: CanvasTemplate) => void;
}) {
  return (
    <article className="flex min-h-0 flex-col gap-4 rounded-2xl border border-surface-border bg-elevated p-3 transition-colors hover:border-surface-border-subtle">
      <StarterTemplatePreview template={template} />
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <h3 className="truncate text-sm font-semibold text-copy-primary">
          {template.name}
        </h3>
        <p className="line-clamp-3 text-sm leading-5 text-copy-muted">
          {template.description}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => onImport(template)}
      >
        <Import className="h-4 w-4" />
        Import
      </Button>
    </article>
  );
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-surface-border px-6 py-5 pr-14">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-subtle text-brand">
            <LayoutTemplate className="h-5 w-5" />
          </div>
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription>
            Replace the current canvas with a predefined system design.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[min(680px,calc(100vh-11rem))]">
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <StarterTemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
