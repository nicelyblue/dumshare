import { expect, test } from "@playwright/test";

import { createShare } from "./helpers";

test("creates a share and adds participants", async ({ page }) => {
  await createShare(page, {
    title: "Weekend Away",
    organizer: "Alex",
    participants: ["Sam", "Taylor"],
  });

  await expect(page.getByText("Alex", { exact: true })).toBeVisible();
  await expect(page.getByText("Sam", { exact: true })).toBeVisible();
  await expect(page.getByText("Taylor", { exact: true })).toBeVisible();
  await expect(page.getByText("Total Expenses", { exact: true })).toBeVisible();
  await expect(page.getByText("0.00", { exact: true })).toBeVisible();
});
