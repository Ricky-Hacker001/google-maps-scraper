import { chromium } from "playwright";

export async function scrapeMaps(query) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://www.google.com/maps", { waitUntil: "domcontentloaded" });

  // Enter search query
  await page.waitForTimeout(3000);
  await page.fill("#searchboxinput", query);
  await page.keyboard.press("Enter");

  await page.waitForTimeout(8000); // Wait for results to load

  const results = [];
  const maxScrolls = 10;

  for (let scroll = 0; scroll < maxScrolls; scroll++) {
    // Scroll the sidebar to load more results
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(2000);
  }

  const cards = await page.locator('[role="article"]').all();

  for (const card of cards) {
    try {
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.waitForTimeout(3000); // Wait for detail pane to load

      const name = await page.locator("h1").innerText().catch(() => null);
      const phone = await page.locator('button[data-item-id*="phone"]').innerText().catch(() => null);
      const whatsapp = await page.locator('button[data-tooltip*="WhatsApp"]').getAttribute("aria-label").catch(() => null);
      const website = await page.locator('a[data-item-id="authority"]').getAttribute("href").catch(() => null);
      const address = await page.locator('button[data-item-id*="address"]').innerText().catch(() => null);

      // Only include businesses without website
      if (!website) {
        results.push({
          name: name || "N/A",
          phone: phone || whatsapp || "N/A",
          address: address || "N/A"
        });
      }

      // Wait before processing next card
      await page.waitForTimeout(1500);
    } catch (e) {
      console.log("Error processing card:", e);
      continue;
    }
  }

  await browser.close();
  return results;
}
