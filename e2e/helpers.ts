import { expect, type Page } from "@playwright/test";

type CreateShareOptions = {
  title?: string;
  organizer?: string;
  participants?: string[];
};

export async function createShare(
  page: Page,
  {
    title = "Playwright Trip",
    organizer = "Alex",
    participants = ["Sam"],
  }: CreateShareOptions = {},
): Promise<void> {
  await page.goto("/");
  await page.getByRole("link", { name: "Create a Share" }).click();
  await page.getByRole("textbox", { name: "Share title" }).fill(title);
  await page.getByRole("textbox", { name: "Organizer name" }).fill(organizer);
  await page.getByRole("button", { name: "Create Share" }).click();

  await expect(page.getByText("Add Participants", { exact: true })).toBeVisible();
  for (const participant of participants) {
    await page.getByRole("textbox", { name: "Participant name" }).fill(participant);
    await page.getByRole("button", { name: "Add" }).click();
  }

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("tab", { name: /Home/ })).toBeVisible();
}
