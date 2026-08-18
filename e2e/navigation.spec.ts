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
  await page.getByRole("button", { name: /Pick Theme/ }).click();
  await page.getByRole("button", { name: /^Dark/ }).click();
  await expect(page.getByRole("button", { name: "Pick Theme (Dark)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByText("Your Shares", { exact: true })).not.toBeVisible();
});
