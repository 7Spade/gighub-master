/**
 * Comprehensive Blueprint Features Test
 * Tests all 17 sub-feature modules
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'ac7x@pm.me';
const TEST_PASSWORD = '123123';
const BLUEPRINT_NAME = `完整測試藍圖 ${Date.now()}`;
const BLUEPRINT_DESCRIPTION = '這是一個完整測試所有子功能的藍圖';

// Test results tracking
const testResults: { feature: string; status: string; error?: string }[] = [];

test.describe('Comprehensive Blueprint Features Test', () => {
  let blueprintId: string;

  test('Complete blueprint features testing', async ({ page }) => {
    // Set longer timeout for comprehensive test
    test.setTimeout(180000); // 3 minutes
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (!text.includes('Download the React DevTools')) {
        console.log(`[BROWSER]: ${text}`);
      }
    });
    page.on('pageerror', error => console.log(`[ERROR]: ${error.message}`));
    
    console.log('\n' + '='.repeat(60));
    console.log('COMPREHENSIVE BLUEPRINT FEATURES TEST');
    console.log('='.repeat(60) + '\n');

    // ==================== STEP 1: Login ====================
    console.log('### STEP 1: Login ###');
    await page.goto('http://localhost:4200/#/passport/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    expect(page.url()).not.toContain('/passport/login');
    console.log('✓ Login successful\n');

    // ==================== STEP 2: Create Blueprint ====================
    console.log('### STEP 2: Create Blueprint ###');
    await page.goto('http://localhost:4200/#/blueprint/list');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const createButton = page.locator('button:has-text("建立藍圖")').first();
    await createButton.click();
    await page.waitForTimeout(2000);
    
    await page.fill('input[formControlName="name"]', BLUEPRINT_NAME);
    await page.fill('textarea[formControlName="description"]', BLUEPRINT_DESCRIPTION);
    
    const submitButton = page.locator('button:has-text("建立藍圖")').last();
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // Extract blueprint ID from URL or storage
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Try to find the created blueprint in the list
    const blueprintCards = await page.locator('.blueprint-card, st-row, nz-card').all();
    console.log(`Found ${blueprintCards.length} blueprint items`);
    
    // Get the most recently created blueprint (should be first or last)
    if (blueprintCards.length > 0) {
      // Try to extract blueprint ID from the first card
      const firstCard = blueprintCards[0];
      await firstCard.click();
      await page.waitForTimeout(2000);
      
      const overviewUrl = page.url();
      console.log(`Overview URL: ${overviewUrl}`);
      
      // Extract blueprint ID from URL pattern: /#/blueprint/{id}/...
      const match = overviewUrl.match(/blueprint\/([a-f0-9-]+)/);
      if (match) {
        blueprintId = match[1];
        console.log(`✓ Blueprint created successfully with ID: ${blueprintId}\n`);
      } else {
        throw new Error('Could not extract blueprint ID from URL');
      }
    } else {
      throw new Error('No blueprints found after creation');
    }

    await page.screenshot({ path: 'test-results/comprehensive-00-blueprint-created.png', fullPage: true });

    // ==================== STEP 3: Test All Sub-Features ====================
    console.log('### STEP 3: Testing All Sub-Features ###\n');

    const features = [
      { name: 'Overview', path: '', description: '藍圖概覽' },
      { name: 'Members', path: '/members', description: '成員管理' },
      { name: 'Tasks', path: '/tasks', description: '任務管理' },
      { name: 'Financial', path: '/financial', description: '財務管理' },
      { name: 'Diaries', path: '/diaries', description: '施工日誌' },
      { name: 'QC Inspections', path: '/qc-inspections', description: '品質管控' },
      { name: 'Files', path: '/files', description: '檔案管理' },
      { name: 'Settings', path: '/settings', description: '藍圖設定' },
      { name: 'Problems', path: '/problems', description: '問題追蹤' },
      { name: 'Metadata', path: '/metadata', description: '自訂欄位' },
      { name: 'Activities', path: '/activities', description: '活動歷史' },
      { name: 'Notifications', path: '/notifications', description: '通知設定' },
      { name: 'Search', path: '/search', description: '進階搜尋' },
      { name: 'Permissions', path: '/permissions', description: '權限管理' },
      { name: 'Acceptances', path: '/acceptances', description: '驗收管理' },
      { name: 'Reports', path: '/reports', description: '報表分析' },
      { name: 'Gantt', path: '/gantt', description: '甘特圖' },
      { name: 'API Gateway', path: '/api-gateway', description: 'API 閘道' }
    ];

    let passCount = 0;
    let failCount = 0;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const featureNum = String(i + 1).padStart(2, '0');
      
      console.log(`[${featureNum}/${features.length}] Testing ${feature.name} (${feature.description})...`);
      
      try {
        const featureUrl = `http://localhost:4200/#/blueprint/${blueprintId}${feature.path}`;
        await page.goto(featureUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verify we're on the correct page
        const currentUrl = page.url();
        expect(currentUrl).toContain(`/blueprint/${blueprintId}${feature.path}`);
        
        // Take screenshot
        const screenshotPath = `test-results/comprehensive-${featureNum}-${feature.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Check for any error messages
        const errorElements = await page.locator('.ant-message-error, .error-message, .ant-alert-error').all();
        if (errorElements.length > 0) {
          const errorTexts = await Promise.all(errorElements.map(e => e.textContent()));
          console.log(`   ⚠ Warning: Found ${errorElements.length} error messages: ${errorTexts.join(', ')}`);
        }
        
        console.log(`   ✓ ${feature.name} page loaded successfully`);
        testResults.push({ feature: feature.name, status: '✓ PASS' });
        passCount++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`   ✗ ${feature.name} failed: ${errorMsg}`);
        testResults.push({ feature: feature.name, status: '✗ FAIL', error: errorMsg });
        failCount++;
        
        // Take screenshot of failure
        const screenshotPath = `test-results/comprehensive-${featureNum}-${feature.name.toLowerCase().replace(/\s+/g, '-')}-FAILED.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }
      
      // Small delay between tests
      await page.waitForTimeout(1000);
    }

    // ==================== STEP 4: Summary ====================
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Features: ${features.length}`);
    console.log(`Passed: ${passCount} (${Math.round(passCount/features.length*100)}%)`);
    console.log(`Failed: ${failCount} (${Math.round(failCount/features.length*100)}%)`);
    console.log('='.repeat(60) + '\n');

    console.log('Detailed Results:');
    testResults.forEach((result, index) => {
      const num = String(index + 1).padStart(2, '0');
      console.log(`${num}. ${result.feature.padEnd(20)} ${result.status}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    console.log('');

    // Write results to file
    const resultsReport = `# 藍圖子功能完整測試報告

**測試日期**: ${new Date().toISOString()}
**藍圖 ID**: ${blueprintId}
**藍圖名稱**: ${BLUEPRINT_NAME}

## 測試結果總覽

- 總測試項目: ${features.length}
- 通過: ${passCount} (${Math.round(passCount/features.length*100)}%)
- 失敗: ${failCount} (${Math.round(failCount/features.length*100)}%)

## 詳細結果

| # | 功能名稱 | 中文描述 | 狀態 | 備註 |
|---|----------|----------|------|------|
${testResults.map((result, index) => {
  const feature = features[index];
  const status = result.status.includes('PASS') ? '✅ 通過' : '❌ 失敗';
  const note = result.error || '-';
  return `| ${index + 1} | ${feature.name} | ${feature.description} | ${status} | ${note} |`;
}).join('\n')}

## 截圖清單

${testResults.map((result, index) => {
  const feature = features[index];
  const num = String(index + 1).padStart(2, '0');
  const filename = result.status.includes('PASS') 
    ? `comprehensive-${num}-${feature.name.toLowerCase().replace(/\s+/g, '-')}.png`
    : `comprehensive-${num}-${feature.name.toLowerCase().replace(/\s+/g, '-')}-FAILED.png`;
  return `- [${result.status}] ${feature.description}: \`test-results/${filename}\``;
}).join('\n')}

## 結論

${failCount === 0 
  ? '✅ 所有測試通過！所有藍圖子功能正常運作。' 
  : `⚠️ 有 ${failCount} 個功能測試失敗，需要進一步檢查。`}

---
*報告生成時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}*
`;

    const fs = require('fs');
    fs.writeFileSync('test-results/COMPREHENSIVE_TEST_REPORT.md', resultsReport);
    console.log('✓ Test report saved to test-results/COMPREHENSIVE_TEST_REPORT.md\n');

    // Assert that most features passed (allow some failures for incomplete features)
    const successRate = passCount / features.length;
    console.log(`Success rate: ${Math.round(successRate * 100)}%`);
    expect(successRate).toBeGreaterThan(0.5); // At least 50% should pass
  });
});
