const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/#/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const testUser = 'testmbr' + Date.now().toString(36).slice(-4);
  
  console.log(`注册: ${testUser} / test1234`);
  
  const inputs = await page.locator('input').all();
  await inputs[0].fill(testUser);
  await inputs[1].fill('test1234');
  await inputs[2].fill('test1234');
  
  const regBtn = page.locator('button').filter({ hasText: /注册/ }).first();
  await regBtn.click();
  await page.waitForTimeout(4000);
  
  const afterReg = await page.evaluate(() => document.body.innerText.substring(0, 400));
  
  if (!afterReg.includes('任务面板')) {
    console.log('❌ 注册失败');
    await browser.close();
    return;
  }
  
  console.log('✅ 登录成功\n');
  
  // Click new task
  const newBtn = page.locator('button').filter({ hasText: /新建/ }).first();
  await newBtn.click();
  await page.waitForTimeout(2000);
  
  // Get modal content
  let modalText = await page.evaluate(() => {
    // Find the dialog/modal
    const dialogs = document.querySelectorAll('[role="dialog"], .fixed.inset-0');
    for (const d of dialogs) {
      if (d.innerText.includes('项目名称') || d.innerText.includes('新建任务')) {
        return d.innerText.substring(0, 800);
      }
    }
    return document.body.innerText.substring(0, 800);
  });
  console.log('弹窗内容:');
  console.log(modalText);
  console.log();
  
  // Find "添加参与人员" button in the modal
  const addBtn = page.locator('button').filter({ hasText: '添加参与人员' }).first();
  const addCount = await addBtn.count();
  console.log(`添加参与人员按钮: ${addCount > 0 ? '✅' : '❌'} (${addCount}个)`);
  
  if (addCount > 0) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/dropdown_open.png' });
    
    // Find all visible user buttons
    const allBtns = await page.locator('button').all();
    const userBtns = [];
    for (const btn of allBtns) {
      try {
        const text = (await btn.innerText()).trim();
        const isVisible = await btn.isVisible();
        if (isVisible && ['kevin', '001', 'test1', '肖伍秋', 'admin'].includes(text)) {
          userBtns.push(text);
        }
      } catch {}
    }
    console.log(`可见用户按钮: ${JSON.stringify(userBtns)}`);
    
    if (userBtns.length > 0) {
      // Click the first user
      const target = userBtns[0];
      console.log(`\n点击选择: ${target}`);
      const targetBtn = page.locator('button').filter({ hasText: new RegExp(`^${target}$`) }).first();
      await targetBtn.click({ force: true });
      await page.waitForTimeout(800);
      
      await page.screenshot({ path: '/tmp/after_select.png' });
      
      // Check modal for member tags
      const modalAfter = await page.evaluate(() => {
        const dialogs = document.querySelectorAll('[role="dialog"], .fixed.inset-0');
        for (const d of dialogs) {
          if (d.innerText.includes('项目名称') || d.innerText.includes('新建任务')) {
            return d.innerText.substring(0, 800);
          }
        }
        return document.body.innerText.substring(0, 800);
      });
      
      console.log('\n选择后弹窗:');
      console.log(modalAfter);
      
      // Check if member tag appears
      const hasTag = modalAfter.includes(target);
      console.log(`\n${target} 标签出现: ${hasTag ? '✅' : '❌'}`);
    } else {
      console.log('❌ 没有找到可选择的用户按钮');
    }
  }
  
  await browser.close();
})();
