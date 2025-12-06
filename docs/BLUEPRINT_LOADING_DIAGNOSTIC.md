# Blueprint Loading Issue - Diagnostic Guide

## Problem Description

藍圖卡片在點開後卡在載入中狀態，無法正常顯示內容。

## Root Cause Analysis

Based on comprehensive code analysis, the following potential causes have been identified:

### 1. **RLS (Row Level Security) Policy Issues** - Most Likely Cause

#### What is RLS?
Supabase uses PostgreSQL's Row Level Security to control access to data at the database level. Every query is checked against RLS policies before returning results.

#### The `has_blueprint_access` Function
This function checks multiple conditions to determine if a user can access a blueprint:
1. Is the blueprint public?
2. Is the user the owner?
3. Is the user a member of the blueprint?
4. Does the user have access through a team role?
5. Is the user an organization member (for organization blueprints)?

#### Potential Problems:
- **Missing User Session**: If `auth.uid()` returns NULL, all permission checks fail
- **Incorrect Account Mapping**: The account's `auth_user_id` must match the authenticated user
- **Missing Memberships**: User not added to blueprint_members table
- **Deleted Account Records**: Soft-deleted accounts block access

### 2. **Authentication State Issues**

#### Timing Problems:
- Component loads before authentication completes
- Session expires during navigation
- Token refresh fails silently

#### Session Storage Issues:
- localStorage blocked (incognito mode, browser settings)
- Cross-domain session issues
- Multiple tabs conflict

### 3. **Network and Database Issues**

#### Connection Problems:
- Slow database response
- Network timeout
- Connection pool exhaustion
- Rate limiting

#### Query Performance:
- Missing indexes on large tables
- Complex RLS policies slow down queries
- N+1 query problems

### 4. **Frontend State Management Issues**

#### Loading State Not Cleared:
- Query returns null (no data) but doesn't set error
- Async race condition
- Signal state not updated properly

## Diagnostic Improvements Added

### 1. Enhanced Logging

Added comprehensive logging throughout the loading chain:

#### Overview Component
- Authentication state check before loading
- Blueprint query start/end timestamps
- Detailed error messages
- Loading timeout detection (30 seconds)

#### Repository Layer
- Query construction logging
- Supabase response details
- RLS policy error detection
- Performance metrics

#### Supabase Service
- New `getDiagnostics()` method for auth state inspection
- Session expiry tracking
- Configuration validation

### 2. Timeout Protection

Added 30-second timeout to prevent infinite loading:
```typescript
const loadingTimeout = setTimeout(() => {
  this.logger.error('[BlueprintOverviewComponent] Loading timeout - query may be hung');
  this.error.set('載入藍圖超時，請檢查網路連線或稍後再試');
  this.loading.set(false);
}, 30000);
```

### 3. Better Error Messages

Updated error messages to provide more context:
- "尚未登入或登入已過期，請重新登入" - Auth issue
- "找不到藍圖或您沒有存取權限" - RLS/permission issue
- "載入藍圖超時，請檢查網路連線或稍後再試" - Network/performance issue

## How to Use the Diagnostics

### Step 1: Enable Debug Logging

Open browser console (F12) and check for log messages:

```
[DEBUG] [SupabaseService] Diagnostics
[DEBUG] [BlueprintRepository] findById starting
[DEBUG] [BlueprintRepository] Query constructed
[DEBUG] [BlueprintRepository] Query executed
```

### Step 2: Check Authentication State

Look for this log entry:
```
[INFO] [BlueprintOverviewComponent] Auth diagnostics {
  isConfigured: true,
  hasSession: true/false,
  hasUser: true/false,
  userId: "xxx-xxx-xxx"
}
```

**If `hasSession` or `hasUser` is false**: Authentication problem
- Check if login is successful
- Verify session is not expired
- Check localStorage for auth token

### Step 3: Check Query Execution

Look for:
```
[DEBUG] [BlueprintRepository] Query executed {
  hasData: true/false,
  hasError: true/false,
  errorDetails: {...}
}
```

