const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://hawthorn-yi.github.io/hawthorn/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('=== 1. 登录 ===');
  const inputs = await page.locator('input').all();
  await inputs[0].fill('admin');
  await inputs[1].fill('admin');
  
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const text = await btn.innerText();
    if (text.includes('登录')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(4000);
  
  const dashText = await page.evaluate(() => document.body.innerText.substring(0, 1200));
  console.log(dashText);
  console.log();
  
  // 2. Footer
  console.log('=== 2. Footer ===');
  const footer = await page.evaluate(() => {
    const el = document.querySelector('footer');
    return el ? el.innerText : 'NOT FOUND';
  });
  console.log(footer);
  console.log();
  
  // 3. Nav items
  console.log('=== 3. 导航项 ===');
  const navItems = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return ['NO NAV'];
    const items = nav.querySelectorAll('button');
    return Array.from(items).map(b => b.innerText.replace(/\n/g, ' ').trim()).filter(t => t && t.length < 30);
  });
  navItems.forEach((item, i) => console.log('  ' + (i+1) + '. ' + item));
  
  // 4. Top bar
  console.log();
  console.log('=== 4. 顶部栏 ===');
  const topBar = await page.evaluate(() => {
    const header = document.querySelector('header');
    return header ? header.innerText.substring(0, 300) : 'NOT FOUND';
  });
  console.log(topBar);
  
  // 5. User menu
  console.log();
  console.log('=== 5. 用户菜单 ===');
  // Click user avatar
  const userBtn = page.locator('header button').filter({ hasText: /^[A-Z]$/ }).first();
  if (await userBtn.count() > 0) {
    await userBtn.click();
    await page.waitForTimeout(1000);
    
    const menuText = await page.evaluate(() => {
      // Find dropdown menu
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        if (div.innerText.includes('账户管理') && div.innerText.includes('退出登录')) {
          return div.innerText.trim();
        }
      }
      return 'MENU NOT FOUND';
    });
    console.log(menuText);
  }
  
  // 6. Check for project cards with members
  console.log();
  console.log('=== 6. 项目卡片成员标签 ===');
  const memberTags = await page.evaluate(() => {
    const tags = document.querySelectorAll('[class*="rounded-full"]');
    const memberLike = Array.from(tags).filter(t => {
      const text = t.innerText.trim();
      return text.length > 1 && text.length < 15 && !text.includes('%') && !text.includes('进行') && !text.includes('完成') && !text.includes('逾期');
    }).map(t => t.innerText.trim());
    return memberLike.slice(0, 10);
  });
  console.log('成员相关标签:', JSON.stringify(memberTags));
  
  // 7. Navigate to follow-up page
  console.log();
  console.log('=== 7. 跟进任务页面 ===');
  try {
    await page.goto('https://hawthorn-yi.github.io/hawthorn/#/follow-up', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const followUpText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log(followUpText);
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  // 8. Navigate to account page
  console.log();
  console.log('=== 8. 账户管理页面 ===');
  try {
    await page.goto('https://hawthorn-yi.github.io/hawthorn/#/account', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const accountText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log(accountText);
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
  console.log();
  console.log('=== 全部验证完成 ===');
})();
