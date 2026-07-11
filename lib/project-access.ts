/**
 * Project access helpers.
 *
 * Centralises the two questions every protected workspace route must answer:
 *   1. Who is the current user?
 *   2. Do they have access to this project?
 *
 * Intentionally server-only — imported only from Server Components and route
 * handlers, never from client modules.
 */

import { clerkClient } from "@clerk/nextjs/server";

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  primaryEmail: string | null;
}

/**
 * Returns the Clerk userId and primary email for the currently authenticated
 * user, or null when the request is unauthenticated.
 */
export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? null;

  return { userId, primaryEmail };
}

/**
 * Checks whether the given user has access to a project.
 *
 * A user has access when they are:
 *   - the project owner, OR
 *   - listed as a collaborator (matched by primary email)
 *
 * Returns the project record when access is granted, or null when the project
 * does not exist or the user is not a member.
 */
export async function getProjectIfAccessible(
  projectId: string,
  identity: CurrentIdentity
): Promise<{ id: string; name: string; ownerId: string } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: identity.primaryEmail
        ? { where: { email: identity.primaryEmail }, select: { id: true } }
        : false,
    },
  });

  if (!project) return null;

  const isOwner = project.ownerId === identity.userId;
  const isCollaborator =
    Array.isArray(project.collaborators) && project.collaborators.length > 0;

  if (!isOwner && !isCollaborator) return null;

  return { id: project.id, name: project.name, ownerId: project.ownerId };
}
