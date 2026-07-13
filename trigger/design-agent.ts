import { createGoogle } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { ensureProjectRoom, getLiveblocksClient } from "../lib/liveblocks";
import type {
  AiStatusEvent,
  AiStatusLevel,
  AiStatusPhase,
} from "../liveblocks.config";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZE_BY_SHAPE,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeData,
  type CanvasNodeShape,
  type CanvasNodeSize,
  type CanvasSnapshot,
} from "../types/canvas";

const DESIGN_ACTION_TYPES = [
  "add_node",
  "move_node",
  "resize_node",
  "update_node_data",
  "delete_node",
  "add_edge",
  "delete_edge",
] as const;

type DesignActionType = (typeof DESIGN_ACTION_TYPES)[number];

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
  projectName?: string;
}

interface GeneratedPosition {
  x?: number;
  y?: number;
}

interface GeneratedSize {
  width?: number;
  height?: number;
}

interface GeneratedColor {
  background?: string;
  text?: string;
}

interface GeneratedNodeData {
  label?: string;
  shape?: string;
  colorIndex?: number;
  color?: GeneratedColor;
}

interface GeneratedNode extends GeneratedNodeData {
  id?: string;
  position?: GeneratedPosition;
  size?: GeneratedSize;
}

interface GeneratedEdge {
  id?: string;
  source?: string;
  target?: string;
  label?: string;
}

interface GeneratedDesignAction {
  type?: string;
  nodeId?: string;
  edgeId?: string;
  sourceId?: string;
  targetId?: string;
  position?: GeneratedPosition;
  size?: GeneratedSize;
  data?: GeneratedNodeData;
  node?: GeneratedNode;
  edge?: GeneratedEdge;
}

interface GeneratedDesignPlan {
  summary?: string;
  actions: GeneratedDesignAction[];
}

type CanvasAction =
  | { type: "add_node"; node: CanvasNode }
  | { type: "move_node"; nodeId: string; position: { x: number; y: number } }
  | { type: "resize_node"; nodeId: string; size: CanvasNodeSize }
  | {
      type: "update_node_data";
      nodeId: string;
      data: Partial<CanvasNodeData>;
    }
  | { type: "delete_node"; nodeId: string }
  | { type: "add_edge"; edge: CanvasEdge }
  | { type: "delete_edge"; edgeId: string };

interface ApplyResult {
  actionsApplied: number;
  nodesAdded: number;
  nodesUpdated: number;
  nodesDeleted: number;
  edgesAdded: number;
  edgesDeleted: number;
}

const AI_AGENT_USER_ID = "ghost-ai-design-agent";
const AI_AGENT_NAME = "Ghost AI";
const AI_AGENT_COLOR = NODE_COLORS[2].text;
const CANVAS_GRID_SIZE = 20;
const MIN_NODE_WIDTH = 80;
const MAX_NODE_WIDTH = 360;
const MIN_NODE_HEIGHT = 56;
const MAX_NODE_HEIGHT = 240;
const MIN_NODE_SPACING_X = 220;
const MIN_NODE_SPACING_Y = 140;
const DEFAULT_EDGE_INTERACTION_WIDTH = 24;

function isCanvasShape(value: unknown): value is CanvasNodeShape {
  return (
    typeof value === "string" &&
    NODE_SHAPES.includes(value as CanvasNodeShape)
  );
}

function isDesignActionType(value: string): value is DesignActionType {
  return DESIGN_ACTION_TYPES.includes(value as DesignActionType);
}

function readActionType(value: unknown): DesignActionType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "update_node") {
    return "update_node_data";
  }

  return isDesignActionType(normalized) ? normalized : null;
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim().replace(/\s+/g, " ");

  return text ? text.slice(0, maxLength) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readGeneratedNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readGeneratedPosition(value: unknown): GeneratedPosition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const x = readGeneratedNumber(value.x);
  const y = readGeneratedNumber(value.y);

  return x === undefined && y === undefined ? undefined : { x, y };
}

function readGeneratedSize(value: unknown): GeneratedSize | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const width = readGeneratedNumber(value.width);
  const height = readGeneratedNumber(value.height);

  return width === undefined && height === undefined
    ? undefined
    : { width, height };
}

