import { expect, test } from "@playwright/test";

import { createShare } from "./helpers";

test("adds an equal-split expense and shows it in the ledger", async ({ page }) => {
  await createShare(page);

  await page.getByRole("button", { name: /Add New Expense/ }).click();
  await page.getByRole("textbox", { name: "e.g., Dinner, Gas, Hotel" }).fill("Dinner");
  await page.getByRole("textbox", { name: "0.00" }).fill("42.50");
  await page.getByRole("button", { name: "Save Expense" }).click();

  await expect(page.getByText("Dinner", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("+21.25 USD", { exact: true })).toBeVisible();
  await expect(page.getByText("-21.25 USD", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: /Ledger/ }).click();
  await expect(page.getByText("Dinner", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("42.50 USD", { exact: true })).toBeVisible();
  await expect(page.getByText("Paid by", { exact: true })).toBeVisible();
  await expect(page.getByText("2 participants", { exact: true })).toBeVisible();
});
