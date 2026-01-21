# TODO: Add Week Navigation Filter to Weekly Tab in Reports (Admin and User)

## Steps to Complete:
- [x] Edit Admin WeeklyTab (timesheet-app/src/pages/Admin/Reports/WeeklyTab.tsx):
  - Add state for weekOffset, initialized from localStorage ('weeklyReportWeekOffset') or 0
  - Update useTimesheetCalculations to use dynamic weekOffset
  - Modify data fetching useEffect to depend on weekOffset and use it in calculations
  - Import WeekNavigation component
  - Add WeekNavigation to UI above the table
- [x] Edit User WeeklyTab (timesheet-app/src/pages/User/Reports/WeeklyTab.tsx):
  - Add state for weekOffset, initialized from localStorage ('weeklyReportWeekOffset') or 0
  - Update useTimesheetCalculations to use dynamic weekOffset
  - Modify data fetching useEffect to depend on weekOffset and use it in calculations
  - Import WeekNavigation component
  - Add WeekNavigation to UI above the table
- [x] Skip testing as per user request

# TODO: Add Project Name as First Column in Weekly Tab Reports

## Steps to Complete:
- [ ] Update TaskData interface to include project field in both WeeklyTab components
- [ ] Modify data processing logic to group by project and task instead of just task
- [ ] Update table headers to include "Project Name" as first column
- [ ] Update table body to display project name in first column
- [ ] Update export data (Excel and PDF) to include project name column