function readGeneratedColor(value: unknown): GeneratedColor | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const background = readText(value.background, 24) ?? undefined;
  const text = readText(value.text, 24) ?? undefined;

  return background === undefined && text === undefined
    ? undefined
    : { background, text };
}

function readGeneratedNodeData(
  value: unknown
): GeneratedNodeData | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const data: GeneratedNodeData = {};
  const label = readText(value.label, 80);
  const shape = readText(value.shape, 24);
  const colorIndex = readGeneratedNumber(value.colorIndex);
  const color = readGeneratedColor(value.color);

  if (label !== null) {
    data.label = label;
  }
  if (shape !== null) {
    data.shape = shape;
  }
  if (colorIndex !== undefined) {
    data.colorIndex = colorIndex;
  }
  if (color) {
    data.color = color;
  }

  return Object.keys(data).length > 0 ? data : undefined;
}

function readGeneratedNode(value: unknown): GeneratedNode | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const node: GeneratedNode = {
    ...(readGeneratedNodeData(value) ?? {}),
  };
  const id = readText(value.id, 96);
  const position = readGeneratedPosition(value.position);
  const size = readGeneratedSize(value.size);

  if (id !== null) {
    node.id = id;
  }
  if (position) {
    node.position = position;
  }
  if (size) {
    node.size = size;
  }

  return Object.keys(node).length > 0 ? node : undefined;
}

function readGeneratedEdge(value: unknown): GeneratedEdge | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const edge: GeneratedEdge = {};
  const id = readText(value.id, 96);
  const source = readText(value.source, 96);
  const target = readText(value.target, 96);
  const label = readText(value.label, 64);

  if (id !== null) {
    edge.id = id;
  }
  if (source !== null) {
    edge.source = source;
  }
  if (target !== null) {
    edge.target = target;
  }
  if (label !== null) {
    edge.label = label;
  }

  return Object.keys(edge).length > 0 ? edge : undefined;
}

function readGeneratedAction(value: unknown): GeneratedDesignAction | null {
  if (!isRecord(value)) {
    return null;
  }

  const action: GeneratedDesignAction = {};
  const type = readText(value.type, 32);
  const nodeId = readText(value.nodeId, 96);
  const edgeId = readText(value.edgeId, 96);
  const sourceId = readText(value.sourceId, 96);
  const targetId = readText(value.targetId, 96);
  const position = readGeneratedPosition(value.position);
  const size = readGeneratedSize(value.size);
  const data = readGeneratedNodeData(value.data);
  const node = readGeneratedNode(value.node);
  const edge = readGeneratedEdge(value.edge);

  if (type !== null) {
    action.type = type;
  }
  if (nodeId !== null) {
    action.nodeId = nodeId;
  }
  if (edgeId !== null) {
    action.edgeId = edgeId;
  }
  if (sourceId !== null) {
    action.sourceId = sourceId;
  }
  if (targetId !== null) {
    action.targetId = targetId;
  }
  if (position) {
    action.position = position;
  }
  if (size) {
    action.size = size;
  }
  if (data) {
    action.data = data;
  }
  if (node) {
    action.node = node;
  }
  if (edge) {
    action.edge = edge;
  }

  return action.type ? action : null;
}

function readGeneratedDesignPlan(value: unknown): GeneratedDesignPlan {
  if (!isRecord(value)) {
    return { actions: [] };
  }

  const rawActions = Array.isArray(value.actions) ? value.actions : [];

  return {
    summary: readText(value.summary, 240) ?? undefined,
    actions: rawActions
      .slice(0, 18)
      .map(readGeneratedAction)
      .filter((action): action is GeneratedDesignAction => action !== null),
  };
}

function stripJsonCodeFence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return (match?.[1] ?? trimmed).trim();
}

function extractJsonObjectText(text: string) {
  const source = stripJsonCodeFence(text);
  const start = source.indexOf("{");

  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  return null;
}

function readGeneratedDesignPlanFromText(text: string): GeneratedDesignPlan {
  const jsonText = extractJsonObjectText(text);

  if (!jsonText) {
    throw new Error("Gemini did not return a JSON design plan.");
  }

  try {
    return readGeneratedDesignPlan(JSON.parse(jsonText));
  } catch {
    throw new Error("Gemini returned an invalid JSON design plan.");
  }
}

