import { expect, test } from "@playwright/test";

import { createShare } from "./helpers";

test("adds an equal-split expense and shows it in the ledger", async ({ page }) => {
  await createShare(page);

  await page.getByRole("button", { name: "Add Expense" }).click();
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

test("saves an exact split instead of replacing it with equal amounts", async ({ page }) => {
  await createShare(page);

  await page.getByRole("button", { name: "Add Expense" }).click();
  await page.getByRole("textbox", { name: "e.g., Dinner, Gas, Hotel" }).fill("Hotel");
  await page.getByRole("textbox", { name: "0.00" }).fill("100.00");
  await page.getByRole("button", { name: /Split Equally/ }).click();
  await page.getByRole("textbox", { name: "Alex exact amount" }).fill("70.00");
  await page.getByRole("textbox", { name: "Sam exact amount" }).fill("30.00");
  await expect(page.getByRole("button", { name: "Confirm Split" })).toBeEnabled();
  await page.getByRole("button", { name: "Confirm Split" }).click();
  await page.getByRole("button", { name: "Save Expense" }).click();

  await expect(page.getByText("+30.00 USD", { exact: true })).toBeVisible();
  await expect(page.getByText("-30.00 USD", { exact: true })).toBeVisible();
});
