const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/#/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const testUser = 'testdbg' + Date.now().toString(36).slice(-4);
  const password = 'test1234';
  
  console.log(`注册用户: ${testUser} / ${password}`);
  
  const inputs = await page.locator('input').all();
  console.log(`找到 ${inputs.length} 个输入框`);
  
  await inputs[0].fill(testUser);
  await inputs[1].fill(password);
  await inputs[2].fill(password);
  
  const regBtn = page.locator('button').filter({ hasText: /注册/ }).first();
  await regBtn.click();
  await page.waitForTimeout(4000);
  
  const afterReg = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('注册后:', afterReg.substring(0, 300));
  
  if (afterReg.includes('新建任务') || afterReg.includes('任务面板')) {
    console.log('✅ 注册并登录成功\n');
    
    // Click new task button
    const newTaskBtn = page.locator('button').filter({ hasText: /新建/ }).first();
    await newTaskBtn.click();
    await page.waitForTimeout(2000);
    
    const modalText = await page.evaluate(() => document.body.innerText);
    console.log('=== 弹窗内容 ===');
    console.log(modalText.substring(0, 1200));
    
    // Find "添加参与人员" button
    const addBtn = page.locator('button').filter({ hasText: '添加参与人员' }).first();
    const addBtnExists = await addBtn.count();
    console.log(`\n添加参与人员按钮: ${addBtnExists > 0 ? '✅ 存在' : '❌ 不存在'}`);
    
    if (addBtnExists > 0) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: '/tmp/member_dropdown.png' });
      console.log('📸 下拉截图: /tmp/member_dropdown.png');
      
      // Try to find clickable user items
      const allButtons = page.locator('button');
      const count = await allButtons.count();
      console.log(`\n页面共 ${count} 个按钮`);
      
      // Print all button texts in dropdown area
      const btnTexts = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        return Array.from(btns).map(b => b.innerText.trim().replace(/\n/g, ' ')).filter(t => t.length > 0 && t.length < 30);
      });
      console.log('按钮文本:', JSON.stringify(btnTexts));
      
      // Look for user buttons in the dropdown
      for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const text = (await btn.innerText()).trim();
        if (text === 'kevin' || text === '001' || text === '肖伍秋' || text === 'test1' || text === 'admin') {
          console.log(`\n尝试点击: "${text}" (按钮 #${i})`);
          try {
            await btn.click({ force: true });
            await page.waitForTimeout(800);
            
            await page.screenshot({ path: '/tmp/after_click.png' });
            console.log('📸 点击后截图: /tmp/after_click.png');
            
            const afterClick = await page.evaluate(() => document.body.innerText.substring(0, 1000));
            console.log('\n点击后弹窗:');
            console.log(afterClick);
            break;
          } catch(e) {
            console.log(`点击失败: ${e.message}`);
          }
        }
      }
    }
    
    // Fill in task name to test save
    const nameInput = page.locator('input[placeholder*="项目名称"], input').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('测试成员功能');
    }
    
    // Try to save
    const saveBtn = page.locator('button').filter({ hasText: /保存|创建|确定/ }).first();
    if (await saveBtn.count() > 0) {
      console.log('\n尝试保存...');
      await saveBtn.click();
      await page.waitForTimeout(2000);
      
      const afterSave = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('保存后:', afterSave);
    }
  } else {
    console.log('❌ 注册失败');
  }
  
  await browser.close();
})();
