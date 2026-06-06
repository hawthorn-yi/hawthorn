const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Test with local dev server
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('=== 1. 注册新测试用户 ===');
  // Click register link
  const registerLink = page.locator('a, button').filter({ hasText: '注册' }).first();
  if (await registerLink.count() > 0) {
    await registerLink.click();
    await page.waitForTimeout(2000);
  }
  
  const regText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('注册页:', regText.substring(0, 200));
  
  // Register new user
  const regInputs = await page.locator('input').all();
  if (regInputs.length >= 2) {
    const testUser = 'testdebug' + Date.now().toString(36).slice(-4);
    await regInputs[0].fill(testUser);
    await regInputs[1].fill('test1234');
    
    const regBtn = page.locator('button').filter({ hasText: /注册/ }).first();
    if (await regBtn.count() > 0) {
      await regBtn.click();
      await page.waitForTimeout(3000);
      const afterReg = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('注册后:', afterReg.substring(0, 200));
      
      if (afterReg.includes('新建任务') || afterReg.includes('任务面板')) {
        console.log('✅ 注册并登录成功');
        
        // Click new task button
        const newTaskBtn = page.locator('button').filter({ hasText: /新建/ }).first();
        if (await newTaskBtn.count() > 0) {
          await newTaskBtn.click();
          await page.waitForTimeout(2000);
          
          const modalText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
          console.log('\n=== 2. 新建任务弹窗 ===');
          console.log(modalText);
          
          // Check member selector
          const hasMemberArea = modalText.includes('有权查看项目的人员');
          console.log('\n成员选择区域可见:', hasMemberArea);
          
          if (hasMemberArea) {
            // Fill required fields first
            const nameInput = page.locator('input').first();
            if (await nameInput.count() > 0) {
              await nameInput.fill('测试成员选择项目');
            }
            
            // Click "添加参与人员"
            const addBtn = page.locator('button').filter({ hasText: '添加参与人员' }).first();
            if (await addBtn.count() > 0) {
              await addBtn.click();
              await page.waitForTimeout(1000);
              
              // Screenshot the dropdown
              await page.screenshot({ path: '/tmp/dropdown.png' });
              console.log('📸 下拉截图已保存');
              
              // Get dropdown items
              const dropdownItems = await page.evaluate(() => {
                const allBtns = document.querySelectorAll('button');
                const items = [];
                for (const btn of allBtns) {
                  const text = btn.innerText.trim();
                  if (text && text.length < 20 && !text.includes('添加') && !text.includes('新建') && !text.includes('登录') && !text.includes('注册')) {
                    const parent = btn.closest('[class*="absolute"], [class*="dropdown"], [class*="z-20"]');
                    if (parent) {
                      items.push(text);
                    }
                  }
                }
                return items;
              });
              console.log('下拉列表项:', JSON.stringify(dropdownItems));
              
              // Try clicking on a user
              const allBtns = await page.locator('button').all();
              let clicked = false;
              for (const btn of allBtns) {
                const text = await btn.innerText();
                if (text.includes('肖伍秋') || text.includes('test1') || text.includes('kevin') || text.includes('admin')) {
                  console.log(`\n点击选择: ${text.trim()}`);
                  await btn.click();
                  await page.waitForTimeout(500);
                  clicked = true;
                  break;
                }
              }
              
              if (clicked) {
                await page.screenshot({ path: '/tmp/after_select.png' });
                console.log('📸 选择后截图已保存');
                
                const afterText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
                console.log('\n选择后的弹窗:');
                console.log(afterText);
                
                // Check if member tag appeared
                const hasTag = afterText.includes('肖伍秋') || afterText.includes('test1') || afterText.includes('kevin');
                console.log('\n成员标签出现:', hasTag);
              } else {
                console.log('❌ 未找到可点击的用户');
              }
            } else {
              console.log('❌ 添加参与人员按钮未找到');
            }
          }
        }
      }
    }
  }
  
  await browser.close();
})();
