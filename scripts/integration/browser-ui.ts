import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const uiExpect = expect.configure({ timeout: 20_000 });

type Session = { cookies: Map<string, string> };

async function openAuthenticatedPage(session: Session, origin: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([...session.cookies].map(([name, value]) => ({ name, value, url: origin })));
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return {
    browser,
    page,
    assertNoPageErrors() {
      assert.deepEqual(pageErrors, [], 'browser page must not throw JavaScript errors');
    },
  };
}

export async function checkAdminFacultyUi(session: Session, origin: string) {
  const ui = await openAuthenticatedPage(session, origin);
  const { page, browser } = ui;
  try {
    await page.goto(`${origin}/admin/people`);
    await uiExpect(page.getByRole('heading', { name: 'Faculty directory' })).toBeVisible();

    const name = 'Browser Test Faculty';
    await page.getByRole('button', { name: 'Add faculty member' }).click();
    await uiExpect(page.getByRole('heading', { name: 'Add faculty member' })).toBeVisible();
    await page.getByLabel('Full name').fill(name);
    await page.getByLabel('Profile identifier').fill('browser-test-faculty');
    await page.getByLabel('Faculty category').selectOption('VISITING');
    await page.getByLabel('Designation').fill('Visiting researcher');
    await page.getByLabel('Department / affiliation').fill('Browser test department');
    await page.getByLabel('Biography').fill('Created through the Playwright browser test.');
    await page.getByRole('button', { name: 'Save faculty profile' }).click();
    await page
      .getByRole('dialog', { name: 'Add this faculty member?' })
      .getByRole('button', { name: 'Add faculty', exact: true })
      .click();

    const row = page.getByRole('row').filter({ hasText: name });
    await uiExpect(row).toContainText('Browser test department');
    await row.getByRole('button', { name: `Edit ${name}` }).click();
    await uiExpect(page.getByRole('dialog', { name: `Edit ${name}` })).toBeVisible();
    await uiExpect(page.getByRole('heading', { name: `Edit ${name}` })).toBeInViewport();
    await uiExpect(page.getByLabel('Full name')).toBeFocused();
    await page.getByLabel('Biography').fill('Unsaved changes for close confirmation.');
    await page.getByRole('button', { name: 'Close faculty editor' }).click();
    await page
      .getByRole('dialog', { name: 'Discard unsaved changes?' })
      .getByRole('button', { name: 'Discard changes', exact: true })
      .click();
    await uiExpect(page.getByRole('dialog', { name: `Edit ${name}` })).toHaveCount(0);
    await row.getByRole('button', { name: `Edit ${name}` }).click();
    await page.getByLabel('Biography').fill('Edited through the Playwright browser test.');
    await page.getByRole('button', { name: 'Save faculty profile' }).click();
    await page
      .getByRole('dialog', { name: 'Save profile changes?' })
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await uiExpect(row).toContainText(name);

    await row.getByRole('button', { name: `Show ${name} on the website` }).click();
    await page
      .getByRole('dialog', { name: 'Show this profile?' })
      .getByRole('button', { name: 'Show profile', exact: true })
      .click();
    await uiExpect(row).toContainText('Visible');
    await row.getByRole('button', { name: `Hide ${name} on the website` }).click();
    await page
      .getByRole('dialog', { name: 'Hide this profile?' })
      .getByRole('button', { name: 'Hide profile', exact: true })
      .click();
    await uiExpect(row).toContainText('Hidden');

    await row.getByRole('button', { name: `Delete ${name}` }).click();
    await uiExpect(page.getByRole('dialog', { name: 'Delete faculty?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete faculty', exact: true }).click();
    await uiExpect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0);
    ui.assertNoPageErrors();
    console.log('PASS Playwright admin UI: create, edit, show, hide, and delete faculty');
  } finally {
    await browser.close();
  }
}

export async function checkProfessorEditorUi(session: Session, origin: string) {
  const ui = await openAuthenticatedPage(session, origin);
  const { page, browser } = ui;
  try {
    await page.goto(`${origin}/faculty`);
    const about = page.getByLabel('About you');
    await uiExpect(about).toBeVisible();
    const draftBiography = 'Playwright draft biography for the faculty portal.';
    await about.fill('');
    await uiExpect(about).toHaveValue('');
    await about.fill(draftBiography);
    await uiExpect(about).toHaveValue(draftBiography);
    const draftResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/faculty/profile') && response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save draft' }).click();
    const savedDraft = await draftResponse;
    assert.equal(savedDraft.status(), 200, 'faculty draft save response');
    assert.equal((await savedDraft.json()).faculty.content.biography, draftBiography);
    await uiExpect(page.getByRole('status')).toContainText(
      'Draft saved. Your public profile has not changed.',
    );

    await page.reload();
    await uiExpect(about).toHaveValue(draftBiography);
    const area = page.getByLabel('Add a research area');
    await area.fill('Playwright research area');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await uiExpect(page.getByLabel('Selected research areas')).toContainText('Playwright research area');
    await page.getByRole('button', { name: 'Remove research area Playwright research area' }).click();
    await uiExpect(page.getByLabel('Selected research areas')).toHaveCount(0);

    await page.getByRole('button', { name: 'Submit & publish' }).click();
    await uiExpect(page.getByRole('status')).toContainText(
      'Content updated. This profile remains hidden until the administrator makes it visible.',
    );
    ui.assertNoPageErrors();
    console.log('PASS Playwright professor UI: save draft, reload, add/remove research area, and publish');
  } finally {
    await browser.close();
  }
}
