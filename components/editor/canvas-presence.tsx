"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react";
import { useViewport, ViewportPortal } from "@xyflow/react";

import { cn } from "@/lib/utils";

const MAX_VISIBLE_COLLABORATORS = 5;
const AVATAR_CLASS =
  "h-9 w-9 rounded-full border border-base shadow-[0_0_0_1px_var(--border-subtle)]";

interface CollaboratorPresence {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CursorPresence extends CollaboratorPresence {
  cursor: { x: number; y: number } | null;
  cursorColor: string;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? "" : "";

  return `${first}${last}`.toUpperCase();
}

function CollaboratorAvatar({
  collaborator,
  className,
}: {
  collaborator: CollaboratorPresence;
  className?: string;
}) {
  const initials = getInitials(collaborator.displayName);

  return (
    <div
      className={cn(
        AVATAR_CLASS,
        "flex shrink-0 items-center justify-center overflow-hidden bg-elevated text-xs font-semibold text-copy-secondary",
        className
      )}
      title={collaborator.displayName}
      aria-label={collaborator.displayName}
    >
      {collaborator.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collaborator.avatarUrl}
          alt={collaborator.displayName}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
}

export function CanvasPresenceOverlay() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const collaborators = useOthersMapped(
    (other): CollaboratorPresence => ({
      id: other.id,
      displayName: other.info.displayName,
      avatarUrl: other.info.avatarUrl,
    }),
    shallow
  )
    .filter(([, collaborator]) => collaborator.id !== currentUserId)
    .map(([connectionId, collaborator]) => ({
      connectionId,
      ...collaborator,
    }));
  const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_COLLABORATORS);
  const overflowCount = collaborators.length - visibleCollaborators.length;

  return (
    <div
      className="nodrag nopan nowheel absolute right-6 top-4 z-20 flex items-center rounded-full border border-surface-border bg-surface/90 px-1.5 py-1.5 shadow-lg backdrop-blur-md"
      aria-label="Room participants"
    >
      {visibleCollaborators.length > 0 ? (
        <>
          <div className="flex -space-x-2" aria-label="Collaborators">
            {visibleCollaborators.map((collaborator) => (
              <CollaboratorAvatar
                key={collaborator.connectionId}
                collaborator={collaborator}
              />
            ))}
            {overflowCount > 0 ? (
              <div
                className={cn(
                  AVATAR_CLASS,
                  "flex shrink-0 items-center justify-center bg-subtle px-2 text-xs font-semibold text-copy-primary"
                )}
                aria-label={`${overflowCount} more collaborators`}
                title={`${overflowCount} more collaborators`}
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <div className="mx-2 h-6 w-px bg-surface-border" aria-hidden />
        </>
      ) : null}

      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox:
              "h-9 w-9 border border-surface-border shadow-[0_0_0_1px_var(--border-subtle)]",
            userButtonTrigger:
              "rounded-xl focus:shadow-[0_0_0_3px_var(--accent-primary-dim)]",
            userButtonPopoverCard: {
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            },
            userButtonPopoverActionButton: {
              color: "var(--text-primary)",
              fontWeight: 500,
            },
            userButtonPopoverActionButtonIcon: {
              color: "var(--text-secondary)",
            },
            userButtonPopoverFooterPagesLink: {
              color: "var(--text-muted)",
            },
          },
        }}
        showName={false}
      />
    </div>
  );
}

function LiveCursor({ participant }: { participant: CursorPresence }) {
  const { zoom } = useViewport();

  if (!participant.cursor) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-30 flex items-start gap-1"
      style={{
        transform: `translate(${participant.cursor.x}px, ${participant.cursor.y}px) scale(${1 / zoom})`,
        transformOrigin: "0 0",
      }}
    >
      <svg
        viewBox="0 0 18 18"
        className="-ml-1 -mt-1 h-5 w-5 drop-shadow"
        style={{ color: participant.cursorColor }}
        aria-hidden
      >
        <path
          d="M2.5 2.5 15 7.45l-5.35 1.8-2.2 5.25L2.5 2.5Z"
          fill="currentColor"
          stroke="var(--bg-base)"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
      <span
        className="mt-3 max-w-40 truncate rounded-full px-2 py-0.5 text-xs font-semibold text-brand-foreground shadow-lg"
        style={{ backgroundColor: participant.cursorColor }}
      >
        {participant.displayName}
      </span>
    </div>
  );
}

export function LiveCursorLayer() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const participants = useOthersMapped(
    (other): CursorPresence => ({
      id: other.id,
      displayName: other.info.displayName,
      avatarUrl: other.info.avatarUrl,
      cursor: other.presence.cursor,
      cursorColor: other.info.cursorColor,
    }),
    shallow
  ).filter(
    ([, participant]) =>
      participant.id !== currentUserId && participant.cursor !== null
  );

  return (
    <ViewportPortal>
      {participants.map(([connectionId, participant]) => (
        <LiveCursor key={connectionId} participant={participant} />
      ))}
    </ViewportPortal>
  );
}
