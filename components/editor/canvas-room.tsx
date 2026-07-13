"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useErrorListener,
  useEventListener,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Maximize2,
  Redo2,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Component,
  type DragEvent as ReactDragEvent,
  type ErrorInfo,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import {
  CanvasPresenceOverlay,
  LiveCursorLayer,
} from "@/components/editor/canvas-presence";
import { CanvasShapeFrame } from "@/components/editor/canvas-shape";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  CANVAS_VIEWPORT_ANIMATION,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import {
  useCanvasAutosave,
  type CanvasSaveStatus,
} from "@/hooks/use-canvas-autosave";
import { parseCanvasSnapshot } from "@/lib/canvas-snapshot";
import { cn } from "@/lib/utils";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
  type CanvasNodeSize,
  type CanvasShapeDragPayload,
} from "@/types/canvas";
import type { AiStatusEvent } from "@/liveblocks.config";

const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];
const CANVAS_NODE_TYPES: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};
const CANVAS_EDGE_TYPES: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};
const DEFAULT_CANVAS_EDGE_INTERACTION_WIDTH = 24;
const DEFAULT_CANVAS_EDGE_OPTIONS = {
  type: CANVAS_EDGE_TYPE,
  data: { label: "" },
  interactionWidth: DEFAULT_CANVAS_EDGE_INTERACTION_WIDTH,
} satisfies Pick<CanvasEdge, "type" | "data" | "interactionWidth">;
const CANVAS_FIT_VIEW_OPTIONS = {
  ...CANVAS_VIEWPORT_ANIMATION,
  padding: 0.18,
} as const;
const CANVAS_CONTROL_BUTTON_CLASS =
  "h-9 w-9 rounded-full border border-transparent bg-transparent text-copy-secondary hover:border-surface-border hover:bg-subtle hover:text-copy-primary disabled:text-copy-faint disabled:hover:border-transparent disabled:hover:bg-transparent";
const AI_STATUS_FEED_LIMIT = 4;
const AI_STATUS_TTL_MS = 45_000;

interface CanvasRoomProps {
  roomId: string;
  templateImport?: CanvasTemplateImportRequest | null;
}

export interface CanvasTemplateImportRequest {
  requestId: number;
  template: CanvasTemplate;
}

interface CanvasFlowProps {
  roomId: string;
  templateImport?: CanvasTemplateImportRequest | null;
}

interface CanvasFlowInnerProps {
  roomId: string;
  templateImport?: CanvasTemplateImportRequest | null;
}

interface CanvasErrorBoundaryState {
  error: Error | null;
}

interface DragClientPoint {
  x: number;
  y: number;
}

interface DragClientPointSource {
  clientX: number;
  clientY: number;
}

interface ShapeDragPreviewState {
  payload: CanvasShapeDragPayload;
  point: DragClientPoint;
}

interface CanvasControlBarProps {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

interface CanvasSaveButtonProps {
  status: CanvasSaveStatus;
  isLoading: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Canvas rendering failed", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return <CanvasFallback title="Canvas unavailable" />;
    }

    return this.props.children;
  }
}

function CanvasFallback({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="rounded-2xl border border-surface-border bg-surface/90 px-5 py-4 text-center shadow-lg">
        <p className="text-sm font-medium text-copy-primary">{title}</p>
      </div>
    </div>
  );
}

function LiveblocksErrorGate({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  useErrorListener((liveblocksError) => {
    console.error("Liveblocks canvas connection failed", liveblocksError);
    setError(liveblocksError);
  });

  if (error) {
    return <CanvasFallback title="Canvas connection failed" />;
  }

  return children;
}

function isCanvasNodeShape(value: unknown): value is CanvasNodeShape {
  return (
    typeof value === "string" &&
    NODE_SHAPES.includes(value as CanvasNodeShape)
  );
}

function isCanvasNodeSize(value: unknown): value is CanvasNodeSize {
  if (!value || typeof value !== "object") {
    return false;
  }

  const size = value as { width?: unknown; height?: unknown };

  return (
    typeof size.width === "number" &&
    Number.isFinite(size.width) &&
    size.width > 0 &&
    typeof size.height === "number" &&
    Number.isFinite(size.height) &&
    size.height > 0
  );
}

function isCanvasShapeDragPayload(
  value: unknown
): value is CanvasShapeDragPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as { shape?: unknown; size?: unknown };

  return isCanvasNodeShape(payload.shape) && isCanvasNodeSize(payload.size);
}

