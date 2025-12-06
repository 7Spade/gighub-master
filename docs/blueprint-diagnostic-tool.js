/**
 * Blueprint Loading Diagnostic Tool
 * 
 * Run this script in the browser console to diagnose blueprint loading issues.
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Run: await diagnosticTool.runFullDiagnostic('your-blueprint-id')
 * 4. Review the results
 */

const diagnosticTool = {
  /**
   * Check Supabase configuration
   */
  async checkSupabaseConfig() {
    console.group('🔧 Supabase Configuration');
    
    try {
      // Get the Supabase service from Angular injector
      const supabaseService = window['ng']?.getInjector(document.querySelector('app-root'))?.get('SupabaseService');
      
      if (!supabaseService) {
        console.error('❌ SupabaseService not found');
        console.groupEnd();
        return false;
      }
      
      const isConfigured = supabaseService.isConfigured;
      console.log('Configuration Status:', isConfigured ? '✅ Configured' : '❌ Not Configured');
      
      console.groupEnd();
      return isConfigured;
    } catch (error) {
      console.error('❌ Error checking configuration:', error);
      console.groupEnd();
      return false;
    }
  },

  /**
   * Check authentication state
   */
  async checkAuthState() {
    console.group('🔐 Authentication State');
    
    try {
      // Check if user is logged in
      const hasAuthToken = localStorage.getItem('gighub-auth-token');
      console.log('Auth Token in Storage:', hasAuthToken ? '✅ Found' : '❌ Not Found');
      
      // Try to get session from Supabase
      const supabaseClient = window['supabase'];
      if (supabaseClient) {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('❌ Session Error:', error.message);
        } else if (session) {
          console.log('✅ Active Session Found');
          console.log('  User ID:', session.user.id);
          console.log('  User Email:', session.user.email);
          console.log('  Session Expires:', new Date(session.expires_at * 1000).toLocaleString());
          
          const expiresIn = Math.floor((session.expires_at * 1000 - Date.now()) / 1000 / 60);
          console.log('  Expires In:', expiresIn > 0 ? `${expiresIn} minutes` : '⚠️ EXPIRED');
          
          if (expiresIn <= 0) {
            console.warn('⚠️ Session has expired - please re-login');
          }
        } else {
          console.warn('⚠️ No active session');
        }
        
        console.groupEnd();
        return !!session;
      } else {
        console.error('❌ Supabase client not available');
        console.groupEnd();
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      console.groupEnd();
      return false;
    }
  },

  /**
   * Check account mapping
   */
  async checkAccountMapping() {
    console.group('👤 Account Mapping');
    
    try {
      const supabaseClient = window['supabase'];
      if (!supabaseClient) {
        console.error('❌ Supabase client not available');
        console.groupEnd();
        return null;
      }
      
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        console.warn('⚠️ No session - skip account check');
        console.groupEnd();
        return null;
      }
      
      // Check if account record exists
      const { data: accounts, error } = await supabaseClient
        .from('accounts')
        .select('id, auth_user_id, email, type, status, deleted_at')
        .eq('auth_user_id', session.user.id);
      
      if (error) {
        console.error('❌ Account Query Error:', error.message);
        console.groupEnd();
        return null;
      }
      
      if (!accounts || accounts.length === 0) {
        console.error('❌ No account record found for auth user');
        console.warn('  This is the root cause! Create account record for:', session.user.id);
        console.groupEnd();
        return null;
      }
      
      const account = accounts[0];
      console.log('✅ Account Found');
      console.log('  Account ID:', account.id);
      console.log('  Email:', account.email);
      console.log('  Type:', account.type);
      console.log('  Status:', account.status);
      console.log('  Deleted:', account.deleted_at ? '⚠️ YES' : '✅ NO');
      
      if (account.deleted_at) {
        console.error('❌ Account is soft-deleted');
      }
      
      if (account.status !== 'active') {
        console.warn('⚠️ Account status is:', account.status);
      }
      
      console.groupEnd();
      return account;
    } catch (error) {
      console.error('❌ Error checking account:', error);
      console.groupEnd();
      return null;
    }
  },

  /**
   * Test blueprint access
   */
  async testBlueprintAccess(blueprintId) {
    console.group(`📋 Blueprint Access Test: ${blueprintId}`);
    
    try {
      const supabaseClient = window['supabase'];
      if (!supabaseClient) {
        console.error('❌ Supabase client not available');
        console.groupEnd();
        return false;
      }
      
      // Start timing
      const startTime = performance.now();
      
      // Try to query the blueprint
      const { data: blueprint, error } = await supabaseClient
        .from('blueprints')
        .select('*')
        .eq('id', blueprintId)
        .is('deleted_at', null)
        .single();
      
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log('Query Duration:', `${duration}ms`);
      
      if (error) {
        console.error('❌ Query Error:', error.message);
        console.error('  Error Code:', error.code);
        console.error('  Error Details:', error.details);
        console.error('  Error Hint:', error.hint);
        
        if (error.code === 'PGRST116') {
          console.error('  ⚠️ This means: No rows found OR RLS denied access');
          console.log('  Common causes:');
          console.log('    1. Blueprint does not exist');
          console.log('    2. Blueprint is soft-deleted');
          console.log('    3. User does not have permission (RLS policy failed)');
        }
        
        console.groupEnd();
        return false;
      }
      
      if (!blueprint) {
        console.warn('⚠️ No blueprint data returned (but no error)');
        console.groupEnd();
        return false;
      }
      
      console.log('✅ Blueprint Found');
      console.log('  Name:', blueprint.name);
      console.log('  Owner ID:', blueprint.owner_id);
      console.log('  Status:', blueprint.status);
      console.log('  Public:', blueprint.is_public ? 'Yes' : 'No');
      console.log('  Deleted:', blueprint.deleted_at ? '⚠️ YES' : '✅ NO');
      console.log('  Enabled Modules:', blueprint.enabled_modules);
      
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      console.groupEnd();
      return false;
    }
  },

  /**
   * Check blueprint membership
   */
  async checkBlueprintMembership(blueprintId, accountId) {
    console.group('👥 Blueprint Membership');
    
    try {
      const supabaseClient = window['supabase'];
      if (!supabaseClient || !accountId) {
        console.warn('⚠️ Skip membership check');
        console.groupEnd();
        return null;
      }
      
      const { data: members, error } = await supabaseClient
        .from('blueprint_members')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .eq('account_id', accountId);
      
      if (error) {
        console.error('❌ Membership Query Error:', error.message);
        console.groupEnd();
        return null;
      }
      
      if (!members || members.length === 0) {
        console.log('ℹ️ Not a direct member');
        console.log('  (May still have access as owner or through team)');
      } else {
        console.log('✅ Member Found');
        console.log('  Role:', members[0].role);
        console.log('  External:', members[0].is_external ? 'Yes' : 'No');
      }
      
      console.groupEnd();
      return members;
    } catch (error) {
      console.error('❌ Error checking membership:', error);
      console.groupEnd();
      return null;
    }
  },

  /**
   * Run full diagnostic
   */
  async runFullDiagnostic(blueprintId) {
    console.clear();
    console.log('🔍 Blueprint Loading Diagnostic Tool');
    console.log('═'.repeat(60));
    console.log('Blueprint ID:', blueprintId);
    console.log('Time:', new Date().toLocaleString());
    console.log('═'.repeat(60));
    console.log('');
    
    const results = {
      configOk: false,
      authOk: false,
      accountOk: false,
      blueprintAccessOk: false,
      membershipOk: false
    };
    
    // Step 1: Check configuration
    results.configOk = await this.checkSupabaseConfig();
    console.log('');
    
    // Step 2: Check authentication
    results.authOk = await this.checkAuthState();
    console.log('');
    
    // Step 3: Check account mapping
    const account = await this.checkAccountMapping();
    results.accountOk = !!account;
    console.log('');
    
    // Step 4: Test blueprint access
    if (blueprintId) {
      results.blueprintAccessOk = await this.testBlueprintAccess(blueprintId);
      console.log('');
      
      // Step 5: Check membership
      if (account) {
        await this.checkBlueprintMembership(blueprintId, account.id);
        console.log('');
      }
    }
    
    // Summary
    console.log('═'.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(60));
    console.log('Configuration:', results.configOk ? '✅ OK' : '❌ FAIL');
    console.log('Authentication:', results.authOk ? '✅ OK' : '❌ FAIL');
    console.log('Account Mapping:', results.accountOk ? '✅ OK' : '❌ FAIL');
    if (blueprintId) {
      console.log('Blueprint Access:', results.blueprintAccessOk ? '✅ OK' : '❌ FAIL');
    }
    console.log('═'.repeat(60));
    
    // Diagnosis
    console.log('');
    console.group('🎯 DIAGNOSIS');
    
    if (!results.configOk) {
      console.error('❌ CRITICAL: Supabase is not configured');
      console.log('Fix: Check environment configuration');
    } else if (!results.authOk) {
      console.error('❌ CRITICAL: User is not authenticated');
      console.log('Fix: Log in again');
    } else if (!results.accountOk) {
      console.error('❌ CRITICAL: Account record is missing');
      console.log('Fix: Account should be created automatically on signup');
      console.log('      Check if signup process completed successfully');
    } else if (blueprintId && !results.blueprintAccessOk) {
      console.error('❌ PROBLEM: Cannot access blueprint');
      console.log('Possible causes:');
      console.log('  1. Blueprint does not exist');
      console.log('  2. User does not have permission (RLS policy)');
      console.log('  3. Blueprint is soft-deleted');
      console.log('Fix: Check RLS policies and blueprint ownership/membership');
    } else {
      console.log('✅ All checks passed!');
      console.log('If blueprint still does not load, check:');
      console.log('  1. Network connectivity');
      console.log('  2. Browser console for JavaScript errors');
      console.log('  3. Application logs for detailed errors');
    }
    
    console.groupEnd();
    console.log('');
    
    return results;
  }
};

// Make it available globally
window['blueprintDiagnostic'] = diagnosticTool;

console.log('✅ Diagnostic tool loaded!');
console.log('Usage: await blueprintDiagnostic.runFullDiagnostic("your-blueprint-id")');
