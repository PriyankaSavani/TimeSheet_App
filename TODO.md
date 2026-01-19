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
