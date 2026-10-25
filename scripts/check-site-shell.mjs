/** Assert the shipped header geometry and real keyboard/theme behaviour. */
const THEME_PICKER = '[data-nr-theme-picker]';
const THEME_SUMMARY = `${THEME_PICKER} > summary`;
const MOBILE_MENU = '[data-nr-mobile-menu]';
const MOBILE_SUMMARY = `${MOBILE_MENU} > summary`;
const PAGE_MENU = '[data-nr-page-menu]';

// Steps change the same page; chain them instead of racing mutable state.
function sequential(values, step) {
  return values.reduce((previous, value) => previous.then(() => step(value)), Promise.resolve());
}

async function checkSkipLink(page, issues) {
  const skip = await page.$('a[href="#main-content"]');
  await skip.focus();
  const visible = await skip.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return node === top || node.contains(top);
  });
  if (!visible) issues.push('focused skip link is covered by the header');
}

function settle(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

function viewportState(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('[data-nr-shell]');
    if (!shell) return null;
    const rect = shell.getBoundingClientRect();
    const locale = [...shell.querySelectorAll('a[hreflang]')].filter((node) => node.getClientRects().length);
    const picker = shell.querySelector('[data-nr-theme-picker] > summary');
    const logo = shell.querySelector('img');
    return {
      height: rect.height,
      position: getComputedStyle(shell).position,
      logo: [logo?.width, logo?.height],
      locales: locale.map((node) => node.hreflang).sort((left, right) => left.localeCompare(right)),
      themeSize: picker && [picker.getBoundingClientRect().width, picker.getBoundingClientRect().height],
      font: picker && getComputedStyle(picker).fontFamily,
      scroll: document.documentElement.scrollWidth,
    };
  });
}

function validateViewport(state, width, issues) {
  if (Math.abs(state.height - (width >= 1024 ? 72 : 64)) > 1) issues.push(`${width}px: header height ${state.height}`);
  if (state.position !== 'sticky') issues.push(`${width}px: header is not sticky`);
  if (state.logo?.some((value) => value !== 44)) issues.push(`${width}px: symbol dimensions ${state.logo}`);
  if (state.locales.join() !== 'de,en') issues.push(`${width}px: language links hidden or missing`);
  if (!state.themeSize || state.themeSize.some((value) => value < 48)) issues.push(`${width}px: theme target smaller than 48px`);
  if (!state.font?.includes('Raleway')) issues.push(`${width}px: theme control uses ${state.font}`);
  if (state.scroll > width + 1) issues.push(`${width}px: page overflows to ${state.scroll}`);
}

async function checkViewports(page, issues) {
  let missing = false;
  await sequential([1440, 1024, 1023, 390, 320], async (width) => {
    if (missing) return;
    await page.setViewport({ width, height: 844 });
    await settle(page);
    const state = await viewportState(page);
    if (!state) {
      issues.push('shared header missing');
      missing = true;
      return;
    }
    validateViewport(state, width, issues);
  });
}

function themeState(page) {
  return page.evaluate(() => ({
    preference: document.documentElement.dataset.themePreference,
    effective: document.documentElement.dataset.theme,
    stored: localStorage.getItem('nr-theme'),
    dark: document.documentElement.classList.contains('dark'),
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    headerBackground: getComputedStyle(document.querySelector('[data-nr-shell]')).backgroundColor,
  }));
}

function validateTheme(state, preference, issues) {
  if (state.preference !== preference || state.stored !== preference) issues.push(`theme ${preference}: choice not reflected/persisted`);
  if (preference !== 'system' && state.effective !== preference) issues.push(`theme ${preference}: wrong effective scheme ${state.effective}`);
  if (state.dark !== (state.effective === 'dark')) issues.push(`theme ${preference}: Tailwind scheme differs`);
  if (state.bodyBackground !== state.headerBackground) issues.push(`theme ${preference}: body and header schemes differ`);
}

async function checkPreference(page, preference, issues) {
  if (!(await page.$eval(THEME_PICKER, (node) => node.open))) await page.click(THEME_SUMMARY);
  await page.click(`input[name="nr-shell-theme"][value="${preference}"]`);
  validateTheme(await themeState(page), preference, issues);
  if (preference === 'dark') {
    await page.reload({ waitUntil: 'networkidle0' });
    if (!(await page.$eval('html', (node) => node.dataset.themePreference === 'dark' && node.dataset.theme === 'dark'))) {
      issues.push('explicit dark choice does not survive a reload');
    }
  }
}

