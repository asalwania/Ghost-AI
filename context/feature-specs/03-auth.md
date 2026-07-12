Clerk is already installed and connected. Wire it into the Next.js app:  provider, auth pages, redirecta, route protection, and user menu.


### Design

Use clerk's `dark` theme from `clerk/ui/themes` as the base. 

Override clerk appearance variables using the app's existing CSS variables. Do not hardcode colors .


### Signin and signup pages: 
- large screen: simple 2-panel layout
- Left: compact logo, tagline, short text only, feature list
- Right: centered clerk form
- Small screen: form only 
- no gradients
- no oversized hero section
- no feature cards 
- no scroll heavy layouts 

Keep the layout minimal and professional


### Implementation
Wrap the root layout with `ClerkProvider` using Clerk's `dark` theme.

Create sign-in and sign-up pages using clerk component.

Use `proxy.ts` at the project root, not `middleware.ts`

Define public routes using the existing sign-in and sign-up ENV vars. Protect everything else by default.

Update `/`:

- Authenticate user, redirect to `/editor`.
- Unauthenticated user, redirect to `/sign-in`.


Add Clerk's built-in `UserButton` to the Editor navbar right section for profile settings and logout. 

Keep Clerk's default user menu and profile flow intact. Do not rebuild or heavily customize Clerk internals. 

Use existing Clerk env-vars. Do not rename or invent new ones

### Dependencies
install: @clerk/ui

### Check When done

- `proxy.ts` exists at the root. 
- All routes are protected except public auth paths. 
- Auth pages use CSS variables with no hard-coded colors. 
- Clerk provider wraps the route layout. 
- NPM run build passes 