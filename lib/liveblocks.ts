import {
  Liveblocks as LiveblocksNode,
  type RoomPermissions,
} from "@liveblocks/node";

export interface LiveblocksUserInfo {
  displayName: string;
  avatarUrl: string | null;
  cursorColor: string;
}

export const LIVEBLOCKS_ROOM_ACCESS = ["*:write"] satisfies RoomPermissions;

const CURSOR_COLOR_PALETTE = [
  "#00c8d4",
  "#8b82ff",
  "#34d399",
  "#fbbf24",
  "#ff4d4f",
  "#f75f8f",
  "#52a8ff",
  "#ff990a",
] as const;

declare global {
  var liveblocksGlobal: LiveblocksNode | undefined;
}

export function getCursorColorForUserId(userId: string) {
  let hash = 0;

  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return CURSOR_COLOR_PALETTE[hash % CURSOR_COLOR_PALETTE.length];
}

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required for Liveblocks auth.");
  }

  return new LiveblocksNode({ secret });
}

export function getLiveblocksClient() {
  const client = globalThis.liveblocksGlobal ?? createLiveblocksClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.liveblocksGlobal = client;
  }

  return client;
}

export async function ensureProjectRoom(roomId: string, projectName: string) {
  return getLiveblocksClient().getOrCreateRoom(roomId, {
    defaultAccesses: [],
    metadata: {
      projectId: roomId,
      projectName,
    },
  });
}
