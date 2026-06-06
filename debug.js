const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://hawthorn-yi.github.io/hawthorn/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Try to login
  const inputs = await page.locator('input').all();
  // Try 001/001 
  if (inputs.length >= 2) {
    await inputs[0].fill('001');
    await inputs[1].fill('001');
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.innerText();
      if (text.includes('登录')) {
        await btn.click();
        await page.waitForTimeout(3000);
        break;
      }
    }
  }
  
  const currentText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('登录后:', currentText.substring(0, 200));
  
  if (currentText.includes('用户名或密码错误')) {
    // Try kevin with various passwords
    console.log('尝试 kevin...');
    const inputs2 = await page.locator('input').all();
    for (const pwd of ['001', 'kevin', '1234', '0000', '888888']) {
      await inputs2[0].fill('kevin');
      await inputs2[1].fill(pwd);
      const buttons = await page.locator('button').all();
      for (const btn of buttons) {
        const text = await btn.innerText();
        if (text.includes('登录')) {
          await btn.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
      const txt = await page.evaluate(() => document.body.innerText.substring(0, 200));
      if (!txt.includes('用户名或密码错误')) {
        console.log(`✅ kevin 登录成功! 密码: ${pwd}`);
        break;
      }
    }
  }
  
  // Check if we can see the new task button
  const hasNewTask = await page.evaluate(() => {
    return document.body.innerText.includes('新建任务') || document.body.innerText.includes('新建');
  });
  console.log('新建任务按钮可见:', hasNewTask);
  
  if (hasNewTask) {
    // Click new task button
    const newTaskBtn = page.locator('button').filter({ hasText: /新建/ }).first();
    if (await newTaskBtn.count() > 0) {
      await newTaskBtn.click();
      await page.waitForTimeout(2000);
      
      const modalText = await page.evaluate(() => document.body.innerText.substring(0, 800));
      console.log('\n新建任务弹窗内容:');
      console.log(modalText);
      
      // Check for member selector
      const hasMemberSelector = modalText.includes('有权查看') || modalText.includes('添加参与人员');
      console.log('\n成员选择器可见:', hasMemberSelector);
      
      if (hasMemberSelector) {
        // Click "添加参与人员" button
        const addMemberBtn = page.locator('button').filter({ hasText: '添加参与人员' }).first();
        if (await addMemberBtn.count() > 0) {
          await addMemberBtn.click();
          await page.waitForTimeout(1000);
          
          // Get dropdown content
          const dropdownText = await page.evaluate(() => {
            // Find the dropdown by looking for elements with specific classes
            const allDivs = document.querySelectorAll('div');
            for (const div of allDivs) {
              const text = div.innerText.trim();
              if (text.includes('肖伍秋') || text.includes('test1')) {
                return text;
              }
            }
            return 'DROPDOWN NOT FOUND';
          });
          console.log('\n下拉列表内容:');
          console.log(dropdownText);
          
          // Try clicking a user in the dropdown
          const userBtn = page.locator('button').filter({ hasText: 'test1' }).first();
          if (await userBtn.count() > 0) {
            console.log('\n尝试选择 test1...');
            await userBtn.click();
            await page.waitForTimeout(500);
            
            // Check if selected
            const afterSelect = await page.evaluate(() => document.body.innerText.substring(0, 800));
            console.log('选择后的弹窗内容:');
            console.log(afterSelect);
            
            // Check if the member appears in the tag area
            const hasMemberTag = afterSelect.includes('test1');
            console.log('\ntest1 是否出现在成员标签中:', hasMemberTag);
          }
        }
      }
    }
  }
  
  await browser.close();
})();
