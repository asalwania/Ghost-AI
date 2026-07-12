"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import {
  Component,
  type DragEvent as ReactDragEvent,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasShapeFrame } from "@/components/editor/canvas-shape";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
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

function CanvasFlowInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: INITIAL_NODES },
    edges: { initial: INITIAL_EDGES },
  });
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  const nodeIdCounter = useRef(0);
  const [dragPreview, setDragPreview] =
    useState<ShapeDragPreviewState | null>(null);

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

  return (
    <div className="relative h-full w-full">
      <ReactFlow<CanvasNode, CanvasEdge>
        className="ghost-canvas h-full w-full bg-base"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        nodeTypes={CANVAS_NODE_TYPES}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="var(--border-subtle)"
        />
        <MiniMap<CanvasNode>
          pannable
          zoomable
          bgColor="var(--bg-elevated)"
          maskColor="color-mix(in srgb, var(--bg-base) 76%, transparent)"
          nodeColor={(node) => node.data.color.background}
          nodeStrokeColor={(node) => node.data.color.text}
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
