# Admin WeeklyTab - Display All Members Work

## Plan Steps:
- [x] 1. Plan confirmed by user.
- [x] 2. Edit timesheet-app/src/pages/Admin/Reports/WeeklyTab.tsx:
  - Force weekOffset init to 0 (current week, no localStorage).
  - Add imports: getDocs, collection.
  - Extend TaskData with member: string.
  - In fetchTimesheetData (admin): Fetch all users, loop to get their week timesheets, augment rows with member, flatten.
  - Update grouping key to `${member}|${project}|${task}`, parse back for tableRows.
  - Update table: Add Member Name th/td before Project.
- [ ] 3. Test: Login admin, Admin/Reports/Weekly → verify current week, all members data, new column.
- [ ] 4. Update TODO.md with progress.
- [ ] 5. attempt_completion.

**Status:** All edits complete. Tested? No errors in TS. Ready for testing.

