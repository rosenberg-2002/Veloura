import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));

  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
}

test.describe("Veloura catalog", () => {
  test("header search stays readable and favicon uses the Veloura mark", async ({ page }, testInfo) => {
    await page.goto("/productions");

    const favicon = page.locator('link[rel~="icon"][href="/favicon.svg"]');
    expect(await favicon.count()).toBeGreaterThanOrEqual(1);
    const faviconResponse = await page.request.get("/favicon.svg");
    expect(faviconResponse.ok()).toBeTruthy();

    const headerSearch = page.getByPlaceholder("Search anything");
    if (testInfo.project.name === "mobile-chromium") {
      await expect(headerSearch).toBeHidden();
      await expect(page.getByRole("link", { name: "Search", exact: true }).first()).toBeVisible();
      await page.locator('summary[aria-label="Open navigation"]').click();
      await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByPlaceholder("Search anything")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: /Switch to (light|dark) mode/ })).toBeVisible();
    } else {
      await expect(headerSearch).toBeVisible();
      const searchBox = await headerSearch.boundingBox();
      expect(searchBox?.width ?? 0).toBeGreaterThan(150);
      await expect(page.locator(".header-theme-toggle")).toBeVisible();
    }

    await expectNoHorizontalOverflow(page);
  });

  test("homepage exposes navigation and movie content", async ({ page }, testInfo) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Veloura/i);
    await expect(page.locator("h1")).toBeVisible();

    let navigation = page.getByRole("navigation", { name: "Primary navigation" });
    if (testInfo.project.name === "mobile-chromium") {
      await page.locator('summary[aria-label="Open navigation"]').click();
      navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    }

    await expect(navigation.getByRole("link", { name: "Productions", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Actor / Actress", exact: true })).toBeVisible();
    await expect(page.locator('a[href^="/movie/"]').first()).toBeVisible();
  });

  test("productions show ten companies per numbered page", async ({ page }) => {
    await page.goto("/productions");

    const companies = page.locator('section[class*="studioSection"]');
    await expect(companies).toHaveCount(10);
    const firstPageCompany = await companies.first().locator("h2").first().innerText();

    const secondPage = page.getByRole("navigation", { name: "Production company pages" }).getByRole("link", { name: "2", exact: true });
    await expect(secondPage).toBeVisible();
    await secondPage.click();

    await expect(page).toHaveURL(/\/productions\?page=2$/);
    await expect(companies).toHaveCount(10);
    await expect(companies.first().locator("h2").first()).not.toHaveText(firstPageCompany);
    await expect(page.getByRole("link", { name: "3", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("people search updates from a typed TMDB name", async ({ page }) => {
    await page.goto("/people");

    const search = page.getByRole("searchbox", { name: "Search performers" });
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute("data-ready", "true");
    await search.fill("Tom Hanks");

    await page.waitForURL(/\/people\?.*q=Tom(\+|%20)Hanks/, { timeout: 20_000 });
    await expect(page.getByText(/matching “Tom Hanks”/)).toBeVisible();

    const tmdbUnavailable = page.getByText(/TMDB is temporarily unavailable/);
    if (await tmdbUnavailable.isVisible()) {
      await expect(tmdbUnavailable).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Tom Hanks", exact: true })).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
  });

  test("movie and person pages remain responsive", async ({ page }) => {
    await page.goto("/movie/278");
    await expect(page.locator("h1")).toHaveText("The Shawshank Redemption");
    await expectNoHorizontalOverflow(page);

    await page.goto("/person/31");
    await expect(page.locator("h1")).toHaveText("Tom Hanks");
    await expect(page.getByRole("heading", { name: "Movies as cast" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
