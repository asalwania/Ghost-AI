import type { CanvasFlowStorage } from "@/types/canvas";

export type AiStatusLevel = "info" | "success" | "error";
export type AiStatusPhase =
  | "start"
  | "processing"
  | "applying"
  | "complete"
  | "error";

export type AiStatusEvent = {
  type: "AI_STATUS";
  id: string;
  runId?: string;
  level: AiStatusLevel;
  phase: AiStatusPhase;
  message: string;
  createdAt: string;
};

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow?: CanvasFlowStorage;
    };

    UserMeta: {
      id: string;
      info: {
        displayName: string;
        avatarUrl: string | null;
        cursorColor: string;
      };
    };

    RoomEvent: AiStatusEvent;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
