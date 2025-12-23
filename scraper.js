import { chromium } from "playwright";

export async function scrapeMaps(query) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://www.google.com/maps", { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(3000);
  await page.fill("#searchboxinput", query);
  await page.keyboard.press("Enter");

  await page.waitForTimeout(6000);

  const results = [];

  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(2000);
  }

  const cards = await page.locator('[role="article"]').all();

  for (const card of cards) {
    try {
      await card.click();
      await page.waitForTimeout(3000);

      const name = await page.locator("h1").innerText().catch(() => null);
      const phone = await page.locator('button[data-item-id*="phone"]').innerText().catch(() => null);
      const website = await page.locator('a[data-item-id="authority"]').getAttribute("href").catch(() => null);
      const address = await page.locator('button[data-item-id*="address"]').innerText().catch(() => null);

      if (!website) {
        results.push({ name, phone, address });
      }
    } catch (e) {}
  }

  await browser.close();
  return results;
}
