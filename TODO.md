# Fix Data Sync Issue Across Devices

## Problem

When user "raj" enters data from one device (India), it's visible in Firebase, but when logging in from another device (Canada) with the same credentials, the data isn't visible on the website and disappears from Firebase after refresh.

## Root Cause

Firebase's offline persistence (enableIndexedDbPersistence) only allows persistence in one tab at a time. When logging in from another device, this conflicts with existing persistence, causing data sync issues and potential data loss.

## Solution

Remove offline persistence from Firebase config since the app already uses localStorage as fallback.

## Files to Modify

- [x] `timesheet-app/src/config/firebase.ts` - Remove enableIndexedDbPersistence

## Testing

- [ ] Test entering data from one device, then logging in from another device to verify data appears correctly.

# Add Real-Time Updates for Timesheets

## Requirements

- Add real-time listeners to both User and Admin timesheet components for immediate sync when data changes on other devices.
- Ensure previous weeks data access works with UTC keys.
- Test real-time sync across devices.

## Files to Modify

- [x] `timesheet-app/src/pages/User/Timesheet/index.tsx` - Add onSnapshot listener for real-time updates
- [x] `timesheet-app/src/pages/Admin/Timesheet/index.tsx` - Add onSnapshot listener for real-time updates

## Testing

- [ ] Test real-time sync: Enter data on one device, verify it appears immediately on another device
- [ ] Test previous weeks: Navigate to previous weeks and verify data loads correctly with UTC keys
- [ ] Verify no data loss or sync conflicts
