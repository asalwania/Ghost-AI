The database schema is ready. Build the backend project API for routes only.

## Routes

Create REST endpoints for:

- GET `/api/projects`, list current user projects
- POST `/api/projects`, create projects
- PATCH `/api/projects/[projectid]`, rename project
- DELETE `/api/projects/[projectid]`, delete project

## Rules

Use authenticated clerk user ID as `ownerId`.

When creating: 
- default missing project name to Untitled Project. 
- use the schema's existing ID strategy. Do not add sequential IDs 

## Security:

- Unauthenticated request: return `401`. 
- Only the project owner can rename or delete. 
- Non-owner mutation: return `403` 

Keep this backend only. Do not wire the UI yet.

## Check when Done
- A route exists for /list/create/rename/delete.
- Owner checks are enforced for rename/delete.
- `401` and `403` responses are handled correctly.
- `npm run build` passes.