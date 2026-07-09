Prisma is already installed at the Project Data Models, Prisma Client Singleton, and First Migration.

## Models

Create `prisma/models/project.prisma`

Add `Project`:

- Owner ID mapped to clerk user 
- name
- Optional description
- Status enum: `DRAFT`, `ARCHIVED`
- `canvasJsonPath` for future canvas blob storage
- Timestamps
- Indexes on owner ID and creation date

Add `ProjectCollaborator`

- project relation with cascade delete
- project email creation timestamp 
- unique constraint on project/email 
- indexes on email and project/date 

Do not add extra fields unless required by Prisma.

## Prisma Client

Create `libs/prisma.ts as` a cached singleton. 

Branch by  `DATABASE_URL`: 
- if it starts with `prisma+postgres://` use Accelerate 
- otherwise, use direct `@prisma/adapter-pg` 

Cash the client on `global` in development for hot reloads 

## Migration

Run the migration and generate the client.

## Dependencies

Already installed:

- `prisma`
- `@prisma/client`
- `@prisma/adapter-pg`
- `pg`

### Check When Done

- Schema has both models with correct relation and indexes.
- `lib/prisma.ts` exports once cached Prisma instance. 
- Migrate runs successfully. 
- npm run build passes 