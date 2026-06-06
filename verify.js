const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://hawthorn-yi.github.io/hawthorn/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 600));
  console.log('=== 登录页文本 ===');
  console.log(bodyText);
  console.log();
  
  // Try to login as admin
  const inputs = await page.locator('input').all();
  if (inputs.length >= 2) {
    await inputs[0].fill('kevin');
    await inputs[1].fill('kevin123');
    
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.innerText();
      if (text.includes('登录')) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(4000);
  }
  
  const dashText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('=== 登录后页面文本 ===');
  console.log(dashText);
  console.log();
  
  // Check footer
  const footer = await page.evaluate(() => {
    const el = document.querySelector('footer');
    return el ? el.innerText : 'NO FOOTER FOUND';
  });
  console.log('=== Footer ===');
  console.log(footer);
  console.log();
  
  // Check nav items
  const navItems = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return ['NO NAV'];
    const items = nav.querySelectorAll('button');
    return Array.from(items).map(b => b.innerText.replace(/\n/g, ' ').trim()).filter(t => t && t.length < 30);
  });
  console.log('=== 导航项 ===');
  navItems.forEach((item, i) => console.log('  ' + (i+1) + '. ' + item));
  
  // Check top bar for follow-up count
  const topBarText = await page.evaluate(() => {
    const header = document.querySelector('header');
    return header ? header.innerText.substring(0, 300) : 'NO HEADER';
  });
  console.log();
  console.log('=== 顶部栏 ===');
  console.log(topBarText);
  
  // Check user menu
  const userAvatar = await page.locator('header button').filter({ hasText: 'kevin' }).first();
  if (await userAvatar.count() > 0) {
    await userAvatar.click();
    await page.waitForTimeout(1000);
    const menuText = await page.evaluate(() => document.body.innerText);
    console.log();
    console.log('=== 用户菜单展开后 ===');
    // Find the menu items
    const menuItems = await page.evaluate(() => {
      const menus = document.querySelectorAll('[class*="absolute"][class*="bg-white"][class*="rounded"]');
      for (const menu of menus) {
        const text = menu.innerText.trim();
        if (text.includes('账户管理') || text.includes('退出登录')) {
          return text;
        }
      }
      return 'MENU NOT FOUND';
    });
    console.log(menuItems);
  }
  
  await browser.close();
})();