**If `hasError` is true**: Check the error details
- `PGRST116`: No rows found - RLS denied access
- `PGRST301`: JWT expired - Session expired
- Connection errors: Network issue

**If `hasData` is false and `hasError` is false**: Data not found
- Blueprint ID is invalid
- Blueprint is soft-deleted
- User doesn't have access

### Step 4: Check for Timeout

If you see:
```
[ERROR] [BlueprintOverviewComponent] Loading timeout - query may be hung
```

This indicates:
- Database query is taking too long (>30s)
- Network connectivity issues
- Database performance problem
- RLS policy is too complex/slow

## Troubleshooting Steps

### For Authentication Issues:

1. **Check Login Status**
   ```typescript
   // In browser console
   const diagnostics = await window['supabaseService'].getDiagnostics();
   console.log(diagnostics);
   ```

2. **Re-login**
   - Sign out completely
   - Clear browser cache and localStorage
   - Sign in again

3. **Check Token Expiry**
   - Session tokens expire after a period
   - Auto-refresh should work but may fail
   - Manual re-login resolves this

### For Permission Issues:

1. **Verify Blueprint Ownership**
   ```sql
   SELECT id, owner_id, name 
   FROM blueprints 
   WHERE id = 'your-blueprint-id';
   ```

2. **Check Membership**
   ```sql
   SELECT * 
   FROM blueprint_members 
   WHERE blueprint_id = 'your-blueprint-id' 
   AND account_id = 'your-account-id';
   ```

3. **Verify Account Mapping**
   ```sql
   SELECT id, auth_user_id 
   FROM accounts 
   WHERE auth_user_id = auth.uid();
   ```

### For Database Performance Issues:

1. **Check Query Performance**
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM blueprints 
   WHERE id = 'your-blueprint-id' 
   AND deleted_at IS NULL;
   ```

2. **Review RLS Policies**
   - Complex nested queries in RLS can be slow
   - Consider adding indexes
   - Optimize helper functions

3. **Monitor Database Metrics**
   - Check Supabase dashboard for slow queries
   - Look for connection pool exhaustion
   - Review error logs

## Testing Checklist

To verify the fix works:

- [ ] Open browser console (F12)
- [ ] Enable debug logging if needed
- [ ] Navigate to blueprint overview page
- [ ] Check auth diagnostics in console
- [ ] Verify query execution logs appear
- [ ] Confirm blueprint data loads or error message shows
- [ ] Check loading timeout doesn't trigger (unless network issue)

## Next Steps

Based on the diagnostic logs, you can now:

1. **Identify the exact failure point** - auth, query, or network
2. **Fix the root cause** - adjust RLS, fix auth, or optimize query
3. **Verify the fix** - check logs confirm successful execution

## Common Fixes

### Fix 1: RLS Policy Too Restrictive

If user should have access but RLS denies it:
```sql
-- Grant public access (for testing only)
ALTER TABLE blueprints DISABLE ROW LEVEL SECURITY;

-- Or adjust the policy to be less restrictive
```

### Fix 2: Missing Account Record

If auth works but account record is missing:
```sql
-- Check if account exists
SELECT * FROM accounts WHERE auth_user_id = 'your-auth-uid';

-- Create account if missing (should happen automatically on signup)
```

### Fix 3: Session Expired

If session is expired:
- Sign out and sign in again
- Check auto-refresh is enabled in Supabase client config
- Adjust session timeout settings

## Files Modified

1. `src/app/routes/blueprint/overview/overview.component.ts`
   - Added auth state check
   - Added loading timeout
   - Enhanced error messages
   - Added comprehensive logging

2. `src/app/core/infra/repositories/blueprint/blueprint.repository.ts`
   - Added detailed query logging
   - Added error detail logging
   - Added performance tracking

3. `src/app/core/supabase/supabase.service.ts`
   - Added `getDiagnostics()` method
   - Added session state logging

## Conclusion

These diagnostic improvements will help identify the exact cause of the loading issue. The logs will show whether it's an authentication problem, a permission issue, or a database performance problem.

The timeout protection ensures users won't be stuck indefinitely, and the improved error messages give clearer guidance on what went wrong.