function slugifyId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function makeUniqueId(
  preferredId: string | null,
  prefix: string,
  existingIds: Set<string>
) {
  const base = slugifyId(preferredId ?? "") || `${prefix}-${Date.now()}`;
  let candidate = base;
  let index = 1;

  while (existingIds.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  existingIds.add(candidate);

  return candidate;
}

function addNodeAlias(
  nodeAliases: Map<string, string>,
  alias: unknown,
  nodeId: string
) {
  const text = readText(alias, 96);

  if (!text) {
    return;
  }

  for (const candidate of [text, text.toLowerCase(), slugifyId(text)]) {
    if (candidate && !nodeAliases.has(candidate)) {
      nodeAliases.set(candidate, nodeId);
    }
  }
}

function resolveNodeReference(
  value: unknown,
  nodesById: Map<string, CanvasNode>,
  nodeAliases: Map<string, string>
) {
  const nodeId = readText(value, 96);

  if (!nodeId) {
    return null;
  }
  if (nodesById.has(nodeId)) {
    return nodeId;
  }

  const aliasedNodeId =
    nodeAliases.get(nodeId) ??
    nodeAliases.get(nodeId.toLowerCase()) ??
    nodeAliases.get(slugifyId(nodeId));

  return aliasedNodeId && nodesById.has(aliasedNodeId) ? aliasedNodeId : null;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToGrid(value: number) {
  return Math.round(value / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
}

function readPosition(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const position = value as GeneratedPosition;

  if (
    typeof position.x !== "number" ||
    !Number.isFinite(position.x) ||
    typeof position.y !== "number" ||
    !Number.isFinite(position.y)
  ) {
    return null;
  }

  return {
    x: roundToGrid(clampNumber(position.x, -4000, 4000)),
    y: roundToGrid(clampNumber(position.y, -4000, 4000)),
  };
}

function readSize(value: unknown, fallback: CanvasNodeSize): CanvasNodeSize {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const size = value as GeneratedSize;

  return {
    width:
      typeof size.width === "number" && Number.isFinite(size.width)
        ? roundToGrid(clampNumber(size.width, MIN_NODE_WIDTH, MAX_NODE_WIDTH))
        : fallback.width,
    height:
      typeof size.height === "number" && Number.isFinite(size.height)
        ? roundToGrid(clampNumber(size.height, MIN_NODE_HEIGHT, MAX_NODE_HEIGHT))
        : fallback.height,
  };
}

function isCanvasColor(value: unknown): value is CanvasNodeColor {
  if (!value || typeof value !== "object") {
    return false;
  }

  const color = value as GeneratedColor;

  return NODE_COLORS.some(
    (paletteColor) =>
      paletteColor.background === color.background &&
      paletteColor.text === color.text
  );
}

function readColorByIndex(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < NODE_COLORS.length
  ) {
    return NODE_COLORS[value];
  }

  return null;
}

function readOptionalColor(
  colorIndex: unknown,
  color: unknown
): CanvasNodeColor | null {
  return readColorByIndex(colorIndex) ?? (isCanvasColor(color) ? color : null);
}

function readColor(
  colorIndex: unknown,
  color: unknown,
  fallbackIndex: number
): CanvasNodeColor {
  return (
    readOptionalColor(colorIndex, color) ??
    NODE_COLORS[fallbackIndex % NODE_COLORS.length] ??
    DEFAULT_NODE_COLOR
  );
}

function getNodeSize(node: CanvasNode): CanvasNodeSize {
  const style = node.style as { width?: unknown; height?: unknown } | undefined;
  const fallback = DEFAULT_NODE_SIZE_BY_SHAPE[node.data.shape];

  return {
    width:
      typeof style?.width === "number" && Number.isFinite(style.width)
        ? style.width
        : fallback.width,
    height:
      typeof style?.height === "number" && Number.isFinite(style.height)
        ? style.height
        : fallback.height,
  };
}

function getLayoutOrigin(snapshot: CanvasSnapshot) {
  if (snapshot.nodes.length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: Math.max(...snapshot.nodes.map((node) => node.position.x)) + 280,
    y: Math.min(...snapshot.nodes.map((node) => node.position.y)),
  };
}

function getLayoutPosition(index: number, snapshot: CanvasSnapshot) {
  const origin = getLayoutOrigin(snapshot);

  return {
    x: origin.x + (index % 3) * 260,
    y: origin.y + Math.floor(index / 3) * 180,
  };
}

function resolveFreePosition(
  requestedPosition: { x: number; y: number },
  occupiedPositions: Array<{ x: number; y: number }>
) {
  let candidate = requestedPosition;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const hasCollision = occupiedPositions.some(
      (position) =>
        Math.abs(position.x - candidate.x) < MIN_NODE_SPACING_X &&
        Math.abs(position.y - candidate.y) < MIN_NODE_SPACING_Y
    );

    if (!hasCollision) {
      occupiedPositions.push(candidate);
      return candidate;
    }

    candidate = {
      x: requestedPosition.x + ((attempt % 4) + 1) * MIN_NODE_SPACING_X,
      y:
        requestedPosition.y +
        Math.floor((attempt + 1) / 4) * MIN_NODE_SPACING_Y,
    };
  }

  occupiedPositions.push(candidate);
  return candidate;
}

function readUpdateNodeData(
  generated: GeneratedNodeData | null | undefined
): Partial<CanvasNodeData> {
  const data: Partial<CanvasNodeData> = {};
  const label = readText(generated?.label, 80);
  const color = readOptionalColor(generated?.colorIndex, generated?.color);

  if (label !== null) {
    data.label = label;
  }
  if (isCanvasShape(generated?.shape)) {
    data.shape = generated.shape;
  }
  if (color) {
    data.color = color;
  }

  return data;
}

function findExistingNodeId(
  action: GeneratedDesignAction,
  nodesById: Map<string, CanvasNode>,
  nodeAliases: Map<string, string>
) {
  return resolveNodeReference(action.nodeId ?? action.node?.id, nodesById, nodeAliases);
}

function findExistingEdgeId(
  action: GeneratedDesignAction,
  edgesById: Map<string, CanvasEdge>
) {
  const edgeId = readText(action.edgeId ?? action.edge?.id, 96);

  if (edgeId && edgesById.has(edgeId)) {
    return edgeId;
  }

  const sourceId = readText(action.sourceId ?? action.edge?.source, 96);
  const targetId = readText(action.targetId ?? action.edge?.target, 96);

  if (!sourceId || !targetId) {
    return null;
  }

  return (
    [...edgesById.values()].find(
      (edge) => edge.source === sourceId && edge.target === targetId
    )?.id ?? null
  );
}

function getEdgeLabel(action: GeneratedDesignAction) {
  return readText(action.edge?.label ?? action.data?.label, 64) ?? "";
}

function buildCanvasActions(
  plan: GeneratedDesignPlan,
  snapshot: CanvasSnapshot
) {
  const actions: CanvasAction[] = [];
  const nodesById = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const edgesById = new Map(snapshot.edges.map((edge) => [edge.id, edge]));
  const plannedNodeIds = new Set(nodesById.keys());
  const plannedEdgeIds = new Set(edgesById.keys());
  const nodeAliases = new Map<string, string>();
  const occupiedPositions = snapshot.nodes.map((node) => node.position);
  let addedNodeIndex = 0;

  for (const node of snapshot.nodes) {
    addNodeAlias(nodeAliases, node.id, node.id);
    addNodeAlias(nodeAliases, node.data.label, node.id);
  }

  for (const generatedAction of plan.actions ?? []) {
    const actionType = readActionType(generatedAction.type);

    if (!actionType) {
      continue;
    }

    if (actionType === "add_node") {
      const generatedNode = generatedAction.node;

      if (!generatedNode) {
        continue;
      }

      const label = readText(generatedNode.label, 80) ?? "Untitled";
      const shape = isCanvasShape(generatedNode.shape)
        ? generatedNode.shape
        : "rectangle";
      const size = readSize(
        generatedNode.size,
        DEFAULT_NODE_SIZE_BY_SHAPE[shape]
      );
      const requestedPosition =
        readPosition(generatedNode.position) ??
        getLayoutPosition(addedNodeIndex, snapshot);
      const position = resolveFreePosition(requestedPosition, occupiedPositions);
      const nodeId = makeUniqueId(
        readText(generatedNode.id, 96) ?? label,
        "node",
        plannedNodeIds
      );
      const node: CanvasNode = {
        id: nodeId,
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label,
          color: readColor(
            generatedNode.colorIndex,
            generatedNode.color,
            addedNodeIndex + 1
          ),
          shape,
        },
        style: size,
      };

      nodesById.set(node.id, node);
      addNodeAlias(nodeAliases, generatedNode.id, node.id);
      addNodeAlias(nodeAliases, label, node.id);
      actions.push({ type: "add_node", node });
      addedNodeIndex += 1;
      continue;
    }

    if (actionType === "move_node") {
      const nodeId = findExistingNodeId(generatedAction, nodesById, nodeAliases);
      const position = readPosition(generatedAction.position);

      if (!nodeId || !position) {
        continue;
      }

      actions.push({ type: "move_node", nodeId, position });
      nodesById.set(nodeId, { ...nodesById.get(nodeId)!, position });
      continue;
    }

    if (actionType === "resize_node") {
      const nodeId = findExistingNodeId(generatedAction, nodesById, nodeAliases);

      if (!nodeId) {
        continue;
      }

      const node = nodesById.get(nodeId)!;
      const size = readSize(generatedAction.size, getNodeSize(node));

      actions.push({ type: "resize_node", nodeId, size });
      nodesById.set(nodeId, { ...node, style: { ...node.style, ...size } });
      continue;
    }

    if (actionType === "update_node_data") {
      const nodeId = findExistingNodeId(generatedAction, nodesById, nodeAliases);
      const data = readUpdateNodeData(
        generatedAction.data ?? generatedAction.node
      );

      if (!nodeId || Object.keys(data).length === 0) {
        continue;
      }

      actions.push({ type: "update_node_data", nodeId, data });
      nodesById.set(nodeId, {
        ...nodesById.get(nodeId)!,
        data: { ...nodesById.get(nodeId)!.data, ...data },
      });
      continue;
    }

    if (actionType === "delete_node") {
      const nodeId = findExistingNodeId(generatedAction, nodesById, nodeAliases);

      if (!nodeId) {
        continue;
      }

      actions.push({ type: "delete_node", nodeId });
      nodesById.delete(nodeId);

      for (const [edgeId, edge] of edgesById) {
        if (edge.source === nodeId || edge.target === nodeId) {
          edgesById.delete(edgeId);
          plannedEdgeIds.delete(edgeId);
        }
      }
      continue;
    }

    if (actionType === "add_edge") {
      const sourceId = readText(
        generatedAction.sourceId ?? generatedAction.edge?.source,
        96
      );
      const targetId = readText(
        generatedAction.targetId ?? generatedAction.edge?.target,
        96
      );
      const resolvedSourceId = resolveNodeReference(
        sourceId,
        nodesById,
        nodeAliases
      );
      const resolvedTargetId = resolveNodeReference(
        targetId,
        nodesById,
        nodeAliases
      );

      if (!resolvedSourceId || !resolvedTargetId) {
        continue;
      }

      const label = getEdgeLabel(generatedAction);
      const edgeId = makeUniqueId(
        readText(generatedAction.edgeId ?? generatedAction.edge?.id, 96) ??
          `edge-${resolvedSourceId}-${resolvedTargetId}`,
        "edge",
        plannedEdgeIds
      );
      const edge: CanvasEdge = {
        id: edgeId,
        type: CANVAS_EDGE_TYPE,
        source: resolvedSourceId,
        target: resolvedTargetId,
        data: { label },
        interactionWidth: DEFAULT_EDGE_INTERACTION_WIDTH,
      };

      edgesById.set(edge.id, edge);
      actions.push({ type: "add_edge", edge });
      continue;
    }

    if (actionType === "delete_edge") {
      const edgeId = findExistingEdgeId(generatedAction, edgesById);

      if (!edgeId) {
        continue;
      }

      actions.push({ type: "delete_edge", edgeId });
      edgesById.delete(edgeId);
      plannedEdgeIds.delete(edgeId);
    }
  }

  return actions;
}

