We need the base chrome component that frames every editor screen, the top navbar, and the left sidebar shell. These will be reused and extended in every chapter that follows. 



### Editor Navebar

Create `components/editor/editor-navbar.tsx`

Requirements:
- Fixed height Top navbar.
- Left, center, and right sections.
- Left section contains sidebar toggle button.
- Use `PaneLeftOpen` / `PaneLeftClose` icons based on sidebar state.
- Right section stays empty for now.
- Dark background with double bottom border.




### Project Sidebar

Create `components/editor/project-sidebar.tsx`

Requirements:
- Sidebar should float above the editor canvas.
- Opening it should not push page content.
- Slide in from the left.
- Accept `isOpen` prop.
- Headers with `Projects` title + close button.
- Shadcn tabs: My project, Shared.
- Both tabs should show empty placeholder state.
- Full-width `New Project` button at the bottom with plus icon.



### Dialog Pattern

Use the existing color token from `global.css` for dialog styling. 


Support:
- Title
- Description
- Footer Actions
Do not build actual dialog yet.




### Check when done

- new components and compile without TypeScript errors
- no lint errors
- dialog pattern is ready for future use
