const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/#/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const testUser = 'testfix' + Date.now().toString(36).slice(-4);
  const password = 'test1234';
  
  console.log(`注册: ${testUser} / ${password}`);
  
  const inputs = await page.locator('input').all();
  await inputs[0].fill(testUser);
  await inputs[1].fill(password);
  await inputs[2].fill(password);
  
  const regBtn = page.locator('button').filter({ hasText: /注册/ }).first();
  await regBtn.click();
  await page.waitForTimeout(4000);
  
  const afterReg = await page.evaluate(() => document.body.innerText.substring(0, 400));
  
  if (afterReg.includes('新建任务') || afterReg.includes('任务面板')) {
    console.log('✅ 注册登录成功\n');
    
    // Click new task
    const newBtn = page.locator('button').filter({ hasText: /新建/ }).first();
    await newBtn.click();
    await page.waitForTimeout(2000);
    
    // Click "添加参与人员"
    const addBtn = page.locator('button').filter({ hasText: '添加参与人员' }).first();
    await addBtn.click();
    await page.waitForTimeout(1000);
    
    console.log('=== 测试 1: 点击选择 kevin ===');
    // Click kevin
    const kevinBtn = page.locator('button').filter({ hasText: /^kevin$/ }).first();
    if (await kevinBtn.count() > 0) {
      await kevinBtn.click();
      await page.waitForTimeout(500);
      
      const afterSelect = await page.evaluate(() => document.body.innerText.substring(0, 1200));
      const hasKevinTag = afterSelect.includes('kevin');
      console.log(`  kevin 标签出现: ${hasKevinTag ? '✅' : '❌'}`);
      
      if (!hasKevinTag) {
        console.log('  弹窗内容片段:');
        // Find the member area
        const memberArea = afterSelect.indexOf('有权查看项目的人员');
        if (memberArea > 0) {
          console.log('  ' + afterSelect.substring(memberArea, memberArea + 300));
        }
      }
    }
    
    // Close dropdown by clicking elsewhere
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    
    console.log('\n=== 测试 2: 再次打开下拉 ===');
    await addBtn.click();
    await page.waitForTimeout(800);
    
    // kevin should now be absent from dropdown
    const dropdownText = await page.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        if (div.innerText.includes('001') && div.innerText.includes('test1')) {
          return div.innerText.trim();
        }
      }
      return 'NOT FOUND';
    });
    console.log('  下拉列表:', dropdownText);
    const kevinStillThere = dropdownText.includes('kevin');
    console.log(`  kevin 仍在下拉中: ${kevinStillThere ? '❌ 应该不在' : '✅ 已移除'}`);
    
    // Click 001
    const btn001 = page.locator('button').filter({ hasText: /^001$/ }).first();
    if (await btn001.count() > 0) {
      await btn001.click();
      await page.waitForTimeout(500);
      
      const afterSelect2 = await page.evaluate(() => document.body.innerText.substring(0, 1200));
      const has001Tag = afterSelect2.includes('001');
      console.log(`  001 标签出现: ${has001Tag ? '✅' : '❌'}`);
    }
    
    // Close dropdown
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    
    console.log('\n=== 测试 3: 查看成员标签 ===');
    const memberTags = await page.evaluate(() => {
      const spans = document.querySelectorAll('span');
      const tags = [];
      for (const s of spans) {
        const text = s.innerText.trim();
        if ((text === 'kevin' || text === '001' || text === testUser) && s.className.includes('rounded-full')) {
          tags.push(text);
        }
      }
      return tags;
    });
    console.log('  成员标签:', JSON.stringify(memberTags));
    console.log(`  标签数量: ${memberTags.length} (期望: 2)`);
    
    // Test removing a newly selected member
    console.log('\n=== 测试 4: 删除新选成员 ===');
    const removeBtns = await page.locator('span[class*="rounded-full"] button').all();
    console.log(`  可删除按钮数: ${removeBtns.length}`);
    
    if (removeBtns.length > 0) {
      await removeBtns[0].click();
      await page.waitForTimeout(500);
      
      const afterRemove = await page.evaluate(() => {
        const spans = document.querySelectorAll('span');
        const tags = [];
        for (const s of spans) {
          const text = s.innerText.trim();
          if ((text === 'kevin' || text === '001') && s.className.includes('rounded-full')) {
            tags.push(text);
          }
        }
        return tags;
      });
      console.log(`  删除后标签: ${JSON.stringify(afterRemove)} (期望: 1)`);
    }
    
    await page.screenshot({ path: '/tmp/final_state.png' });
    console.log('\n📸 最终截图: /tmp/final_state.png');
  } else {
    console.log('❌ 注册失败:', afterReg.substring(0, 200));
  }
  
  await browser.close();
  console.log('\n✅ 测试完成');
})();
