/**
 * Pure, isomorphic helpers for converting raw project DB records into the
 * EditorProject shape consumed by the editor UI.
 *
 * This module intentionally has NO "use client" directive so that Server
 * Components (e.g. app/editor/page.tsx) can safely import and call these
 * functions during SSR.
 */

export interface EditorProject {
  id: string;
  name: string;
  slug: string;
  updatedLabel: string;
  ownership: "owned" | "shared";
}

function toSlug(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-project"
  );
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

function formatUpdatedLabel(updatedAt: Date): string {
  const now = Date.now();
  const diffMs = now - updatedAt.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 2) return "Just now";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function toEditorProject(raw: {
  id: string;
  name: string;
  updatedAt: Date | string;
  ownership: "owned" | "shared";
}): EditorProject {
  const updatedAt =
    raw.updatedAt instanceof Date ? raw.updatedAt : new Date(raw.updatedAt);
  return {
    id: raw.id,
    name: raw.name,
    slug: toSlug(raw.name),
    updatedLabel: formatUpdatedLabel(updatedAt),
    ownership: raw.ownership,
  };
}

/** Generates a URL-safe slug preview with a random suffix (client-safe). */
export function toSlugPreview(name: string): string {
  return `${toSlug(name)}-${shortSuffix()}`;
}
