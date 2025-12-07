# Manual Testing Guide: Blueprint Detail Display Fix

## Issue Fixed
**Problem**: Blueprint details would not update when navigating between different blueprints. The component was using a route snapshot which only captures parameters once, causing stale data to be displayed when navigating from one blueprint to another.

**Solution**: Replaced route snapshot with Angular 20 input signal pattern, which properly handles route parameter changes and automatically triggers component updates.

## Testing Prerequisites
1. Application must be built and running: `npm start`
2. User must be logged in
3. At least 2 different blueprints must exist in the system

## Test Scenarios

### Test 1: Basic Blueprint Detail Load
**Objective**: Verify that blueprint details load correctly on initial navigation

**Steps**:
1. Navigate to blueprint list page (`/blueprint/list`)
2. Click on any blueprint to open its detail page
3. Observe the overview page loads

**Expected Results**:
- ✅ Blueprint name and description are displayed correctly
- ✅ Statistics show correct values (enabled modules, members count, dates)
- ✅ No error messages are displayed
- ✅ Loading spinner appears briefly then disappears

**Failure Indicators**:
- ❌ Error message "無效的藍圖 ID" appears
- ❌ Error message "找不到藍圖" appears
- ❌ Page shows 404 error
- ❌ Statistics show 0 or incorrect values

---

### Test 2: Navigation Between Different Blueprints (Critical Test)
**Objective**: Verify that blueprint details update when navigating between different blueprints

**Steps**:
1. Navigate to blueprint list page (`/blueprint/list`)
2. Click on Blueprint A to open its detail page
3. Note down Blueprint A's details (name, description, member count, etc.)
4. Navigate back to the list using browser back button or navigation
5. Click on Blueprint B (different from Blueprint A)
6. Observe the overview page

**Expected Results**:
- ✅ Blueprint B's name and description are displayed (NOT Blueprint A's)
- ✅ Statistics reflect Blueprint B's data (NOT Blueprint A's)
- ✅ Member list shows Blueprint B's members
- ✅ Financial data shows Blueprint B's financial information
- ✅ Activity timeline shows Blueprint B's activities
- ✅ Console log shows: `[BlueprintOverviewComponent] Blueprint ID changed: <Blueprint_B_ID>`

**Failure Indicators** (These were the bugs before the fix):
- ❌ Blueprint A's name still appears when viewing Blueprint B
- ❌ Statistics show Blueprint A's data
- ❌ Member list shows Blueprint A's members
- ❌ No console log about ID change
- ❌ Component appears frozen with old data

---

### Test 3: Direct URL Navigation
**Objective**: Verify that direct URL navigation works correctly

**Steps**:
1. Copy the URL of Blueprint A's detail page (e.g., `/blueprint/abc123/overview`)
2. Navigate to Blueprint list
3. Click on Blueprint B
4. Manually change the URL in the browser to Blueprint A's URL
5. Press Enter to navigate

**Expected Results**:
- ✅ Blueprint A's details load correctly
- ✅ All tabs show Blueprint A's data
- ✅ Console log shows ID change

---

### Test 4: Tab Navigation Within Blueprint
**Objective**: Verify that all tabs work correctly and maintain the correct blueprint context

**Steps**:
1. Navigate to a blueprint's overview page
2. Click through each tab: 概覽 (Overview), 任務管理 (Tasks), 成員管理 (Members), 財務 (Financial), 活動 (Activity)
3. For each tab, verify the content is relevant to the current blueprint

**Expected Results**:
- ✅ 概覽 tab shows blueprint details
- ✅ 任務管理 tab shows tasks for this blueprint (if enabled)
- ✅ 成員管理 tab shows members for this blueprint
- ✅ 財務 tab shows financial data for this blueprint
- ✅ 活動 tab shows activity logs for this blueprint
- ✅ All tabs load without errors

---

### Test 5: Quick Navigation Between Blueprints
**Objective**: Verify rapid navigation doesn't cause issues

**Steps**:
1. Navigate to Blueprint A's detail page
2. Quickly navigate to Blueprint B (within 1 second)
3. Quickly navigate to Blueprint C (within 1 second)
4. Wait for all loading to complete

