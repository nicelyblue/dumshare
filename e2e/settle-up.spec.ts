import { expect, test } from "@playwright/test";

import { createShare } from "./helpers";

test("calculates the transfer required to settle an equal-split expense", async ({ page }) => {
  await createShare(page);

  await page.getByRole("button", { name: /Add New Expense/ }).click();
  await page.getByRole("textbox", { name: "e.g., Dinner, Gas, Hotel" }).fill("Dinner");
  await page.getByRole("textbox", { name: "0.00" }).fill("42.50");
  await page.getByRole("button", { name: "Save Expense" }).click();
  await page.getByRole("tab", { name: /Settle Up/ }).click();

  await expect(page.getByText("REQUIRED PAYMENTS", { exact: true })).toBeVisible();
  await expect(page.getByText("Sam", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Alex", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("21.25 USD", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Share settlement" })).toBeVisible();
});