function readShapeDragPayload(
  dataTransfer: DataTransfer
): CanvasShapeDragPayload | null {
  const rawPayload = dataTransfer.getData(CANVAS_SHAPE_DRAG_MIME);

  if (!rawPayload) {
    return null;
  }

  try {
    const parsedPayload: unknown = JSON.parse(rawPayload);
    return isCanvasShapeDragPayload(parsedPayload) ? parsedPayload : null;
  } catch {
    return null;
  }
}

function readSavedCanvasPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("canvas" in payload)) {
    return null;
  }

  const canvas = (payload as { canvas?: unknown }).canvas;

  return canvas ? parseCanvasSnapshot(canvas) : null;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function readDragClientPoint(
  event: DragClientPointSource
): DragClientPoint | null {
  if (event.clientX === 0 && event.clientY === 0) {
    return null;
  }

  return { x: event.clientX, y: event.clientY };
}

function getElementCenter(element: HTMLElement): DragClientPoint {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function ShapeDragPreview({
  dragPreview,
}: {
  dragPreview: ShapeDragPreviewState;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-75"
      style={{
        left: dragPreview.point.x,
        top: dragPreview.point.y,
        width: dragPreview.payload.size.width,
        height: dragPreview.payload.size.height,
      }}
    >
      <CanvasShapeFrame
        shape={dragPreview.payload.shape}
        backgroundColor={DEFAULT_NODE_COLOR.background}
        textColor={DEFAULT_NODE_COLOR.text}
      />
    </div>
  );
}

function CanvasControlBar({
  reactFlow,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasControlBarProps) {
  const handleZoomOut = useCallback(() => {
    void reactFlow.zoomOut(CANVAS_VIEWPORT_ANIMATION);
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    void reactFlow.fitView(CANVAS_FIT_VIEW_OPTIONS);
  }, [reactFlow]);

  const handleZoomIn = useCallback(() => {
    void reactFlow.zoomIn(CANVAS_VIEWPORT_ANIMATION);
  }, [reactFlow]);

  return (
    <div
      className="nodrag nopan nowheel absolute bottom-4 left-6 z-20 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur-md"
      role="toolbar"
      aria-label="Canvas controls"
    >
      <div className="flex items-center gap-1" role="group" aria-label="Zoom">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Zoom out"
          aria-label="Zoom out"
          className={CANVAS_CONTROL_BUTTON_CLASS}
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Fit view"
          aria-label="Fit view"
          className={CANVAS_CONTROL_BUTTON_CLASS}
          onClick={handleFitView}
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Zoom in"
          aria-label="Zoom in"
          className={CANVAS_CONTROL_BUTTON_CLASS}
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="h-6 w-px bg-surface-border" aria-hidden />
      <div className="flex items-center gap-1" role="group" aria-label="History">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Undo"
          aria-label="Undo"
          disabled={!canUndo}
          className={CANVAS_CONTROL_BUTTON_CLASS}
          onClick={onUndo}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Redo"
          aria-label="Redo"
          disabled={!canRedo}
          className={CANVAS_CONTROL_BUTTON_CLASS}
          onClick={onRedo}
        >
          <Redo2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function CanvasSaveButton({
  status,
  isLoading,
  lastSavedAt,
  onSave,
}: CanvasSaveButtonProps) {
  const isSaving = status === "saving";
  const isError = status === "error";
  const label = isLoading
    ? "Loading"
    : status === "saving"
      ? "Saving"
      : status === "error"
        ? "Error"
        : "Saved";
  const title =
    status === "saved" && lastSavedAt
      ? `Saved at ${lastSavedAt.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`
      : label;
  const Icon = isLoading || isSaving ? Loader2 : isError ? AlertCircle : Save;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      title={title}
      aria-label={title}
      disabled={isLoading || isSaving}
      className={cn(
        "nodrag nopan nowheel absolute left-6 top-4 z-20 h-9 rounded-full border-surface-border bg-surface/90 px-3 text-xs font-medium text-copy-secondary shadow-lg backdrop-blur-md hover:bg-subtle hover:text-copy-primary",
        isError &&
          "border-state-error/50 text-state-error hover:text-state-error",
        status === "saved" &&
          !isLoading &&
          "border-state-success/40 text-state-success hover:text-state-success"
      )}
      onClick={onSave}
    >
      <Icon
        className={cn("h-4 w-4", (isLoading || isSaving) && "animate-spin")}
        aria-hidden
      />
      <span>{label}</span>
    </Button>
  );
}

function CanvasLoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 px-4 py-2 text-sm font-medium text-copy-secondary shadow-lg backdrop-blur-md">
        <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
        <span>Loading canvas</span>
      </div>
    </div>
  );
}

function AiStatusFeed() {
  const [messages, setMessages] = useState<AiStatusEvent[]>([]);

  useEventListener(({ event }) => {
    if (event.type !== "AI_STATUS") {
      return;
    }

    setMessages((currentMessages) =>
      [
        event,
        ...currentMessages.filter((message) => message.id !== event.id),
      ].slice(0, AI_STATUS_FEED_LIMIT)
    );
  });

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const now = Date.now();

      setMessages((currentMessages) =>
        currentMessages.filter((message) => {
          const createdAt = Date.parse(message.createdAt);

          return Number.isNaN(createdAt) || now - createdAt < AI_STATUS_TTL_MS;
        })
      );
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className="nodrag nopan nowheel pointer-events-none absolute left-1/2 top-16 z-20 flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
      aria-label="AI status"
    >
      {messages.map((message) => {
        const isSuccess = message.level === "success";
        const isError = message.level === "error";
        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Loader2;

        return (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-2 rounded-lg border border-surface-border bg-surface/90 px-3 py-2 text-sm shadow-lg backdrop-blur-md",
              isSuccess && "border-state-success/40",
              isError && "border-state-error/40"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 text-ai-text",
                !isSuccess && !isError && "animate-spin",
                isSuccess && "text-state-success",
                isError && "text-state-error"
              )}
              aria-hidden
            />
            <p
              className={cn(
                "min-w-0 flex-1 text-copy-primary",
                isError && "text-state-error"
              )}
            >
              {message.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function normalizeCanvasEdge(edge: CanvasEdge): CanvasEdge {
  if (
    edge.type === CANVAS_EDGE_TYPE &&
    edge.data &&
    typeof edge.interactionWidth === "number"
  ) {
    return edge;
  }

  return {
    ...edge,
    type: CANVAS_EDGE_TYPE,
    data: {
      label: edge.data?.label ?? "",
    },
    interactionWidth:
      edge.interactionWidth ?? DEFAULT_CANVAS_EDGE_INTERACTION_WIDTH,
  };
}

function cloneTemplateNode(node: CanvasNode): CanvasNode {
  return {
    ...node,
    selected: false,
    dragging: false,
    position: { ...node.position },
    data: {
      ...node.data,
    },
    style: node.style ? { ...node.style } : undefined,
  };
}

function cloneTemplateEdge(edge: CanvasEdge): CanvasEdge {
  return {
    ...edge,
    selected: false,
    data: {
      label: edge.data?.label ?? "",
    },
    style: edge.style ? { ...edge.style } : undefined,
  };
}

function CanvasFlowInner({ roomId, templateImport }: CanvasFlowInnerProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: INITIAL_NODES },
    edges: { initial: INITIAL_EDGES },
  });
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const nodeIdCounter = useRef(0);
  const lastTemplateImportRequestId = useRef<number | null>(null);
  const [dragPreview, setDragPreview] =
    useState<ShapeDragPreviewState | null>(null);
  const canvasEdges = useMemo(
    () => edges.map((edge) => normalizeCanvasEdge(edge)),
    [edges]
  );
  const [hasCheckedSavedCanvas, setHasCheckedSavedCanvas] = useState(false);
  const roomHasCanvasContent = nodes.length > 0 || edges.length > 0;
  const [hasSkippedSavedLoad, setHasSkippedSavedLoad] =
    useState(roomHasCanvasContent);
  const [isLoadingSavedCanvas, setIsLoadingSavedCanvas] = useState(false);
  const latestCanvasRef = useRef({ nodes, edges });
  const hasResolvedInitialCanvas =
    hasCheckedSavedCanvas || roomHasCanvasContent || hasSkippedSavedLoad;
  const autosave = useCanvasAutosave({
    projectId: roomId,
    nodes,
    edges,
    enabled: hasResolvedInitialCanvas,
  });

  useEffect(() => {
    latestCanvasRef.current = { nodes, edges };
  }, [edges, nodes]);

  useEffect(() => {
    if (!roomHasCanvasContent || hasSkippedSavedLoad) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasSkippedSavedLoad(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hasSkippedSavedLoad, roomHasCanvasContent]);

  useEffect(() => {
    if (roomHasCanvasContent) {
      return;
    }

    if (hasCheckedSavedCanvas || hasSkippedSavedLoad) {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    async function loadSavedCanvas() {
      setIsLoadingSavedCanvas(true);

      try {
        const response = await fetch(`/api/projects/${roomId}/canvas`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Canvas load failed with status ${response.status}`);
        }

        const payload: unknown = await response.json();
        const savedCanvas = readSavedCanvasPayload(payload);

        if (!savedCanvas) {
          return;
        }

        const latestCanvas = latestCanvasRef.current;

        if (latestCanvas.nodes.length > 0 || latestCanvas.edges.length > 0) {
          return;
        }

        onNodesChange(
          savedCanvas.nodes.map((node, index) => ({
            type: "add",
            item: node,
            index,
          }))
        );
        onEdgesChange(
          savedCanvas.edges.map((edge, index) => ({
            type: "add",
            item: edge,
            index,
          }))
        );

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            void reactFlow.fitView(CANVAS_FIT_VIEW_OPTIONS);
          });
        });
      } catch (error) {
        if (!cancelled && !isAbortError(error)) {
          console.error("Saved canvas load failed", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSavedCanvas(false);
          setHasCheckedSavedCanvas(true);
        }
      }
    }

    void loadSavedCanvas();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [
    hasCheckedSavedCanvas,
    hasSkippedSavedLoad,
    onEdgesChange,
    onNodesChange,
    reactFlow,
    roomHasCanvasContent,
    roomId,
  ]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
    }
  }, [canRedo, redo]);

  useKeyboardShortcuts({
    reactFlow,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  useEffect(() => {
    if (
      !templateImport ||
      lastTemplateImportRequestId.current === templateImport.requestId
    ) {
      return;
    }

    lastTemplateImportRequestId.current = templateImport.requestId;

    const nextNodes = templateImport.template.nodes.map(cloneTemplateNode);
    const nextEdges = templateImport.template.edges.map(cloneTemplateEdge);
    const nodeChanges: NodeChange<CanvasNode>[] = nextNodes.map(
      (node, index) => ({
        type: "add",
        item: node,
        index,
      })
    );
    const edgeChanges: EdgeChange<CanvasEdge>[] = nextEdges.map(
      (edge, index) => ({
        type: "add",
        item: edge,
        index,
      })
    );

    onDelete({ nodes, edges });
    onNodesChange(nodeChanges);
    onEdgesChange(edgeChanges);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        void reactFlow.fitView(CANVAS_FIT_VIEW_OPTIONS);
      });
    });
  }, [
    edges,
    nodes,
    onDelete,
    onEdgesChange,
    onNodesChange,
    reactFlow,
    templateImport,
  ]);

  const updateShapeDragPreviewPosition = useCallback(
    (event: DragClientPointSource) => {
      const point = readDragClientPoint(event);

      if (!point) {
        return;
      }

      setDragPreview((currentPreview) =>
        currentPreview ? { ...currentPreview, point } : currentPreview
      );
    },
    []
  );

  const clearShapeDragPreview = useCallback(() => {
    setDragPreview(null);
  }, []);

  const handleShapeDragStart = useCallback(
    (
      payload: CanvasShapeDragPayload,
      event: ReactDragEvent<HTMLButtonElement>
    ) => {
      const point =
        readDragClientPoint(event) ?? getElementCenter(event.currentTarget);

      setDragPreview({ payload, point });
    },
    []
  );

  const handleShapeDragMove = useCallback(
    (event: ReactDragEvent<HTMLButtonElement>) => {
      updateShapeDragPreviewPosition(event);
    },
    [updateShapeDragPreviewPosition]
  );

  const hasDragPreview = dragPreview !== null;

  useEffect(() => {
    if (!hasDragPreview) {
      return;
    }

    const handleWindowDragOver = (event: globalThis.DragEvent) => {
      updateShapeDragPreviewPosition(event);
    };

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", clearShapeDragPreview);
    window.addEventListener("dragend", clearShapeDragPreview);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", clearShapeDragPreview);
      window.removeEventListener("dragend", clearShapeDragPreview);
    };
  }, [clearShapeDragPreview, hasDragPreview, updateShapeDragPreviewPosition]);

  const handleDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.types.includes(CANVAS_SHAPE_DRAG_MIME)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      updateShapeDragPreviewPosition(event);
    },
    [updateShapeDragPreviewPosition]
  );

  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      const payload = readShapeDragPayload(event.dataTransfer);

      if (!payload) {
        clearShapeDragPreview();
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";

      nodeIdCounter.current += 1;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeIdCounter.current}`,
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
        style: {
          width: payload.size.width,
          height: payload.size.height,
        },
      };

      onNodesChange([{ type: "add", item: node }]);
      clearShapeDragPreview();
    },
    [clearShapeDragPreview, onNodesChange, screenToFlowPosition]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const [newEdge] = addEdge<CanvasEdge>(connection, []);

      if (!newEdge) {
        return;
      }

      const canvasEdge: CanvasEdge = {
        ...newEdge,
        type: CANVAS_EDGE_TYPE,
        data: { label: "" },
        interactionWidth: DEFAULT_CANVAS_EDGE_INTERACTION_WIDTH,
      };

      onEdgesChange([
        {
          type: "add",
          item: canvasEdge,
        },
      ]);
    },
    [onEdgesChange]
  );

  const handleCanvasMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      updateMyPresence({
        cursor: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow<CanvasNode, CanvasEdge>
        className="ghost-canvas h-full w-full bg-base"
        nodes={nodes}
        edges={canvasEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        nodeTypes={CANVAS_NODE_TYPES}
        edgeTypes={CANVAS_EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_CANVAS_EDGE_OPTIONS}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: "var(--accent-primary)",
          strokeLinecap: "round",
          strokeWidth: 1.4,
        }}
        connectionMode={ConnectionMode.Loose}
        elevateEdgesOnSelect
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="var(--border-subtle)"
        />
        <CanvasControlBar
          reactFlow={reactFlow}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
        <CanvasSaveButton
          status={autosave.status}
          isLoading={isLoadingSavedCanvas}
          lastSavedAt={autosave.lastSavedAt}
          onSave={autosave.saveNow}
        />
        <ShapePanel
          onShapeDragStart={handleShapeDragStart}
          onShapeDrag={handleShapeDragMove}
          onShapeDragEnd={clearShapeDragPreview}
        />
        <LiveCursorLayer />
      </ReactFlow>
      {isLoadingSavedCanvas ? <CanvasLoadingOverlay /> : null}
      <AiStatusFeed />
      <CanvasPresenceOverlay />
      {dragPreview ? <ShapeDragPreview dragPreview={dragPreview} /> : null}
    </div>
  );
}

function CanvasFlow({ roomId, templateImport }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner roomId={roomId} templateImport={templateImport} />
    </ReactFlowProvider>
  );
}

export function CanvasRoom({ roomId, templateImport }: CanvasRoomProps) {
  return (
    <div className="h-full w-full">
      <CanvasErrorBoundary>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, thinking: false }}
          >
            <LiveblocksErrorGate>
              <ClientSideSuspense fallback={<CanvasFallback title="Connecting canvas" />}>
                {() => (
                  <CanvasFlow roomId={roomId} templateImport={templateImport} />
                )}
              </ClientSideSuspense>
            </LiveblocksErrorGate>
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  );
}
