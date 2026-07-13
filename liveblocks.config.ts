import type { CanvasFlowStorage } from "@/types/canvas";
import type { AiStatusFeedMessage } from "@/types/tasks";

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

    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    FeedMetadata: Record<string, string | string[]>;
    FeedMessageData: AiStatusFeedMessage;
    RoomInfo: Record<string, never>;
  }
}

export {};
