# Blueprint Loading Diagnostic Tools

This directory contains tools to diagnose and fix blueprint loading issues.

## Quick Start

### Step 1: Enable Diagnostic Logging (Already Done)

The application now has comprehensive logging built-in. You just need to:

1. Open browser console (F12)
2. Navigate to any blueprint overview page
3. Watch the console logs

### Step 2: Use Browser Diagnostic Tool

For more detailed analysis, use the browser-based diagnostic tool:

1. **Copy the script**
   - Open `docs/blueprint-diagnostic-tool.js`
   - Copy the entire content

2. **Run in browser console**
   ```javascript
   // Paste the script content, then run:
   await blueprintDiagnostic.runFullDiagnostic('your-blueprint-id');
   ```

3. **Read the results**
   - ✅ Green = OK
   - ⚠️ Yellow = Warning
   - ❌ Red = Error

## What Each Tool Does

### Built-in Application Logging

**Location**: Browser console (F12)

**When to use**: Every time you navigate to a blueprint

**What it shows**:
- Authentication state before loading
- Query execution timing
- Database response details
- RLS policy errors
- Timeout detection

**Example output**:
```
[INFO] [BlueprintOverviewComponent] Auth diagnostics {
  isConfigured: true,
  hasSession: true,
  hasUser: true,
  userId: "xxx-xxx-xxx"
}

[DEBUG] [BlueprintRepository] findById starting {
  blueprintId: "xxx",
  timestamp: "2025-01-..."
}

[DEBUG] [BlueprintRepository] Query executed {
  hasData: true,
  hasError: false
}
```

### Browser Diagnostic Tool

**Location**: `docs/blueprint-diagnostic-tool.js`

**When to use**: When built-in logs aren't enough

**What it does**:
1. ✅ Checks Supabase configuration
2. ✅ Validates authentication state
3. ✅ Verifies account mapping
4. ✅ Tests blueprint access
5. ✅ Checks membership records

**Output**:
- Detailed step-by-step analysis
- Clear pass/fail for each check
- Specific fix recommendations
- Root cause identification

## Common Issues and Fixes

### Issue 1: "尚未登入或登入已過期"

**Cause**: No active session

**Fix**:
1. Sign out completely
2. Clear browser cache/localStorage
3. Sign in again

### Issue 2: "找不到藍圖或您沒有存取權限"

**Cause**: RLS policy denied access

**Fix**:
1. Check if user is blueprint owner
2. Check if user is in blueprint_members table
3. Verify account record exists and is not deleted
4. Review RLS policies

**SQL Check**:
```sql
-- Check ownership
SELECT id, owner_id, name 
FROM blueprints 
WHERE id = 'your-blueprint-id';

-- Check membership
SELECT * 
FROM blueprint_members 
WHERE blueprint_id = 'your-blueprint-id' 
AND account_id = 'your-account-id';

-- Check account
SELECT id, auth_user_id, status, deleted_at 
FROM accounts 
WHERE auth_user_id = auth.uid();
```

### Issue 3: "載入藍圖超時"

**Cause**: Query taking too long (>30s)

**Fix**:
1. Check database performance
2. Review RLS policy complexity
3. Check network connectivity
4. Look for slow queries in Supabase dashboard

### Issue 4: Infinite Loading (No Error)

**Cause**: Query returned null but didn't error

**Fix**:
1. Use diagnostic tool to check each step
2. Most likely RLS denied access silently
3. Check all permission chains

## Step-by-Step Troubleshooting

### Level 1: Quick Check (1 minute)

1. Open browser console
2. Navigate to blueprint page
3. Look for error logs
4. Read error message

### Level 2: Diagnostic Tool (5 minutes)

1. Copy diagnostic script to console
2. Run: `await blueprintDiagnostic.runFullDiagnostic('blueprint-id')`
3. Read the summary
4. Follow the fix recommendations

### Level 3: Database Check (10 minutes)

1. Open Supabase SQL Editor
2. Run the SQL checks from above
3. Verify data exists and is correct
4. Check RLS policies

### Level 4: Deep Investigation (30+ minutes)

1. Review full diagnostic document
2. Check application logs
3. Monitor database performance
4. Review RLS policy execution
5. Test with different users/blueprints

## Files in This Directory

- `BLUEPRINT_LOADING_DIAGNOSTIC.md` - Complete troubleshooting guide
- `blueprint-diagnostic-tool.js` - Browser-based diagnostic tool
- `DIAGNOSTIC_TOOLS_README.md` - This file

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy Tutorial](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Browser DevTools Guide](https://developer.chrome.com/docs/devtools/)

## Support

If you're still stuck after trying these tools:

1. Collect all diagnostic output
2. Note the exact error messages
3. Document the steps that led to the issue
4. Review the full diagnostic document
5. Check for similar issues in the repository

## Testing After Fix

1. ✅ Clear browser cache
2. ✅ Sign in fresh
3. ✅ Navigate to blueprint
4. ✅ Check console - should see success logs
5. ✅ Verify blueprint loads within 2-3 seconds
6. ✅ No error messages
7. ✅ All data displays correctly