async function checkThemeEscape(page, issues) {
  await page.focus(THEME_SUMMARY);
  await page.keyboard.press('Enter');
  if (!(await page.$eval(THEME_PICKER, (node) => node.open))) await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  if (!(await page.$eval(THEME_SUMMARY, (node) => document.activeElement === node))) issues.push('theme Escape does not return focus');
  if (await page.$eval(THEME_PICKER, (node) => node.open)) issues.push('theme Escape leaves panel open');
}

async function checkGlobalMenu(page, issues) {
  await page.focus(MOBILE_SUMMARY);
  await page.keyboard.press('Enter');
  if (!(await page.$eval(MOBILE_MENU, (node) => node.open))) issues.push('mobile menu cannot open with keyboard');
  await page.keyboard.press('Escape');
  if (!(await page.$eval(MOBILE_SUMMARY, (node) => document.activeElement === node))) issues.push('mobile menu Escape does not return focus');
  if (await page.$eval(MOBILE_MENU, (node) => node.open)) issues.push('mobile menu Escape leaves panel open');
}

async function checkLocalAnchor(page, pageMenu, link, issues) {
  const target = await link.evaluate((node) => node.hash);
  await link.click();
  await page.waitForFunction((hash) => {
    const node = document.querySelector(hash);
    const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
    return Math.abs(node.getBoundingClientRect().top - padding - margin) < 2;
  }, {}, target);
  const uncovered = await page.evaluate((hash) => {
    const node = document.querySelector(hash).querySelector('h1,h2,h3');
    const rect = node.getBoundingClientRect();
    const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return (node === top || node.contains(top)) && rect.top >= document.querySelector('[data-nr-shell]').getBoundingClientRect().bottom;
  }, target);
  if (!uncovered) issues.push('local navigation anchor heading is covered by the sticky header');
  if (await pageMenu.evaluate((node) => node.open)) issues.push('local navigation remains open after link activation');
}

async function checkLocalMenu(page, issues) {
  const pageMenu = await page.$(PAGE_MENU);
  if (!pageMenu) return;
  if (await pageMenu.evaluate((node) => node.open)) issues.push('local navigation should start collapsed on mobile');
  const trigger = await pageMenu.$('summary');
  await trigger.focus();
  await page.keyboard.press('Enter');
  if (!(await pageMenu.evaluate((node) => node.open))) issues.push('local navigation cannot open with keyboard');
  await page.keyboard.press('Escape');
  if (!(await trigger.evaluate((node) => document.activeElement === node))) issues.push('local navigation Escape does not return focus');
  await trigger.click();
  const link = await pageMenu.$('a[href^="#"]');
  if (link) await checkLocalAnchor(page, pageMenu, link, issues);
}

export async function checkSiteShell(page) {
  const issues = [];
  await checkSkipLink(page, issues);
  await checkViewports(page, issues);
  await sequential(['dark', 'light', 'system'], (preference) => checkPreference(page, preference, issues));
  await checkThemeEscape(page, issues);
  await checkGlobalMenu(page, issues);
  await checkLocalMenu(page, issues);
  await page.setViewport({ width: 1280, height: 900 });
  return issues;
}

function noScriptState(page, scheme) {
  return page.evaluate((scheme) => {
    const issues = [];
    const expected = scheme === 'dark' ? 'rgb(20, 24, 27)' : 'rgb(255, 255, 255)';
    const body = getComputedStyle(document.body).backgroundColor;
    const header = getComputedStyle(document.querySelector('[data-nr-shell]')).backgroundColor;
    if (body !== expected || header !== expected) issues.push(`no-JavaScript ${scheme}: body/header palette differs (${body}; ${header})`);
    const menu = document.querySelector('[data-nr-mobile-menu]');
    if (!menu?.open) issues.push('native mobile menu does not open without JavaScript');
    for (const node of menu?.querySelectorAll('a') ?? []) {
      if (!node.getClientRects().length) issues.push(`no-JavaScript menu link hidden: ${node.textContent}`);
    }
    return issues;
  }, scheme);
}

async function checkLocalMenuWithoutJavaScript(page, issues) {
  const trigger = await page.$(`${PAGE_MENU} > summary`);
  if (trigger) {
    await trigger.click();
    if (!(await page.$eval(PAGE_MENU, (node) => node.open))) issues.push('local navigation does not open without JavaScript');
  }
}

export async function checkSiteShellWithoutJavaScript(browser, url, scheme) {
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await page.setViewport({ width: 320, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.click(MOBILE_SUMMARY);
    const issues = await noScriptState(page, scheme);
    await page.click(MOBILE_SUMMARY);
    await checkLocalMenuWithoutJavaScript(page, issues);
    return issues;
  } finally {
    await page.close();
  }
}
