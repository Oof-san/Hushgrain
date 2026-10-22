import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';
const snapshot = (name: string) =>
  resolve(process.env.SCREENSHOT_DIR || 'test-results/previews', name);
async function ready(page: Page) {
  await expect(page.locator('header')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) => {
        image.loading = 'eager';
        if (image.complete) return;
        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      }),
    );
  });
}
test('portfolio orders work when every server function is unavailable', async ({ page }) => {
  const apiRequests: string[] = [];
  await page.route('**/api/**', async (route) => {
    apiRequests.push(route.request().url());
    await route.fulfill({
      status: 500,
      contentType: 'text/plain',
      body: 'FUNCTION_INVOCATION_FAILED',
    });
  });
  await page.goto('/menu');
  await ready(page);
  await page.getByRole('button', { name: 'Add House Flat White to tray', exact: true }).click();
  await page.goto('/checkout');
  await page.getByLabel('Your name', { exact: true }).fill('Alex Demo');
  await page.getByLabel('Phone number', { exact: true }).fill('09000000000');
  await page.getByRole('button', { name: 'Place demo order · ₱180' }).click();
  await expect(page).toHaveURL(/confirmation\/HG-/);
  await expect(page.locator('.order-card')).toContainText('₱180');
  await page.goto('/owner');
  await expect(page.locator('.board-order').filter({ hasText: 'Alex Demo' })).toHaveCount(1);
  expect(apiRequests).toEqual([]);
});
test('menu category, search, vegan filter, item details, and keyboard dismiss', async ({
  page,
}) => {
  await page.goto('/menu');
  await ready(page);
  await page.getByRole('button', { name: 'From the Oven', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'All good things', exact: true }).click();
  await page.getByLabel('Search the menu').fill('coconut');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'View Coconut Cloud details' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Contains coconut.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search the menu').fill('');
  await page.getByLabel('Vegan options').check();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await page.getByLabel('Search the menu').fill('nothing-matches');
  await expect(page.getByRole('heading', { name: 'No match, this time.' })).toBeVisible();
});
test('pickup checkout persists and the owner can progress the same tracked order', async ({
  page,
}) => {
  await page.goto('/menu');
  await ready(page);
  await page.getByRole('button', { name: 'Add House Flat White to tray', exact: true }).click();
  await page.getByRole('button', { name: 'Add House Flat White to tray', exact: true }).click();
  await page.getByRole('button', { name: 'Add Brown Butter Kouign to tray', exact: true }).click();
  await page.getByRole('button', { name: 'Open your tray, 3 items' }).click();
  await page.getByLabel('Special instructions for House Flat White').fill('Oat milk please');
  await expect(page.getByRole('dialog')).toContainText('₱520');
  await page.getByRole('link', { name: 'Continue to checkout' }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Alex Demo');
  await page.getByLabel('Phone number', { exact: true }).fill('09000000000');
  await page.getByLabel('Email optional').fill('alex@example.com');
  await page.screenshot({ path: snapshot('Hushgrain-checkout-1280.png'), fullPage: true });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Place demo order · ₱520' }).click();
  await expect(page).toHaveURL(/confirmation\/HG-/);
  const reference = page.url().split('/').pop()!;
  await expect(page.locator('.order-card')).toContainText('₱520');
  await page.screenshot({ path: snapshot('Hushgrain-confirmation-1280.png'), fullPage: true });
  await page.reload();
  await expect(page.locator('.order-card')).toContainText(reference);
  await page.goto('/owner');
  await ready(page);
  let card = page.locator('.board-order').filter({ hasText: reference });
  await expect(card).toContainText('Oat milk please');
  await card.getByRole('button', { name: 'Start preparing' }).click();
  await expect(card.getByRole('button', { name: 'Mark as ready' })).toBeVisible();
  await card.getByRole('button', { name: 'Mark as ready' }).click();
  await page.goto(`/track?order=${reference}`);
  await expect(page.getByRole('heading', { name: 'Ready when you are.' })).toBeVisible();
  await page.goto('/owner');
  card = page.locator('.board-order').filter({ hasText: reference });
  await card.getByRole('button', { name: 'Complete order' }).click();
  await page.getByLabel('Filter orders').selectOption('completed');
  await expect(page.locator('.board-order').filter({ hasText: reference })).toContainText(
    'A good moment, enjoyed.',
  );
});
test('dine-in checkout requires a table and preserves the fulfillment choice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/menu');
  await ready(page);
  await page.getByRole('button', { name: 'Add House Flat White to tray', exact: true }).click();
  await page.goto('/checkout');
  await page.getByRole('button', { name: /Make yourself at home/ }).click();
  await page.getByLabel('Your table number').fill('Table 04');
  await page.getByLabel('Your name', { exact: true }).fill('Jamie Demo');
  await page.getByLabel('Phone number', { exact: true }).fill('09000000000');
  await page.screenshot({ path: snapshot('Hushgrain-checkout-390.png'), fullPage: true });
  await page.getByRole('button', { name: 'Place demo order · ₱180' }).click();
  await expect(page).toHaveURL(/confirmation\/HG-/);
  const reference = page.url().split('/').pop()!;
  await expect(page.locator('.order-card')).toContainText(reference);
  await page.screenshot({ path: snapshot('Hushgrain-confirmation-390.png'), fullPage: true });
  await page.goto('/owner');
  await expect(page.locator('.board-order').filter({ hasText: reference })).toContainText(
    'Dine-in · Table 04',
  );
});
test('owner edits prices and availability with visible storefront results', async ({ page }) => {
  await page.goto('/owner');
  await ready(page);
  await page.getByRole('button', { name: 'The menu', exact: true }).click();
  const editor = page.locator('.admin-menu-row').first();
  await editor.getByLabel('Name for House Flat White').fill('Signature Flat White');
  await editor.getByLabel('Price for House Flat White').fill('199.50');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(editor.getByLabel('Name for Signature Flat White')).toBeVisible();
  await editor.getByLabel('Available', { exact: true }).uncheck();
  await page.goto('/menu');
  await ready(page);
  await page.getByLabel('Search the menu').fill('Signature Flat White');
  await expect(page.locator('.product-card')).toContainText('₱199.50');
  await expect(
    page.getByRole('button', { name: 'Add Signature Flat White to tray' }),
  ).toBeDisabled();
});
test('settings, featured selections, themes, and reset are functional', async ({ page }) => {
  await page.goto('/owner');
  await ready(page);
  await page.getByRole('button', { name: 'The little details' }).click();
  await page.getByLabel('Accept online orders').uncheck();
  await expect(page.locator('.notice')).toBeVisible();
  await page.getByRole('button', { name: /After Hours/ }).click();
  await expect(page.locator('.site')).toHaveClass(/theme-midnight/);
  await page.reload();
  await expect(page.locator('.site')).toHaveClass(/theme-midnight/);
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Reset this demo' }).click();
  await expect(page.locator('.site')).toHaveClass(/theme-espresso/);
  await expect(page.locator('.notice')).toHaveCount(0);
});
for (const width of [1440, 768, 390, 320]) {
  test(`responsive layout and all images at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [route, name] of [
      ['/', 'home'],
      ['/menu', 'menu'],
      ['/track', 'tracking'],
      ['/owner', 'workspace'],
    ] as const) {
      await page.goto(route);
      await ready(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page.locator('img').evaluateAll((images) =>
          images
            .map((image) => image as HTMLImageElement)
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.src),
        ),
      ).toEqual([]);
      if (width !== 320)
        await page.screenshot({
          path: snapshot(`Hushgrain-${name}-${width}.png`),
          fullPage: true,
        });
      if (route === '/' && width !== 320)
        await page.screenshot({ path: snapshot(`Hushgrain-first-screen-${width}.png`) });
    }
    expect(errors).toEqual([]);
    if (width < 768) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
      await page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'The menu' })
        .click();
      await expect(page).toHaveURL(/menu/);
    }
    await page.locator('footer').getByRole('link', { name: 'Hushgrain home' }).click();
    await expect(page.locator('#hero')).toBeVisible();
    await page.locator('#visit').scrollIntoViewIfNeeded();
    await page.locator('header').getByRole('link', { name: 'Hushgrain home' }).click();
    await expect
      .poll(() => page.evaluate(() => document.getElementById('hero')!.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(0);
  });
}
test('core screens pass automated WCAG A and AA checks', async ({ page }) => {
  for (const route of ['/', '/menu', '/track', '/owner']) {
    await page.goto(route);
    await ready(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      route,
    ).toEqual([]);
  }
  await page.getByRole('button', { name: 'The menu', exact: true }).click();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'The little details' }).click();
  for (const theme of ['Sage & Linen', 'After Hours']) {
    await page.getByRole('button', { name: new RegExp(theme) }).click();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
});
