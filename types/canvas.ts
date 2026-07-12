import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";
export const CANVAS_SHAPE_DRAG_MIME = "application/ghost-ai-shape";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type CanvasNodeShape = (typeof NODE_SHAPES)[number];

export interface CanvasNodeSize {
  width: number;
  height: number;
}

export const DEFAULT_NODE_SIZE_BY_SHAPE = {
  rectangle: { width: 160, height: 88 },
  diamond: { width: 148, height: 148 },
  circle: { width: 104, height: 104 },
  pill: { width: 156, height: 64 },
  cylinder: { width: 144, height: 96 },
  hexagon: { width: 152, height: 92 },
} as const satisfies Record<CanvasNodeShape, CanvasNodeSize>;

export interface CanvasShapeDragPayload {
  shape: CanvasNodeShape;
  size: CanvasNodeSize;
}

export const NODE_COLORS = [
  { background: "#1F1F1F", text: "#EDEDED" },
  { background: "#10233D", text: "#52A8FF" },
  { background: "#2E1938", text: "#BF7AF0" },
  { background: "#331B00", text: "#FF990A" },
  { background: "#3C1618", text: "#FF6166" },
  { background: "#3A1726", text: "#F75F8F" },
  { background: "#0F2E18", text: "#62C073" },
  { background: "#062822", text: "#0AC7B4" },
] as const;

export type CanvasNodeColor = (typeof NODE_COLORS)[number];

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: CanvasNodeColor;
  shape: CanvasNodeShape;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;
export type CanvasFlowStorage = LiveblocksFlow<CanvasNode, CanvasEdge>;
