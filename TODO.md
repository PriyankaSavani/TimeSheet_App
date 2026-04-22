# Timesheet Data Persistence Fix - TODO

## Plan Steps:
- [ ] Step 1: Remove localStorage.removeItem() calls from User/Timesheet/index.tsx useEffect
- [ ] Step 2: Update load logic to prioritize localStorage first, then merge Firestore
- [ ] Step 3: Apply same changes to Admin/Timesheet/index.tsx
- [ ] Step 4: Test week navigation (enter data → nav away → back → verify persistence)
- [ ] Step 5: Verify Firestore sync (manual check or console logs)
- [ ] Complete: attempt_completion

**Progress:** Starting Step 1...

