import { expect, test } from "@playwright/test";

import { createShare } from "./helpers";

test("switches tabs and opens the share drawer", async ({ page }) => {
  await createShare(page);

  await page.getByRole("tab", { name: /Ledger/ }).click();
  await expect(page.getByRole("tab", { name: /Ledger/ })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("tab", { name: /Settle Up/ }).click();
  await expect(page.getByRole("tab", { name: /Settle Up/ })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Open share drawer" }).click();
  await expect(page.getByText("Your Shares", { exact: true })).toBeVisible();
});
