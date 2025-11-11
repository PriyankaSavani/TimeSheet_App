# TODO: Implement Multiple Employee Assignment with Checkboxes

## Tasks
- [x] Update Project interface in index.tsx to change assignEmployee from string to string[]
- [x] Update ProjectAddActionProps interface in ProjectAddAction.tsx to change assignEmployee from string to string[]
- [x] Modify ProjectAddAction.tsx: Replace select dropdown with checkboxes for multiple employee selection
- [x] Update validation schema in ProjectAddAction.tsx to handle array of employees
- [x] Update onSubmit in ProjectAddAction.tsx to pass selected employees as array
- [x] Update addProject function in index.tsx to accept string[] for assignEmployee
- [x] Update display in index.tsx table to show assignEmployee as comma-separated list
- [x] Update inline editing in index.tsx to use checkboxes or multi-select for assignEmployee
- [ ] Test the changes: Add a project with multiple employees, verify display and editing
