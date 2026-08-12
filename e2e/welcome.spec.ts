import { expect, test } from "@playwright/test";

test("welcomes a new user and exposes share creation", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("dumshare");
  await expect(page.getByText("Welcome to Dumshare!", { exact: true })).toBeVisible();
  await expect(page.getByText("Create a Share", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "+" })).toHaveAttribute("href", "/create-share");
});
