# Timesheet Timezone Synchronization Fix

## Problem

When user "raj" enters data from one device (India), it's visible in Firebase, but when logging in from another device (Canada) with the same credentials, the data isn't visible on the website and disappears from Firebase after refresh.

## Root Cause

The `getWeekKey` function used local time zones to generate week keys for storing and retrieving timesheet data. Since India and Canada are in different time zones, the same week would generate different week keys (e.g., "2024-W15" in India vs "2024-W16" in Canada), causing data to be stored under different keys and not visible across locations.

## Solution Implemented

Modified the `getWeekKey` function in all relevant files to use UTC time instead of local time for consistent week key generation across timezones.

## Files Modified

- [x] `timesheet-app/src/pages/User/Timesheet/index.tsx`
  - Updated `getWeekKey` to use UTC methods (`getUTCFullYear`, `getUTCMonth`, etc.)
- [x] `timesheet-app/src/pages/Admin/Timesheet/index.tsx`
  - Updated `getWeekKey` to use UTC methods for consistency
- [x] `timesheet-app/src/pages/Admin/Dashboard/ProjectDetails.tsx`
  - Updated `getWeekKey` to use UTC methods for consistency

## Testing

- Test entering data from devices in different timezones with the same user account
- Verify data is visible and persists across devices and refreshes
- Ensure week navigation works correctly regardless of timezone