async function readCanvasSnapshot(roomId: string): Promise<CanvasSnapshot> {
  let snapshot: CanvasSnapshot = { nodes: [], edges: [] };
  const client = getLiveblocksClient();

  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
    const flowSnapshot = flow.toJSON();
    snapshot = {
      nodes: flowSnapshot.nodes.map((node) => ({
        ...node,
        position: { ...node.position },
        data: { ...node.data },
        style: node.style ? { ...node.style } : undefined,
      })),
      edges: flowSnapshot.edges.map((edge) => ({
        ...edge,
        data: edge.data ? { ...edge.data } : undefined,
        style: edge.style ? { ...edge.style } : undefined,
      })),
    };
  });

  return snapshot;
}

async function applyCanvasActions(
  roomId: string,
  actions: CanvasAction[]
): Promise<ApplyResult> {
  const result: ApplyResult = {
    actionsApplied: 0,
    nodesAdded: 0,
    nodesUpdated: 0,
    nodesDeleted: 0,
    edgesAdded: 0,
    edgesDeleted: 0,
  };
  const client = getLiveblocksClient();

  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
    for (const action of actions) {
      if (action.type === "add_node") {
        if (flow.getNode(action.node.id)) {
          continue;
        }

        flow.addNode(action.node);
        result.nodesAdded += 1;
        result.actionsApplied += 1;
        continue;
      }

      if (action.type === "move_node") {
        if (!flow.getNode(action.nodeId)) {
          continue;
        }

        flow.updateNode(action.nodeId, { position: action.position });
        result.nodesUpdated += 1;
        result.actionsApplied += 1;
        continue;
      }

      if (action.type === "resize_node") {
        const node = flow.getNode(action.nodeId);

        if (!node) {
          continue;
        }

        flow.updateNode(action.nodeId, {
          style: { ...node.style, ...action.size },
        });
        result.nodesUpdated += 1;
        result.actionsApplied += 1;
        continue;
      }

      if (action.type === "update_node_data") {
        if (!flow.getNode(action.nodeId)) {
          continue;
        }

        flow.updateNodeData(action.nodeId, action.data);
        result.nodesUpdated += 1;
        result.actionsApplied += 1;
        continue;
      }

      if (action.type === "delete_node") {
        if (!flow.getNode(action.nodeId)) {
          continue;
        }

        const connectedEdgeIds = flow.edges
          .filter(
            (edge) =>
              edge.source === action.nodeId || edge.target === action.nodeId
          )
          .map((edge) => edge.id);

        if (connectedEdgeIds.length > 0) {
          flow.removeEdges(connectedEdgeIds);
          result.edgesDeleted += connectedEdgeIds.length;
        }

        flow.removeNode(action.nodeId);
        result.nodesDeleted += 1;
        result.actionsApplied += 1;
        continue;
      }

      if (action.type === "add_edge") {
        if (
          flow.getEdge(action.edge.id) ||
          !flow.getNode(action.edge.source) ||
          !flow.getNode(action.edge.target)
        ) {
          continue;
        }

        flow.addEdge(action.edge);
        result.edgesAdded += 1;
        result.actionsApplied += 1;
        continue;
      }

      if (action.type === "delete_edge") {
        if (!flow.getEdge(action.edgeId)) {
          continue;
        }

        flow.removeEdge(action.edgeId);
        result.edgesDeleted += 1;
        result.actionsApplied += 1;
      }
    }
  });

  return result;
}

