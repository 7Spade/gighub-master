# Blueprint Loading - Problem Flow vs Solution Flow

## Problem Flow (Before Fix)

```
User Clicks Blueprint
        ↓
Component Loads
        ↓
ngOnInit() fires
        ↓
loadBlueprint() called
        ↓
        ┌──────────────────────────┐
        │  No Auth Check           │
        │  (may not be ready yet)  │
        └──────────────────────────┘
        ↓
Query Supabase
        ↓
        ┌──────────────────────────┐
        │  RLS Check               │
        │  has_blueprint_access()  │
        │                          │
        │  If auth.uid() = NULL:   │
        │  → All checks fail       │
        │  → Returns NULL          │
        └──────────────────────────┘
        ↓
Repository receives NULL
        ↓
        ┌──────────────────────────┐
        │  No Error (just NULL)    │
        │  Maps to null blueprint  │
        └──────────────────────────┘
        ↓
Component receives null
        ↓
        ┌──────────────────────────┐
        │  Sets error message      │
        │  But loading stays TRUE! │
        │  ❌ STUCK HERE FOREVER   │
        └──────────────────────────┘
        ↓
User sees loading spinner forever
```

## Solution Flow (After Fix)

```
User Clicks Blueprint
        ↓
Component Loads
        ↓
ngOnInit() fires
        ↓
loadBlueprint() called
        ↓
        ┌──────────────────────────┐
        │  ✅ NEW: Check Auth      │
        │  getDiagnostics()        │
        │  - hasSession?           │
        │  - hasUser?              │
        │  - userId valid?         │
        └──────────────────────────┘
        ↓
        ┌─────────────┬─────────────┐
        │             │             │
    NO  │             │  YES        │
        ↓             ↓             
   ┌────────────┐  ┌────────────────┐
   │ Show Error │  │ Continue Query │
   │ "Not Login"│  │                │
   │ loading=F  │  └────────────────┘
   └────────────┘         ↓
        ↓              ┌──────────────────────────┐
        │              │  ✅ NEW: Start Timeout   │
        │              │  setTimeout(30s)         │
        │              └──────────────────────────┘
        │                     ↓
        │              Query Supabase
        │                     ↓
        │              ┌──────────────────────────┐
        │              │  RLS Check               │
        │              │  has_blueprint_access()  │
        │              │  (with valid auth.uid()) │
        │              └──────────────────────────┘
        │                     ↓
        │              ┌─────────┬─────────┐
        │              │         │         │
        │          PASS│         │FAIL     │
        │              ↓         ↓         
        │         ┌─────────┐  ┌──────────────┐
        │         │ Return  │  │ Return NULL  │
        │         │ Data    │  │              │
        │         └─────────┘  └──────────────┘
        │              ↓              ↓
        │         ┌─────────┐   ┌───────────────┐
        │         │ Success │   │ Show Error    │
        │         │ Display │   │ "No Access"   │
        │         │ loading=F   │ loading=FALSE │
        │         └─────────┘   └───────────────┘
        │              ↓              ↓
        ↓              ↓              ↓
   ┌──────────────────────────────────────────┐
   │  ✅ NEW: Finally Block                   │
   │  - Clear timeout                         │
   │  - loading.set(false)                    │
   │  - Log completion                        │
   └──────────────────────────────────────────┘
        ↓
User sees result (success or clear error)
```

## Timeout Protection Flow

```
Query starts
        ↓
setTimeout(30s) starts
        ↓
        ┌─────────────┬──────────────┐
        │             │              │
    Query completes   Query hangs    
    (before 30s)      (>30s)        
        ↓             ↓              
   ┌────────────┐  ┌──────────────────┐
   │ Clear      │  │ Timeout fires    │
   │ timeout    │  │ Show error       │
   │ Show result│  │ "Loading timeout"│
   │ loading=F  │  │ loading=FALSE    │
   └────────────┘  └──────────────────┘
        ↓             ↓              
   User sees data   User sees error
```

## RLS Policy Check Details

### Original Issue: Silent Failure

```
User queries blueprint
        ↓
RLS: has_blueprint_access(blueprint_id)
        ↓
        ┌──────────────────────────┐
        │ Check 1: Is public?      │
        │ → NO                     │
        └──────────────────────────┘
        ↓
        ┌──────────────────────────┐
        │ Check 2: Is owner?       │
        │ → NO (auth.uid() = NULL) │
        └──────────────────────────┘
        ↓
        ┌──────────────────────────┐
        │ Check 3: Is member?      │
        │ → NO (account not found) │
        └──────────────────────────┘
        ↓
        ┌──────────────────────────┐
        │ Check 4: Team access?    │
        │ → NO                     │
        └──────────────────────────┘
        ↓
        ┌──────────────────────────┐
        │ Check 5: Org member?     │
        │ → NO                     │
        └──────────────────────────┘
        ↓
All checks fail
        ↓
        ┌──────────────────────────┐
        │ Return: FALSE            │
        │ Result: No rows          │
        │ ❌ Looks like NULL       │
        └──────────────────────────┘
```

