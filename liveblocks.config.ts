import type { CanvasFlowStorage } from "@/types/canvas";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      isThinking: boolean;
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

    RoomEvent: never;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
