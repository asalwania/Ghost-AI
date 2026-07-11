# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Complete

## Current Goal

- None.

## Completed

- Added shadcn/ui foundation components: `Button`, `Card`, `Dialog`, `Input`, `Tabs`, `Textarea`, and `ScrollArea`.
- Added `lib/utils.ts` with a reusable `cn()` helper.
- Added `lucide-react` and the shadcn-style project configuration.
- Updated the root layout and global CSS for the dark theme tokens and font setup.
- Added `components/editor/editor-navbar.tsx` with a fixed-height top bar and sidebar toggle.
- Added `components/editor/project-sidebar.tsx` with floating slide-in behavior, tabs, empty states, and a `New Project` button.
- Wired the home route to render the editor chrome with local sidebar toggle state.
- Added Clerk auth integration with provider setup, `proxy.ts` route protection, `/` redirect handling, `/editor` workspace routing, sign-in/sign-up pages, and the editor `UserButton`.
- Refined the auth screen into a strict split-panel layout with a differentiated left panel, updated Clerk theming, and Geist-based typography.
- Fixed the auth screen responsive breakpoint so the left/right panels render as a 50/50 split at tablet and desktop widths, while narrow layouts show the form without stacking the marketing panel above it.
- Restyled the auth experience to more closely match the reference screenshot with an equal split layout, a stronger left-side accent band, updated sign-in/sign-up copy, and explicit Geist fallbacks in the Clerk appearance config.
- Lowered the auth split-panel breakpoint so the left marketing section appears on more browser widths while still collapsing to the form-only layout on small screens.
- Added an elevated card shell around the Clerk sign-in/sign-up area so the right panel remains visibly present even before the client form fully hydrates.
- Tightened the left auth panel spacing to better match the reference screenshot, with the logo pinned higher and the headline/features composition shifted into the same vertical rhythm.
- Centralized the Clerk post-auth redirect target and applied it to sign-in/sign-up provider and page flows so completed auth lands on `/editor`; refined the editor `UserButton` avatar styling in the top-right navbar.
- Hardened Clerk redirects to only treat active authenticated sessions as ready for `/editor`, reducing redirect churn during pending or unsettled sessions.
- Passed the local sign-in and sign-up URLs into `clerkMiddleware` so protected-route redirects use the in-app auth pages instead of Clerk's hosted accounts domain.
- Added visible Clerk loading and failed-auth states around the sign-in and sign-up forms so blocked Clerk browser scripts no longer leave an empty auth panel.
- Fixed Clerk auth and user-menu button contrast by restoring a readable neutral color source and explicitly styling social, footer, navbar, and sign-out action text with app theme tokens.
- Fixed the auth shell viewport sizing so the sign-in/sign-up main screen does not create page-level vertical or horizontal scrollbars.
- Added the `/editor` home prompt with a `New project` action wired to the create project dialog.
- Added local mock project dialog state, create/rename/delete dialogs, live slug previews, and mock project mutations without API calls or persistence.
- Added owned-project rename/delete sidebar actions, hid actions for shared projects, and added the mobile sidebar backdrop close behavior.
- Added the `Project` and `ProjectCollaborator` Prisma models in `prisma/models/project.prisma` (owner ID, status enum, `canvasJsonPath`, timestamps, cascade-deleted collaborators with a project/email unique constraint) and generated/applied the `add_project_models` migration.
- Added `lib/prisma.ts` as a cached global Prisma Client singleton that branches on `DATABASE_URL`: an Accelerate URL (`prisma+postgres://`) uses `accelerateUrl`, otherwise a direct `@prisma/adapter-pg` adapter is used.
- Added `lib/auth.ts` with a `getAuthUserId()` helper that reads the Clerk session and returns the user ID only when authenticated.
- Added the project REST API: `GET /api/projects` (list projects owned by the current user), `POST /api/projects` (create, defaulting a missing/blank name to "Untitled Project", using the schema's `cuid()` ID default), `PATCH /api/projects/[projectId]` (rename, owner-only), and `DELETE /api/projects/[projectId]` (delete, owner-only). All four return `401` when unauthenticated; rename/delete return `403` for non-owners and `404` when the project doesn't exist. No UI wiring yet.
- Updated `proxy.ts` so `/api(.*)` requests skip the middleware's `auth.protect()`/redirect logic entirely: Clerk's `protect()` returns `404` (not `401`) for unauthenticated non-document requests, which conflicted with the API spec's `401` requirement, so API routes now enforce their own auth via `getAuthUserId()` and return the correct status codes.
- Wired the editor home sidebar and dialogs to the real project API: converted `/editor` to a React Server Component that fetches owned and shared projects server-side via `lib/projects.ts`; created `hooks/use-project-actions.ts` with real `POST`/`PATCH`/`DELETE` API calls; create navigates to the new workspace, rename refreshes the RSC tree, delete optimistically removes from local state then refreshes; updated `GET /api/projects` to also return shared projects by resolving the user's Clerk primary email against `ProjectCollaborator` records.
- Built the `/editor/[roomId]` workspace shell (feature 08): created `lib/project-access.ts` with `getCurrentIdentity()` and `getProjectIfAccessible()` helpers; created `components/editor/access-denied.tsx` (centered lock icon, message, back link); created `components/editor/workspace-shell.tsx` (client shell with workspace navbar showing project name, share button, and AI sidebar toggle, left `ProjectSidebar` with active-room highlight, canvas placeholder, slide-over AI panel placeholder); created `app/editor/[roomId]/page.tsx` as a server component that redirects unauthenticated users to `/sign-in`, shows `AccessDenied` for missing or unauthorized projects, then renders the workspace; updated `ProjectSidebar` to accept `activeProjectId` and highlight the active row with brand tokens, and changed project rows to `<Link>` elements for direct workspace navigation.
- Implemented the Share dialog (feature 09): added `GET /api/projects/[projectId]/collaborators` (list collaborators enriched with Clerk display name and avatar, accessible to owner and collaborators), `POST /api/projects/[projectId]/collaborators` (invite by email, owner-only, validates email format, prevents self-invite, returns 409 on duplicate), and `DELETE /api/projects/[projectId]/collaborators/[email]` (remove by email, owner-only); created `hooks/use-share-dialog.ts` (open/close state, fetch-on-open, invite, remove, copy-link with 2s "Copied!" feedback); created `components/editor/share-dialog.tsx` (Clerk avatar with initials fallback, invite input for owners, remove button per row for owners, empty state, scroll area, copy-link button in header); wired Share button in `WorkspaceShell` and passed `isOwner` from the workspace server page.

## In Progress

- None.

## Next Up

- Define the next feature unit here.

## Open Questions

- None.

## Architecture Decisions

- API routes own their own Clerk auth checks (`lib/auth.ts`) instead of relying on `proxy.ts` middleware protection, so they can return spec-correct `401`/`403` JSON responses instead of Clerk's default `404`-for-unauthenticated-API-requests behavior. `proxy.ts` now treats `/api(.*)` as exempt from its `auth.protect()`/redirect logic.

## Session Notes

- `npm run lint` and `npm run build` both pass after the design-system foundation changes.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the editor chrome implementation.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the Clerk auth integration.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the auth screen refresh.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the auth split-layout breakpoint fix.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the screenshot-driven auth layout refresh and font alignment.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the Clerk redirect and editor user avatar update.
- Clerk clock-skew diagnosis: attached logs showed the local app clock about 100 seconds behind the token `nbf`; Windows denied `w32tm /resync /rediscover` with `0x80070005`, so the OS clock still needs an elevated sync outside this shell.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the active-session redirect hardening.
- Verified RSC navigation to `/editor` now redirects signed-out users to `/sign-in?redirect_url=...` after wiring auth URLs into `clerkMiddleware`.
- `npm.cmd run lint` and `npm.cmd run build` both pass after the `clerkMiddleware` auth URL fix.
- Auth blank-panel diagnosis: local app chunks load, but the Clerk browser bundles at `willing-lab-48.clerk.accounts.dev` fail to connect from this environment; the app now surfaces that state instead of rendering an empty panel.
- `npm.cmd run lint` and `npm.cmd run build` both pass after adding the Clerk loading/failed auth panel states.
- `npm.cmd run lint` and `npm.cmd run build` both pass after fixing faded Clerk button text and user-menu action colors.
- `npm.cmd run lint` and `npm.cmd run build` both pass after removing the auth screen scrollbars.
- `npm.cmd run build` and `npm.cmd run lint` both pass after the project dialogs and sidebar action implementation.
- `npx prisma migrate dev --name add_project_models` and `npx prisma generate` both ran successfully against the configured `DATABASE_URL`; `npm run lint` and `npm run build` both pass after adding the Prisma models and client singleton.
- `npm.cmd run lint` and `npm.cmd run build` both pass after adding the project REST API routes and the `proxy.ts` API-route auth exemption.
- `npm.cmd run build` passes after wiring the editor home to the real project API (feature 07): RSC page, `useProjectActions` hook, `lib/projects.ts` data helper, updated `GET /api/projects` with shared-project support.
- Fixed `EditorProject` import in `hooks/use-project-actions.ts` (the type was re-exported but not imported for internal use — added explicit `import type` to resolve the TS error).
- `npm.cmd run build` passes after the `/editor/[roomId]` workspace shell (feature 08): `lib/project-access.ts`, `components/editor/access-denied.tsx`, `components/editor/workspace-shell.tsx`, `app/editor/[roomId]/page.tsx`, updated `components/editor/project-sidebar.tsx` with active-room highlighting and `<Link>` rows.
- `npm.cmd run build` passes after the Share dialog (feature 09): `app/api/projects/[projectId]/collaborators/route.ts`, `app/api/projects/[projectId]/collaborators/[email]/route.ts`, `hooks/use-share-dialog.ts`, `components/editor/share-dialog.tsx`, updated `components/editor/workspace-shell.tsx` and `app/editor/[roomId]/page.tsx`.
