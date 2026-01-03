import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'docs', 'screenshots');

async function takeScreenshots() {
  const browser = await chromium.launch();

  // Desktop viewport for TV and Admin
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  // Mobile viewport for Buzzer
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  console.log('Taking screenshots...');

  // 1. Landing Page
  console.log('1. Landing Page');
  const landingPage = await desktopContext.newPage();
  await landingPage.goto('http://localhost:3000');
  await landingPage.waitForLoadState('networkidle');
  await landingPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, '01-landing-page.png'),
    fullPage: false
  });
  await landingPage.close();

  // 2. TV Display - Lobby
  console.log('2. TV Display - Lobby');
  const tvPage = await desktopContext.newPage();
  await tvPage.goto('http://localhost:3000/tv');
  await tvPage.waitForLoadState('networkidle');
  // Wait for socket connection and lobby to appear
  await tvPage.waitForTimeout(3000);
  // Try to wait for the lobby content (teams display)
  try {
    await tvPage.waitForSelector('text=Golden Friends', { timeout: 5000 });
  } catch (e) {
    console.log('  (waiting for lobby content...)');
  }
  await tvPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, '02-tv-lobby.png'),
    fullPage: false
  });

  // 3. TV Display with Host Mode (press H)
  console.log('3. TV Display - Host Mode');
  await tvPage.keyboard.press('h');
  await tvPage.waitForTimeout(500);
  await tvPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, '03-tv-host-mode.png'),
    fullPage: false
  });
  await tvPage.close();

  // 4. Admin Panel (need to login first)
  console.log('4. Admin Panel');
  const adminPage = await desktopContext.newPage();
  await adminPage.goto('http://localhost:3000/admin');
  await adminPage.waitForLoadState('networkidle');

  // Fill in password and login
  const passwordInput = await adminPage.$('input[type="password"]');
  if (passwordInput) {
    await passwordInput.fill('admin');
    await adminPage.waitForTimeout(200);
    // Click the Enter button
    await adminPage.click('button:has-text("Enter")');
    // Wait for the admin dashboard to load
    await adminPage.waitForTimeout(2000);
    try {
      await adminPage.waitForSelector('text=Contest', { timeout: 5000 });
    } catch (e) {
      console.log('  (waiting for admin dashboard...)');
    }
  }
  await adminPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, '04-admin-panel.png'),
    fullPage: false
  });
  await adminPage.close();

  // 5. Buzzer - Team Selection (Mobile)
  console.log('5. Buzzer - Team Selection');
  const buzzerPage = await mobileContext.newPage();
  await buzzerPage.goto('http://localhost:3000/buzzer');
  await buzzerPage.waitForLoadState('networkidle');
  await buzzerPage.waitForTimeout(500);
  await buzzerPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, '05-buzzer-team-selection.png'),
    fullPage: false
  });

  // 6. Fill name and show team buttons
  console.log('6. Buzzer with name filled');
  const nameInput = await buzzerPage.$('input[type="text"]');
  if (nameInput) {
    await nameInput.fill('Player 1');
    await buzzerPage.waitForTimeout(300);
  }
  await buzzerPage.screenshot({
    path: path.join(SCREENSHOTS_DIR, '06-buzzer-with-name.png'),
    fullPage: false
  });
  await buzzerPage.close();

  await browser.close();
  console.log('Screenshots saved to docs/screenshots/');
}

takeScreenshots().catch(console.error);