function summarizeCanvas(snapshot: CanvasSnapshot) {
  return {
    nodes: snapshot.nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      color: node.data.color,
      position: node.position,
      size: getNodeSize(node),
    })),
    edges: snapshot.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.label ?? "",
    })),
  };
}

function buildPrompt(
  payload: DesignAgentPayload,
  snapshot: CanvasSnapshot,
  options: { strictJsonRetry?: boolean } = {}
) {
  return [
    `Project: ${payload.projectName ?? payload.roomId}`,
    `User request: ${payload.prompt}`,
    `Current canvas: ${JSON.stringify(summarizeCanvas(snapshot), null, 2)}`,
    [
      "Return only one JSON object with this shape:",
      '{"summary":"short text","actions":[{"type":"add_node","node":{"id":"stable-id","label":"Service","shape":"rectangle","colorIndex":1,"position":{"x":0,"y":0},"size":{"width":160,"height":88}}},{"type":"add_edge","edge":{"id":"edge-a-b","source":"stable-id","target":"other-id","label":"optional"}}]}',
      "Do not wrap the JSON in markdown fences or add commentary.",
      "Use only the supported action types.",
      `Allowed shapes: ${NODE_SHAPES.join(", ")}.`,
      `Color choices are palette indexes 0 through ${NODE_COLORS.length - 1}.`,
      "Use existing node and edge IDs exactly when updating, moving, resizing, or deleting.",
      "For an empty canvas, add 4 to 8 well-spaced nodes and enough edges to show the main flow.",
      "For an existing canvas, extend or refine the design without deleting anything unless the user explicitly asked for deletion.",
      "Keep nodes at least 220px apart horizontally and 140px apart vertically.",
      "Prefer readable labels under 6 words.",
    ].join(" "),
    options.strictJsonRetry
      ? "Previous response could not be parsed. Return raw JSON only, starting with { and ending with }."
      : "",
  ].join("\n\n");
}

