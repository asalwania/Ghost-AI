import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZE_BY_SHAPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
  type CanvasNodeSize,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface TemplateNodeInput {
  id: string;
  label: string;
  shape: CanvasNodeShape;
  color?: CanvasNodeColor;
  position: {
    x: number;
    y: number;
  };
  size?: CanvasNodeSize;
}

const TEMPLATE_EDGE_INTERACTION_WIDTH = 24;

function templateNode({
  id,
  label,
  shape,
  color = DEFAULT_NODE_COLOR,
  position,
  size = DEFAULT_NODE_SIZE_BY_SHAPE[shape],
}: TemplateNodeInput): CanvasNode {
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position,
    data: {
      label,
      color,
      shape,
    },
    style: {
      width: size.width,
      height: size.height,
    },
  };
}

function templateEdge(
  id: string,
  source: string,
  target: string,
  label = ""
): CanvasEdge {
  return {
    id,
    source,
    target,
    type: CANVAS_EDGE_TYPE,
    data: { label },
    interactionWidth: TEMPLATE_EDGE_INTERACTION_WIDTH,
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-commerce",
    name: "Commerce microservices",
    description:
      "API gateway, domain services, async events, cache, and relational storage for a commerce platform.",
    nodes: [
      templateNode({
        id: "ms-web",
        label: "Web app",
        shape: "rectangle",
        color: NODE_COLORS[1],
        position: { x: -420, y: -40 },
      }),
      templateNode({
        id: "ms-gateway",
        label: "API gateway",
        shape: "hexagon",
        color: NODE_COLORS[7],
        position: { x: -180, y: -40 },
      }),
      templateNode({
        id: "ms-auth",
        label: "Auth service",
        shape: "pill",
        color: NODE_COLORS[2],
        position: { x: 80, y: -180 },
      }),
      templateNode({
        id: "ms-orders",
        label: "Orders service",
        shape: "pill",
        color: NODE_COLORS[3],
        position: { x: 80, y: -40 },
      }),
      templateNode({
        id: "ms-payments",
        label: "Payments service",
        shape: "pill",
        color: NODE_COLORS[5],
        position: { x: 80, y: 100 },
      }),
      templateNode({
        id: "ms-events",
        label: "Event bus",
        shape: "diamond",
        color: NODE_COLORS[4],
        position: { x: 340, y: -74 },
      }),
      templateNode({
        id: "ms-cache",
        label: "Cache",
        shape: "cylinder",
        color: NODE_COLORS[6],
        position: { x: 336, y: -220 },
      }),
      templateNode({
        id: "ms-db",
        label: "Postgres",
        shape: "cylinder",
        color: NODE_COLORS[1],
        position: { x: 338, y: 136 },
      }),
    ],
    edges: [
      templateEdge("ms-web-gateway", "ms-web", "ms-gateway", "HTTPS"),
      templateEdge("ms-gateway-auth", "ms-gateway", "ms-auth", "tokens"),
      templateEdge("ms-gateway-orders", "ms-gateway", "ms-orders", "REST"),
      templateEdge("ms-gateway-payments", "ms-gateway", "ms-payments", "REST"),
      templateEdge("ms-auth-cache", "ms-auth", "ms-cache", "sessions"),
      templateEdge("ms-orders-db", "ms-orders", "ms-db", "orders"),
      templateEdge("ms-payments-db", "ms-payments", "ms-db", "ledger"),
      templateEdge("ms-orders-events", "ms-orders", "ms-events", "publish"),
      templateEdge("ms-payments-events", "ms-payments", "ms-events", "publish"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD pipeline",
    description:
      "Source control through tests, artifact publishing, staged deployment, approval, and production rollout.",
    nodes: [
      templateNode({
        id: "cicd-repo",
        label: "Git repo",
        shape: "hexagon",
        color: NODE_COLORS[1],
        position: { x: -450, y: -40 },
      }),
      templateNode({
        id: "cicd-runner",
        label: "CI runner",
        shape: "pill",
        color: NODE_COLORS[7],
        position: { x: -210, y: -40 },
      }),
      templateNode({
        id: "cicd-tests",
        label: "Test suite",
        shape: "diamond",
        color: NODE_COLORS[3],
        position: { x: 20, y: -78 },
      }),
      templateNode({
        id: "cicd-registry",
        label: "Artifact registry",
        shape: "cylinder",
        color: NODE_COLORS[2],
        position: { x: 280, y: -170 },
      }),
      templateNode({
        id: "cicd-staging",
        label: "Staging",
        shape: "rectangle",
        color: NODE_COLORS[6],
        position: { x: 280, y: 20 },
      }),
      templateNode({
        id: "cicd-approval",
        label: "Approval gate",
        shape: "diamond",
        color: NODE_COLORS[4],
        position: { x: 540, y: -78 },
      }),
      templateNode({
        id: "cicd-prod",
        label: "Production",
        shape: "rectangle",
        color: NODE_COLORS[5],
        position: { x: 800, y: -40 },
      }),
      templateNode({
        id: "cicd-monitoring",
        label: "Monitoring",
        shape: "circle",
        color: NODE_COLORS[7],
        position: { x: 826, y: 150 },
      }),
    ],
    edges: [
      templateEdge("cicd-repo-runner", "cicd-repo", "cicd-runner", "push"),
      templateEdge("cicd-runner-tests", "cicd-runner", "cicd-tests", "build"),
      templateEdge(
        "cicd-tests-registry",
        "cicd-tests",
        "cicd-registry",
        "package"
      ),
      templateEdge("cicd-tests-staging", "cicd-tests", "cicd-staging", "deploy"),
      templateEdge(
        "cicd-staging-approval",
        "cicd-staging",
        "cicd-approval",
        "verify"
      ),
      templateEdge(
        "cicd-approval-prod",
        "cicd-approval",
        "cicd-prod",
        "promote"
      ),
      templateEdge(
        "cicd-prod-monitoring",
        "cicd-prod",
        "cicd-monitoring",
        "metrics"
      ),
    ],
  },
  {
    id: "event-driven-platform",
    name: "Event-driven platform",
    description:
      "Ingestion, topic fanout, stream processing, workers, analytics storage, and audit trail.",
    nodes: [
      templateNode({
        id: "ed-client",
        label: "Client apps",
        shape: "rectangle",
        color: NODE_COLORS[1],
        position: { x: -420, y: -40 },
      }),
      templateNode({
        id: "ed-ingest",
        label: "Ingestion API",
        shape: "hexagon",
        color: NODE_COLORS[7],
        position: { x: -170, y: -40 },
      }),
      templateNode({
        id: "ed-topic",
        label: "Event topic",
        shape: "diamond",
        color: NODE_COLORS[4],
        position: { x: 90, y: -74 },
      }),
      templateNode({
        id: "ed-processor",
        label: "Stream processor",
        shape: "pill",
        color: NODE_COLORS[3],
        position: { x: 360, y: -170 },
      }),
      templateNode({
        id: "ed-worker",
        label: "Async worker",
        shape: "pill",
        color: NODE_COLORS[5],
        position: { x: 360, y: 20 },
      }),
      templateNode({
        id: "ed-analytics",
        label: "Analytics DB",
        shape: "cylinder",
        color: NODE_COLORS[2],
        position: { x: 640, y: -190 },
      }),
      templateNode({
        id: "ed-notify",
        label: "Notifications",
        shape: "circle",
        color: NODE_COLORS[6],
        position: { x: 664, y: 40 },
      }),
      templateNode({
        id: "ed-audit",
        label: "Audit log",
        shape: "cylinder",
        color: NODE_COLORS[1],
        position: { x: 640, y: 190 },
      }),
    ],
    edges: [
      templateEdge("ed-client-ingest", "ed-client", "ed-ingest", "events"),
      templateEdge("ed-ingest-topic", "ed-ingest", "ed-topic", "publish"),
      templateEdge("ed-topic-processor", "ed-topic", "ed-processor", "consume"),
      templateEdge("ed-topic-worker", "ed-topic", "ed-worker", "consume"),
      templateEdge(
        "ed-processor-analytics",
        "ed-processor",
        "ed-analytics",
        "aggregate"
      ),
      templateEdge("ed-worker-notify", "ed-worker", "ed-notify", "dispatch"),
      templateEdge("ed-topic-audit", "ed-topic", "ed-audit", "archive"),
    ],
  },
];
