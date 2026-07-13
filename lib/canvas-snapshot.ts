import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
  type CanvasSnapshot,
} from "@/types/canvas";

const DEFAULT_EDGE_INTERACTION_WIDTH = 24;

interface CanvasPosition {
  x: number;
  y: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readPositiveNumber(value: unknown): number | null {
  const numberValue = readFiniteNumber(value);

  return numberValue !== null && numberValue > 0 ? numberValue : null;
}

function readPosition(value: unknown): CanvasPosition | null {
  if (!isRecord(value)) {
    return null;
  }

  const x = readFiniteNumber(value.x);
  const y = readFiniteNumber(value.y);

  return x !== null && y !== null ? { x, y } : null;
}

function readNodeShape(value: unknown): CanvasNodeShape {
  return typeof value === "string" &&
    NODE_SHAPES.includes(value as CanvasNodeShape)
    ? (value as CanvasNodeShape)
    : "rectangle";
}

function readNodeColor(value: unknown): CanvasNodeColor {
  if (!isRecord(value)) {
    return DEFAULT_NODE_COLOR;
  }

  const background = readString(value.background)?.toLowerCase();
  const text = readString(value.text)?.toLowerCase();

  return (
    NODE_COLORS.find(
      (color) =>
        color.background.toLowerCase() === background &&
        color.text.toLowerCase() === text
    ) ?? DEFAULT_NODE_COLOR
  );
}

function readNodeStyle(value: unknown): CanvasNode["style"] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const width = readPositiveNumber(value.width);
  const height = readPositiveNumber(value.height);
  const style: CanvasNode["style"] = {};

  if (width !== null) {
    style.width = width;
  }

  if (height !== null) {
    style.height = height;
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function readOptionalHandle(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

function sanitizeCanvasNode(value: unknown): CanvasNode | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const position = readPosition(value.position);

  if (!id || !position) {
    return null;
  }

  const data = isRecord(value.data) ? value.data : {};
  const style = readNodeStyle(value.style);

  return {
    id,
    type: CANVAS_NODE_TYPE,
    position,
    data: {
      label: readString(data.label) ?? "",
      color: readNodeColor(data.color),
      shape: readNodeShape(data.shape),
    },
    ...(style ? { style } : {}),
  };
}

function sanitizeCanvasEdge(value: unknown): CanvasEdge | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const source = readString(value.source);
  const target = readString(value.target);

  if (!id || !source || !target) {
    return null;
  }

  const data = isRecord(value.data) ? value.data : {};
  const sourceHandle = readOptionalHandle(value.sourceHandle);
  const targetHandle = readOptionalHandle(value.targetHandle);
  const interactionWidth =
    readPositiveNumber(value.interactionWidth) ??
    DEFAULT_EDGE_INTERACTION_WIDTH;

  return {
    id,
    source,
    target,
    type: CANVAS_EDGE_TYPE,
    data: {
      label: readString(data.label) ?? "",
    },
    interactionWidth,
    ...(sourceHandle !== undefined ? { sourceHandle } : {}),
    ...(targetHandle !== undefined ? { targetHandle } : {}),
  };
}

export function createCanvasSnapshot(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): CanvasSnapshot {
  const snapshotNodes = nodes
    .map((node) => sanitizeCanvasNode(node))
    .filter((node): node is CanvasNode => node !== null);
  const snapshotEdges = edges
    .map((edge) => sanitizeCanvasEdge(edge))
    .filter((edge): edge is CanvasEdge => edge !== null);

  return {
    nodes: snapshotNodes,
    edges: snapshotEdges,
  };
}

export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges)
  ) {
    return null;
  }

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  for (const node of value.nodes) {
    const canvasNode = sanitizeCanvasNode(node);

    if (!canvasNode) {
      return null;
    }

    nodes.push(canvasNode);
  }

  for (const edge of value.edges) {
    const canvasEdge = sanitizeCanvasEdge(edge);

    if (!canvasEdge) {
      return null;
    }

    edges.push(canvasEdge);
  }

  return {
    nodes,
    edges,
  };
}
