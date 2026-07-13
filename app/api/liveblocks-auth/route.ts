import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import {
  LIVEBLOCKS_ROOM_ACCESS,
  ensureAiStatusFeed,
  ensureProjectRoom,
  getCursorColorForUserId,
  getLiveblocksClient,
  type LiveblocksUserInfo,
} from "@/lib/liveblocks";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

interface LiveblocksAuthBody {
  room?: unknown;
  roomId?: unknown;
}

type ClerkUser = Awaited<
  ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>
>;

function resolveRequestedRoomId(body: LiveblocksAuthBody | null) {
  const roomId = typeof body?.room === "string" ? body.room : body?.roomId;

  return typeof roomId === "string" ? roomId.trim() : "";
}

function getDisplayName(user: ClerkUser) {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    user.username ||
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    "Ghost AI user"
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LiveblocksAuthBody | null;
  const roomId = resolveRequestedRoomId(body);

  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(identity.userId);
  const userInfo: LiveblocksUserInfo = {
    displayName: getDisplayName(user),
    avatarUrl: user.imageUrl || null,
    cursorColor: getCursorColorForUserId(identity.userId),
  };

  try {
    await ensureProjectRoom(project.id, project.name);
    await ensureAiStatusFeed(project.id);

    const session = getLiveblocksClient().prepareSession(identity.userId, {
      userInfo,
    });
    session.allow(project.id, LIVEBLOCKS_ROOM_ACCESS);

    const { status, body: responseBody } = await session.authorize();

    return new Response(responseBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Liveblocks authentication failed", error);
    return NextResponse.json(
      { error: "Liveblocks authentication failed" },
      { status: 500 }
    );
  }
}
