# Timesheet Data Synchronization Fix

## Problem

When user "raj" enters data from one device (India), it's visible in Firebase, but when logging in from another device (Canada) with the same credentials, the data isn't visible on the website and disappears from Firebase after refresh.

## Root Cause

The issue was that when logging in from a different device, the Firestore fetch might fail or take time, causing the component to set default rows (empty data) and immediately save those defaults to Firestore, overwriting the existing data.

## Solution Implemented

- Added a `dataLoaded` state to track when data has been successfully fetched from Firestore or localStorage.
- Modified the save logic to only save to Firestore after data has been loaded (`dataLoaded === true`).
- This prevents saving default/empty rows to Firestore when data hasn't been loaded yet.

## Files Modified

- [x] `timesheet-app/src/pages/Admin/Timesheet/index.tsx`
  - Added `dataLoaded` state
  - Modified fetchRows useEffect to set `dataLoaded = false` at start and `true` at end
  - Modified save useEffect to check `dataLoaded` before saving to Firestore
- [x] `timesheet-app/src/pages/User/Timesheet/index.tsx`
  - Same changes as Admin Timesheet

## Testing

- Test logging in from different devices with the same user account
- Verify data persists across devices and refreshes
- Ensure no data loss occurs during login or refresh