### With Diagnostics: Clear Identification

```
User queries blueprint
        ↓
✅ Check auth FIRST
        ↓
        ┌──────────────────────────┐
        │ Auth valid?              │
        └──────────────────────────┘
        ↓
    ┌────┴────┐
    │         │
   NO        YES
    ↓         ↓
   Error   Continue
            ↓
RLS: has_blueprint_access(blueprint_id)
        ↓
        ┌──────────────────────────┐
        │ ✅ Logs each check       │
        │ ✅ Logs failure reason   │
        │ ✅ Returns error details │
        └──────────────────────────┘
        ↓
Clear error message shown
```

## Logging Flow

### Component Level

```
loadBlueprint() called
        ↓
[INFO] Starting blueprint load { blueprintId }
        ↓
[INFO] Auth diagnostics { session, user, expiry }
        ↓
Query executes
        ↓
[INFO] Blueprint query completed { found, data }
        ↓
[DEBUG] Loading members { blueprintId }
        ↓
[DEBUG] Members loaded { count }
        ↓
[INFO] Blueprint load completed { hasBlueprint, hasError }
```

### Repository Level

```
findById() called
        ↓
[DEBUG] findById starting { blueprintId, timestamp }
        ↓
[DEBUG] Query constructed { queryDetails }
        ↓
Query executes
        ↓
[DEBUG] Query executed { hasData, hasError, errorDetails }
        ↓
        ┌─────────┬─────────┐
        │         │         │
    Success    Error       
        ↓         ↓         
   [INFO]     [ERROR]      
   Blueprint  Error details
   found      with codes   
```

## Key Improvements Summary

### Before:
- ❌ No auth validation
- ❌ No timeout
- ❌ Silent failures
- ❌ Generic errors
- ❌ Infinite loading

### After:
- ✅ Auth validation before query
- ✅ 30s timeout protection
- ✅ Detailed logging
- ✅ Specific error messages
- ✅ Always completes (success or error)

## Error Message Mapping

```
Failure Type              → Error Message
─────────────────────────────────────────────────────────
No session/user           → "尚未登入或登入已過期，請重新登入"
RLS denied/not found      → "找不到藍圖或您沒有存取權限"
Query timeout (>30s)      → "載入藍圖超時，請檢查網路連線或稍後再試"
Network error             → Error message from exception
Database error            → Error message from Supabase
```

## Diagnostic Tool Flow

```
Run: blueprintDiagnostic.runFullDiagnostic('id')
        ↓
Step 1: Check Supabase Config
        ↓
        ┌──────────────────────────┐
        │ Is configured?           │
        │ ✅ YES → Continue        │
        │ ❌ NO → Stop, show error │
        └──────────────────────────┘
        ↓
Step 2: Check Auth State
        ↓
        ┌──────────────────────────┐
        │ Has session?             │
        │ Has user?                │
        │ Session expired?         │
        └──────────────────────────┘
        ↓
Step 3: Check Account Mapping
        ↓
        ┌──────────────────────────┐
        │ Account record exists?   │
        │ auth_user_id matches?    │
        │ Account active?          │
        └──────────────────────────┘
        ↓
Step 4: Test Blueprint Access
        ↓
        ┌──────────────────────────┐
        │ Query blueprint          │
        │ Time the query           │
        │ Check for errors         │
        └──────────────────────────┘
        ↓
Step 5: Check Membership
        ↓
        ┌──────────────────────────┐
        │ Is member?               │
        │ What role?               │
        │ Is external?             │
        └──────────────────────────┘
        ↓
Generate Diagnosis
        ↓
        ┌──────────────────────────┐
        │ Summary of all checks    │
        │ Identified problems      │
        │ Specific recommendations │
        └──────────────────────────┘
```

## This Diagram Shows:

1. **Problem**: Query silently fails, loading never ends
2. **Solution**: Auth check, timeout, logging, clear errors
3. **RLS**: How permission checks work and fail
4. **Logging**: What gets logged at each layer
5. **Diagnostics**: How the browser tool analyzes the issue
6. **Error Mapping**: What message for what problem

## Result:

**Before**: User waits forever, no idea what's wrong  
**After**: User sees clear error within 30s max, knows what to do