function createGeminiModel() {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GEMINI_API_KEY is required for the design agent."
    );
  }

  return createGoogle({ apiKey })("gemini-2.5-flash");
}

function readErrorStringProperty(error: unknown, property: string) {
  if (!isRecord(error)) {
    return null;
  }

  const value = error[property];

  return typeof value === "string" ? value : null;
}

function readErrorStatus(error: unknown) {
  if (!isRecord(error)) {
    return null;
  }

  return typeof error.status === "number" ? error.status : null;
}

function getErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : null;
  const details = readErrorStringProperty(error, "details");

  return [message, details].filter(Boolean).join(" ");
}

async function generateDesignPlan(
  payload: DesignAgentPayload,
  snapshot: CanvasSnapshot
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const generation = await generateText({
      model: createGeminiModel(),
      prompt: buildPrompt(payload, snapshot, { strictJsonRetry: attempt > 1 }),
      temperature: 0.2,
      maxOutputTokens: 2800,
      timeout: 60_000,
    });

    try {
      return readGeneratedDesignPlanFromText(generation.text);
    } catch (error) {
      lastError = error;

      logger.warn("Failed to parse design plan JSON", {
        attempt,
        roomId: payload.roomId,
        error: getErrorMessage(error) || String(error),
      });
    }
  }

  throw lastError ?? new Error("Gemini did not return a JSON design plan.");
}

