"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useErrorListener,
  useRedo,
  useUndo,
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
  type EdgeTypes,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Maximize2, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import {
  Component,
  type DragEvent as ReactDragEvent,
  type ErrorInfo,
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
import { CanvasShapeFrame } from "@/components/editor/canvas-shape";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  CANVAS_VIEWPORT_ANIMATION,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";
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

interface CanvasRoomProps {
  roomId: string;
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

function CanvasFlowInner() {
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
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const nodeIdCounter = useRef(0);
  const [dragPreview, setDragPreview] =
    useState<ShapeDragPreviewState | null>(null);
  const canvasEdges = useMemo(
    () => edges.map((edge) => normalizeCanvasEdge(edge)),
    [edges]
  );

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
        <ShapePanel
          onShapeDragStart={handleShapeDragStart}
          onShapeDrag={handleShapeDragMove}
          onShapeDragEnd={clearShapeDragPreview}
        />
      </ReactFlow>
      {dragPreview ? <ShapeDragPreview dragPreview={dragPreview} /> : null}
    </div>
  );
}

function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <div className="h-full w-full">
      <CanvasErrorBoundary>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <LiveblocksErrorGate>
              <ClientSideSuspense fallback={<CanvasFallback title="Connecting canvas" />}>
                {() => <CanvasFlow />}
              </ClientSideSuspense>
            </LiveblocksErrorGate>
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  );
}
