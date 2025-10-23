# TODO: Fix Timesheet Data Persistence on Refresh

## Tasks
- [x] Update fetchRows to use per-user document (userId) instead of 'shared'
- [x] Update saveRows to use per-user document (userId) instead of 'shared'
- [x] Prevent saving empty rows array to avoid overwriting data
- [ ] Test data persistence across page refreshes for logged-in users