function makeStatusEvent(
  roomId: string,
  status: {
    runId?: string;
    level: AiStatusLevel;
    phase: AiStatusPhase;
    message: string;
  }
): AiStatusEvent {
  return {
    type: "AI_STATUS",
    id: `${roomId}-${status.phase}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    runId: status.runId,
    level: status.level,
    phase: status.phase,
    message: status.message,
    createdAt: new Date().toISOString(),
  };
}

async function publishStatus(
  roomId: string,
  status: {
    runId?: string;
    level: AiStatusLevel;
    phase: AiStatusPhase;
    message: string;
  }
) {
  try {
    await getLiveblocksClient().broadcastEvent(roomId, makeStatusEvent(roomId, status));
  } catch (error) {
    logger.warn("Failed to publish AI status", {
      roomId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function getPresenceCursor(snapshot: CanvasSnapshot) {
  const firstNode = snapshot.nodes[0];

  if (!firstNode) {
    return { x: 0, y: 0 };
  }

  const size = getNodeSize(firstNode);

  return {
    x: firstNode.position.x + size.width / 2,
    y: firstNode.position.y + size.height / 2,
  };
}

async function setAiPresence(
  roomId: string,
  presence: { cursor: { x: number; y: number } | null; thinking: boolean }
) {
  try {
    await getLiveblocksClient().setPresence(roomId, {
      userId: AI_AGENT_USER_ID,
      data: presence,
      userInfo: {
        name: AI_AGENT_NAME,
        color: AI_AGENT_COLOR,
        displayName: AI_AGENT_NAME,
        avatarUrl: null,
        cursorColor: AI_AGENT_COLOR,
      },
    });
  } catch (error) {
    logger.warn("Failed to update AI presence", {
      roomId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function getCompletionMessage(result: ApplyResult) {
  if (result.actionsApplied === 0) {
    return "Ghost AI finished, but no safe canvas changes were needed.";
  }

  return `Ghost AI applied ${result.actionsApplied} canvas ${
    result.actionsApplied === 1 ? "change" : "changes"
  }.`;
}

function getFriendlyErrorMessage(error: unknown) {
  const errorMessage = getErrorMessage(error);

  if (
    errorMessage.includes("GOOGLE_AI_API_KEY") ||
    errorMessage.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
    errorMessage.includes("GEMINI_API_KEY") ||
    errorMessage.includes("API key not valid")
  ) {
    return "Ghost AI is not configured for generation yet.";
  }

  if (readErrorStatus(error) === 404 && errorMessage.includes("room ID")) {
    return "Ghost AI could not find the canvas room. Reopen the workspace and try again.";
  }

  if (errorMessage.includes("JSON design plan")) {
    return "Ghost AI could not produce a valid canvas plan. Try a smaller or more specific prompt.";
  }

  if (
    errorMessage.toLowerCase().includes("quota") ||
    errorMessage.toLowerCase().includes("rate limit")
  ) {
    return "Ghost AI hit the Gemini rate limit. Wait a moment and try again.";
  }

  return "Ghost AI could not update the canvas. Try a smaller or more specific prompt.";
}

export const designAgentTask = task({
  id: "design-agent",
  retry: { maxAttempts: 1 },
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const runId = ctx.run.id;

    metadata.set("status", "starting");
    metadata.set("roomId", payload.roomId);

    let snapshot: CanvasSnapshot = { nodes: [], edges: [] };

    try {
      await ensureProjectRoom(
        payload.roomId,
        payload.projectName ?? payload.roomId
      );
      snapshot = await readCanvasSnapshot(payload.roomId);

      await setAiPresence(payload.roomId, {
        cursor: getPresenceCursor(snapshot),
        thinking: true,
      });
      await publishStatus(payload.roomId, {
        runId,
        level: "info",
        phase: "start",
        message: "Ghost AI is reading the canvas.",
      });

      metadata.set("status", "processing");
      await publishStatus(payload.roomId, {
        runId,
        level: "info",
        phase: "processing",
        message: "Ghost AI is planning canvas changes.",
      });

      const plan = await generateDesignPlan(payload, snapshot);
      const actions = buildCanvasActions(plan, snapshot);

      metadata.set("status", "applying");
      metadata.set("plannedActions", actions.length);
      await publishStatus(payload.roomId, {
        runId,
        level: "info",
        phase: "applying",
        message: `Ghost AI is applying ${actions.length} safe canvas ${
          actions.length === 1 ? "change" : "changes"
        }.`,
      });

      const result = await applyCanvasActions(payload.roomId, actions);
      const message = getCompletionMessage(result);

      metadata
        .set("status", "complete")
        .set("actionsApplied", result.actionsApplied)
        .set("nodesAdded", result.nodesAdded)
        .set("nodesUpdated", result.nodesUpdated)
        .set("nodesDeleted", result.nodesDeleted)
        .set("edgesAdded", result.edgesAdded)
        .set("edgesDeleted", result.edgesDeleted);

      await publishStatus(payload.roomId, {
        runId,
        level: "success",
        phase: "complete",
        message,
      });

      return {
        success: true,
        summary: plan.summary ?? message,
        plannedActions: actions.length,
        applied: result,
      };
    } catch (error) {
      const message = getFriendlyErrorMessage(error);

      logger.error("Design agent failed", {
        roomId: payload.roomId,
        error: getErrorMessage(error) || String(error),
        status: readErrorStatus(error) ?? undefined,
      });
      metadata.set("status", "error").set("error", message);

      await publishStatus(payload.roomId, {
        runId,
        level: "error",
        phase: "error",
        message,
      });

      return {
        success: false,
        error: message,
      };
    } finally {
      await setAiPresence(payload.roomId, {
        cursor: null,
        thinking: false,
      });
    }
  },
});
