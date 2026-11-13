const { test, expect } = require('@playwright/test');
const seriesSlug = process.env.TVWEB_SERIES_SLUG || 'tu-khi-toi-lam-gia-su-cho-ke-thu';

const errors = new Map();
test.beforeEach(async ({ page }, testInfo) => {
  const issues = [];
  errors.set(testInfo.testId, issues);
  page.on('pageerror', error => issues.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(new URL(testInfo.project.use.baseURL || process.env.TVWEB_URL || 'http://localhost:5125').origin) && response.status() >= 500) {
      issues.push(`${response.status()} ${response.url()}`);
    }
  });
});
test.afterEach(async ({}, testInfo) => {
  if (errors.has(testInfo.testId)) expect(errors.get(testInfo.testId), 'JavaScript errors and local HTTP 5xx').toEqual([]);
  errors.delete(testInfo.testId);
});

test('home and catalogue cards stay on TVWeb film pages', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('#hero .carousel-item.active a').first();
  await expect(hero).toHaveAttribute('href', /^\/phim\//);
  const homeCard = page.locator('main .film-card').first();
  await expect(homeCard).toHaveAttribute('href', /^\/phim\//);
  const title = (await homeCard.locator('.film-title').innerText()).trim();
  await page.goto('/phim');
  await page.locator('input[name=q]').last().fill(title);
  await page.getByRole('button', { name: 'Lọc' }).click();
  await expect(page.locator('a.film-card').first()).toHaveAttribute('href', /^\/phim\//);
});

test('source films open local detail and watch pages', async ({ page }) => {
  for (const [slug, title, playable] of [
    ['motchill-7-ngay-ben-nhau', '7 Ngày Bên Nhau', true],
    ['tophim-minh-lan-truyen', 'Minh Lan Truyện', false]
  ]) {
    await page.goto('/phim');
    await page.locator('input[name=q]').last().fill(title);
    await page.getByRole('button', { name: 'Lọc' }).click();
    const link = page.locator(`a.film-card[href="/phim/${slug}"]`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/phim/${slug}$`));
    await expect(page.locator('h2')).toBeVisible();
    if (playable) {
      await page.getByRole('link', { name: /Xem ngay/ }).click();
      await expect(page).toHaveURL(new RegExp(`/xem-phim/${slug}$`));
      await expect(page.locator('.player-wrap')).toBeVisible();
    } else {
      await expect(page.getByText('Chưa có nguồn phát', { exact: false })).toBeVisible();
    }
  }
});

test('broken film images show branded artwork on cards and hero', async ({ page }) => {
  await page.route('**/*', route => {
    if (route.request().resourceType() === 'image' && !route.request().url().includes('/images/film-placeholder')) {
      return route.fulfill({ status: 404 });
    }
    return route.continue();
  });
  await page.goto('/phim');
  const card = page.locator('.film-card img').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('src', '/images/film-placeholder.svg');
  await expect.poll(() => card.evaluate(image => image.naturalWidth > 0)).toBe(true);
  await page.goto('/');
  await expect(page.locator('#hero img').first()).toHaveAttribute('src', '/images/film-placeholder-wide.svg');
});

test('mixed artwork stays equal height and fully visible', async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/phim');
    await expect(page.locator('.film-card').first()).toBeVisible();
    const frames = await page.locator('.film-card').evaluateAll(items => items.slice(0, 6).map(card => {
      const wrapper = card.querySelector('.poster-wrap').getBoundingClientRect();
      const image = card.querySelector('img');
      const bounds = image.getBoundingClientRect();
      return { width: wrapper.width, height: wrapper.height, imageHeight: bounds.height, fit: getComputedStyle(image).objectFit };
    }));
    expect(frames.length).toBeGreaterThan(1);
    for (const frame of frames) {
      expect(frame.height).toBeCloseTo(frames[0].height, 0);
      expect(frame.height / frame.width).toBeCloseTo(1.5, 1);
      expect(frame.imageHeight).toBeCloseTo(frame.height, 0);
      expect(frame.fit).toBe('contain');
    }
  }
});

for (const device of [
  { name: 'web', width: 1440, height: 900, path: '/' },
  { name: 'tv', width: 1920, height: 1080, path: '/?tv=1' },
  { name: 'mobile', width: 375, height: 812, path: '/' }
]) {
  test(`homepage rail poster heights on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto(device.path);
    await expect(page.locator('.film-row .film-card').first()).toBeVisible();
    const frames = await page.locator('.film-row .film-card').evaluateAll(cards => cards.slice(0, 9).map(card => {
      const wrapper = card.querySelector('.poster-wrap').getBoundingClientRect();
      const image = card.querySelector('img');
      const bounds = image.getBoundingClientRect();
      return { width: wrapper.width, height: wrapper.height, imageHeight: bounds.height, fit: getComputedStyle(image).objectFit };
    }));
    expect(frames.length).toBeGreaterThan(1);
    for (const frame of frames) {
      expect(frame.height).toBeCloseTo(frames[0].height, 0);
      expect(frame.height / frame.width).toBeCloseTo(1.5, 1);
      expect(frame.imageHeight).toBeCloseTo(frame.height, 0);
      expect(frame.fit).toBe('contain');
    }
    await page.screenshot({ path: `reports/home-${device.name}.png`, fullPage: true });
  });
}

test('film and watch bookmarks stay on TVWeb', async ({ page }) => {
  for (const path of [`/phim/${seriesSlug}`, `/xem-phim/${seriesSlug}?ep=02`]) {
    const response = await page.request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  }
});

test('missing film and empty search return usable states', async ({ page }) => {
  const missing = await page.goto('/phim/this-film-does-not-exist');
  expect(missing.status()).toBe(404);
  await page.goto('/phim?q=this-film-does-not-exist');
  await expect(page.locator('a.film-card')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Tên phim...' })).toHaveValue('this-film-does-not-exist');
});

test('catalogue status and genre filters keep matching results', async ({ page }) => {
  await page.goto('/phim?status=phim-bo&page=1');
  await expect(page.locator('select[name=status]')).toHaveValue('phim-bo');
  await expect(page.locator('.film-grid a.film-card').first()).toBeVisible();
  const genre = page.locator('select[name=genre] option').nth(1);
  if (await genre.count()) {
    const value = await genre.getAttribute('value');
    await page.locator('select[name=genre]').selectOption(value);
    await page.getByRole('button', { name: 'Lọc' }).click();
    await expect(page.locator('select[name=genre]')).toHaveValue(value);
    await expect(page.locator('.film-grid a.film-card').first()).toHaveAttribute('href', /^\/phim\//);
  }
});

test('TV mode navigates film cards using remote arrows', async ({ page }) => {
  await page.goto('/?tv=1');
  await expect(page.locator('body')).toHaveClass(/tv-mode/);
  await page.locator('.film-row a.film-card').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.film-row a.film-card').nth(1)).toBeFocused();
});

for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`responsive navigation and catalogue at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('nav .navbar-brand')).toBeVisible();
    if (viewport.width < 992) {
      await page.locator('.navbar-toggler').click();
      await expect(page.getByRole('link', { name: 'Khám phá' })).toBeVisible();
      await page.getByRole('link', { name: 'Khám phá' }).click();
      await expect(page).toHaveURL(/\/phim$/);
    }
    await expect(page.locator('a.film-card').first()).toHaveAttribute('href', /^\/phim\//);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontal overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    const bounds = await page.locator('a.film-card').first().boundingBox();
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({ path: `reports/responsive-${viewport.width}.png`, fullPage: true });
  });
}