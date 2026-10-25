/** Assert the shipped header geometry and real keyboard/theme behaviour. */
export async function checkSiteShell(page) {
  const issues = [];
  const skip = await page.$('a[href="#main-content"]');
  await skip.focus();
  const skipVisible = await skip.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return node === top || node.contains(top);
  });
  if (!skipVisible) issues.push('focused skip link is covered by the header');
  const settle = () => page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  for (const width of [1440, 1024, 1023, 390, 320]) {
    await page.setViewport({ width, height: 844 });
    await settle();
    const state = await page.evaluate(() => {
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
        locales: locale.map((node) => node.hreflang).sort(),
        themeSize: picker && [picker.getBoundingClientRect().width, picker.getBoundingClientRect().height],
        font: picker && getComputedStyle(picker).fontFamily,
        scroll: document.documentElement.scrollWidth,
      };
    });
    if (!state) { issues.push('shared header missing'); break; }
    if (Math.abs(state.height - (width >= 1024 ? 72 : 64)) > 1) issues.push(`${width}px: header height ${state.height}`);
    if (state.position !== 'sticky') issues.push(`${width}px: header is not sticky`);
    if (state.logo?.some((value) => value !== 44)) issues.push(`${width}px: symbol dimensions ${state.logo}`);
    if (state.locales.join() !== 'de,en') issues.push(`${width}px: language links hidden or missing`);
    if (!state.themeSize || state.themeSize.some((value) => value < 48)) issues.push(`${width}px: theme target smaller than 48px`);
    if (!state.font?.includes('Raleway')) issues.push(`${width}px: theme control uses ${state.font}`);
    if (state.scroll > width + 1) issues.push(`${width}px: page overflows to ${state.scroll}`);
  }
  const themeSummary = '[data-nr-theme-picker] > summary';
  const radio = (value) => `input[name="nr-shell-theme"][value="${value}"]`;
  for (const preference of ['dark', 'light', 'system']) {
    if (!(await page.$eval('[data-nr-theme-picker]', (node) => node.open))) await page.click(themeSummary);
    await page.click(radio(preference));
    const state = await page.evaluate(() => ({
      preference: document.documentElement.dataset.themePreference,
      effective: document.documentElement.dataset.theme,
      stored: localStorage.getItem('nr-theme'),
      dark: document.documentElement.classList.contains('dark'),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      headerBackground: getComputedStyle(document.querySelector('[data-nr-shell]')).backgroundColor,
    }));
    if (state.preference !== preference || state.stored !== preference) issues.push(`theme ${preference}: choice not reflected/persisted`);
    if (preference !== 'system' && state.effective !== preference) issues.push(`theme ${preference}: wrong effective scheme ${state.effective}`);
    if (state.dark !== (state.effective === 'dark')) issues.push(`theme ${preference}: Tailwind scheme differs`);
    if (state.bodyBackground !== state.headerBackground) issues.push(`theme ${preference}: body and header schemes differ`);
    if (preference === 'dark') {
      await page.reload({ waitUntil: 'networkidle0' });
      if (!(await page.$eval('html', (node) => node.dataset.themePreference === 'dark' && node.dataset.theme === 'dark'))) {
        issues.push('explicit dark choice does not survive a reload');
      }
    }
  }
  await page.focus(themeSummary);
  await page.keyboard.press('Enter');
  if (!(await page.$eval('[data-nr-theme-picker]', (node) => node.open))) await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  if (!(await page.$eval(themeSummary, (node) => document.activeElement === node))) issues.push('theme Escape does not return focus');
  if (await page.$eval('[data-nr-theme-picker]', (node) => node.open)) issues.push('theme Escape leaves panel open');
  const menuSummary = '[data-nr-mobile-menu] > summary';
  await page.focus(menuSummary);
  await page.keyboard.press('Enter');
  if (!(await page.$eval('[data-nr-mobile-menu]', (node) => node.open))) issues.push('mobile menu cannot open with keyboard');
  await page.keyboard.press('Escape');
  if (!(await page.$eval(menuSummary, (node) => document.activeElement === node))) issues.push('mobile menu Escape does not return focus');
  if (await page.$eval('[data-nr-mobile-menu]', (node) => node.open)) issues.push('mobile menu Escape leaves panel open');
  const pageMenu = await page.$('[data-nr-page-menu]');
  if (pageMenu) {
    if (await pageMenu.evaluate((node) => node.open)) issues.push('local navigation should start collapsed on mobile');
    const trigger = await pageMenu.$('summary');
    await trigger.focus();
    await page.keyboard.press('Enter');
    if (!(await pageMenu.evaluate((node) => node.open))) issues.push('local navigation cannot open with keyboard');
    await page.keyboard.press('Escape');
    if (!(await trigger.evaluate((node) => document.activeElement === node))) issues.push('local navigation Escape does not return focus');
    await trigger.click();
    const link = await pageMenu.$('a[href^="#"]');
    if (link) {
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
  }
  await page.setViewport({ width: 1280, height: 900 });
  return issues;
}

export async function checkSiteShellWithoutJavaScript(browser, url, scheme) {
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await page.setViewport({ width: 320, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.click('[data-nr-mobile-menu] > summary');
    const issues = await page.evaluate((scheme) => {
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
    await page.click('[data-nr-mobile-menu] > summary');
    const localTrigger = await page.$('[data-nr-page-menu] > summary');
    if (localTrigger) {
      await localTrigger.click();
      if (!(await page.$eval('[data-nr-page-menu]', (node) => node.open))) issues.push('local navigation does not open without JavaScript');
    }
    return issues;
  } finally {
    await page.close();
  }
}
