# User Side WeeklyTab Data Display Fix

## Steps:
- [ ] 1. Create TODO.md with plan steps from analysis.
- [x] 2. Add debug console.logs in User/WeeklyTab.tsx fetchTimesheetData: log userId, weekKey, localStorage rows.length, Firestore rows.length, tableRows.length.
- [x] 3. Add loading state/spinner while fetching data.
- [x] 4. Edit timesheet-app/src/pages/User/Reports/WeeklyTab.tsx with changes.
Fixed WeekNavigation prop error (removed invalid localStorageKey).
- [ ] 5. Test: Login as user, navigate to User > Reports > Weekly tab, check browser console for logs and verify table displays data if exists.
- [ ] 6. If no data (rows=0): Data missing in Firestore/local - enter via User/Timesheet tab first.
- [ ] 7. Update TODO.md progress.
- [ ] 8. attempt_completion once verified.

**Status:** Fixed continuous loading by adding setIsLoading(false) in fetch func. Logs confirm data fetched/processed (3 rows), table now shows after fix. Test again.

