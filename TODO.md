# Realtime Timesheet Sync Fix

## Understanding
Current issue: LocalStorage caching + delayed/non-realtime Firestore sync causes deleted data to show on reload/mobile.

## Approved Plan
1. Make Firestore single source of truth via onSnapshot → SET rows.
2. All changes call updateRows → immediate setDoc.
3. Remove localStorage.

## Steps
- [ ] Step 1: Update both Timesheet index.tsx (realtime rows from onSnapshot, add updateRows).
- [ ] Step 2: Update DeleteAction.tsx both (use updateRows).
- [ ] Step 3: Update AddAction/Day/Project/Task to use updateRows.
- [ ] Step 4: Test cross-tab/device sync.
- [ ] Complete: attempt_completion

**Progress: Step 3 complete (add/delete/day edits realtime sync via Firestore)**

## Steps
- [x] Step 1: Update both Timesheet index.tsx ✅
- [x] Step 2: Update DeleteAction.tsx both ✅
- [x] Step 3: Update AddAction/Day ✅
- [ ] Step 4: Test realtime sync (add/delete from different tabs/devices → instant everywhere)



