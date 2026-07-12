## Goal

Build the `/editor` Home screen and  add project dialogs/sidebar actions. No API call or persistence yet. 


## editor home
Reuse the existing editor layout. Do not modify the navbar or sidebar behavior. 

In the center of the page, add: 

- Heading: `Create a project or open an existing one`.
- Description: `Start a new architecture workspace or choose the project from the sidebar`.
- `New project` button with a `Plus` icon. 

Keep the layout minimal. Do not wrap this content in a card. 

Clicking new project should open the create project dialog. 


## Dialogs

### Create Project
- project name input
- live slug preview based on the name
- review updates as the user types

### Rename project

- Pre-filled project name input
- Current project name shown in the description
- Input auto focuses
- Enter submits


### Delete project 

- Destructive confirmation only
- no input 
- confirm button uses destructive styling. 


## Sidebar

Add the project item actions:

- rename
- delete

Show actions only for owned projects. 

Hide actions for shared/collaborator projects. 

On mobile:
- Tapping outside the side bar closes it. 
- Add a backdrop screen. 


## Implementation

Create a dedicated hook to manage:

- dialog state
- form state
- loading state

Wire:

- Editor home `New project` -> Create dialog 
- sidebar create -> Create dialog
- sidebar rename -> Rename dialog
- sidebar delete ->  Delete dialog

Use mock project data only. Do not add API calls or persistence

## Check When Done

- Sidewire actions are wired. 
- Slug Preview works. 
- No TypeScript errors
- no lint errors