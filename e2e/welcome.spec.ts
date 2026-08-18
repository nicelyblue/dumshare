import { expect, test } from "@playwright/test";

test("welcomes a new user and exposes share creation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");

  await expect(page).toHaveTitle("dumshare");
  await expect(page.getByText("Split expenses without the noise", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create a Share" })).toHaveAttribute("href", "/create-share");
});