**Expected Results**:
- ✅ Final displayed blueprint is Blueprint C
- ✅ No loading errors
- ✅ No race conditions (showing mixed data from different blueprints)
- ✅ All data belongs to Blueprint C

---

### Test 6: Navigation via Links in Blueprint Detail
**Objective**: Verify that navigation links within the blueprint detail page work correctly

**Steps**:
1. Navigate to Blueprint A's overview page
2. Click on "任務管理" quick navigation card (if tasks module is enabled)
3. Note the URL changes to `/blueprint/<id>/tasks`
4. Click browser back button to return to overview
5. Click on "成員管理" quick navigation card
6. Note the URL changes to `/blueprint/<id>/members`

**Expected Results**:
- ✅ All navigation links use the correct blueprint ID
- ✅ Tasks page loads correctly
- ✅ Members page loads correctly
- ✅ Financial pages load correctly
- ✅ Back button returns to correct blueprint's overview

---

### Test 7: Edit Blueprint and Refresh
**Objective**: Verify that editing a blueprint updates the view correctly

**Steps**:
1. Navigate to a blueprint's overview page
2. Click the "編輯" (Edit) button
3. Make a change (e.g., change the name or description)
4. Save the changes
5. Observe the overview page updates

**Expected Results**:
- ✅ Edit drawer closes
- ✅ Blueprint details update with new values
- ✅ No page reload required
- ✅ Changes persist on tab navigation

---

### Test 8: Error Handling
**Objective**: Verify that error states are handled gracefully

**Steps**:
1. Navigate to a blueprint detail page with a valid ID
2. In the browser console, note the blueprint ID
3. Manually change the URL to an invalid blueprint ID (e.g., `/blueprint/invalid-id-12345/overview`)
4. Press Enter

**Expected Results**:
- ✅ Error result page is displayed
- ✅ Error message states "找不到藍圖" (Blueprint not found)
- ✅ "返回列表" (Back to list) button is available
- ✅ No console errors related to undefined/null data

---

## Console Log Verification

When the fix is working correctly, you should see console logs like:
```
[BlueprintOverviewComponent] Blueprint ID changed: abc123
[BlueprintOverviewComponent] Failed to load blueprint: <error details>
```

The first log confirms that the component is detecting ID changes and reloading data.

## Testing Checklist Summary

- [ ] Test 1: Basic Blueprint Detail Load
- [ ] Test 2: Navigation Between Different Blueprints ⭐ **Critical**
- [ ] Test 3: Direct URL Navigation
- [ ] Test 4: Tab Navigation Within Blueprint
- [ ] Test 5: Quick Navigation Between Blueprints
- [ ] Test 6: Navigation via Links in Blueprint Detail
- [ ] Test 7: Edit Blueprint and Refresh
- [ ] Test 8: Error Handling

## Notes

### Before the Fix
The component would reuse the same instance when navigating between blueprints, and the `blueprintId` computed signal would always return the first blueprint's ID because it was reading from a snapshot that was captured only once.

### After the Fix
The component now uses the modern Angular 20 input signal pattern (`id = input.required<string>()`). An effect watches for changes to this input and automatically triggers `loadBlueprint()` whenever the ID changes. This ensures the component always displays the correct blueprint's data regardless of navigation path.

## Technical Details

### Key Changes
1. **Route Parameter Handling**: Changed from `computed(() => this.route.snapshot.paramMap.get('id'))` to `id = input.required<string>()`
2. **Auto-reload Effect**: Added `effect()` in constructor to watch for ID changes
3. **Removed Dependency**: Removed `ActivatedRoute` import (no longer needed)

### Why This Works
- Angular 20's `input()` signals automatically update when route parameters change
- The `effect()` reacts to input signal changes and triggers data reload
- This pattern matches how Angular's router provides parameters to components via route data
- Component reuse is now properly handled with reactive updates

## Browser Support
This fix works with all modern browsers that support Angular 20:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Related Issues
- Reference: Issue #145 (藍圖詳情無法顯示)
- Pattern Reference: `BlueprintTasksComponent` uses the same pattern successfully
