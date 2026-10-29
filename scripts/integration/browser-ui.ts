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
    await page.goto(`${origin}/admin/people`, { waitUntil: 'networkidle' });
    await uiExpect(page.getByRole('heading', { name: 'People directory' })).toBeVisible();

    const name = 'Browser Test Faculty';
    await page.getByRole('button', { name: 'Add person' }).click();
    await uiExpect(page.getByRole('heading', { name: 'Add person' })).toBeVisible();
    await page.getByLabel('Full name').fill(name);
    await page.getByLabel('Profile identifier').fill('browser-test-faculty');
    await page.getByLabel('Profile category').selectOption('VISITING');
    await page.getByLabel('Designation').fill('Visiting researcher');
    await page.getByLabel('Department / affiliation').fill('Browser test department');
    await page.getByLabel('Biography').fill('Created through the Playwright browser test.');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await page
      .getByRole('dialog', { name: 'Add this person?' })
      .getByRole('button', { name: 'Add person', exact: true })
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
    await page.getByRole('button', { name: 'Save profile' }).click();
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

async function checkResearchHydration(session: Session, origin: string) {
  const ui = await openAuthenticatedPage(session, origin);
  const { page, browser } = ui;
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  let delayedScripts = 0;
  try {
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'script') {
        delayedScripts++;
        await scriptsReady;
      }
      await route.continue();
    });
    await page.goto(`${origin}/admin/research`, { waitUntil: 'commit' });
    const button = page.getByRole('button', { name: 'Add area', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Add research area' });
    await uiExpect(button).toBeVisible();
    assert.ok(delayedScripts > 0, 'the test must delay JavaScript before hydration');
    await uiExpect(button).toBeDisabled();
    await button.evaluate((element: HTMLButtonElement) => element.click());
    await uiExpect(dialog).toHaveCount(0);
    releaseScripts();
    await uiExpect(button).toBeEnabled();
    await button.click();
    await uiExpect(dialog).toBeVisible();
    ui.assertNoPageErrors();
    console.log('PASS Research add button remains disabled until hydration, then opens the dialog');
  } finally {
    releaseScripts();
    await browser.close();
  }
}

export async function checkAdminResearchUi(session: Session, origin: string) {
  await checkResearchHydration(session, origin);
  const ui = await openAuthenticatedPage(session, origin);
  const { page, browser } = ui;
  const controlledWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /controlled input|uncontrolled input/i.test(message.text()))
      controlledWarnings.push(message.text());
  });
  try {
    await page.goto(`${origin}/admin/research`, { waitUntil: 'networkidle' });
    await uiExpect(page.getByRole('heading', { name: 'Research areas' })).toBeVisible();
    await page.getByRole('button', { name: 'Add area', exact: true }).click();
    let editor = page.getByRole('dialog', { name: 'Add research area' });
    await uiExpect(editor).toBeVisible();
    await uiExpect(editor.getByRole('heading', { name: 'Add research area' })).toBeInViewport();
    await editor.getByLabel('Title *').fill('Browser test research area');
    await editor
      .getByLabel('Description shown when the card flips')
      .fill('Browser test research description.');
    await editor.getByLabel('Photo URL').fill('/assets/research/mathematics.webp');
    const teacher = await editor
      .getByLabel('Choose an existing teacher')
      .locator('option')
      .nth(1)
      .getAttribute('value');
    assert.ok(teacher, 'existing teachers must be available in the picker');
    await editor.getByLabel('Choose an existing teacher').selectOption(teacher);
    await uiExpect(editor.getByRole('list', { name: 'Selected professors' })).toContainText(teacher);
    await editor.getByPlaceholder("Professor's name").fill('Prof. External Scholar');
    await editor.getByRole('button', { name: 'Add', exact: true }).click();
    await uiExpect(editor.getByRole('list', { name: 'Selected professors' })).toContainText(
      'Prof. External Scholar',
    );
    await editor.getByRole('button', { name: 'Save area' }).click();
    await page
      .getByRole('dialog', { name: 'Add research area?' })
      .getByRole('button', { name: 'Add area' })
      .click();
    await uiExpect(editor).toHaveCount(0);

    let row = page.getByRole('listitem').filter({ hasText: 'Browser test research area' });
    await uiExpect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit' }).click();
    editor = page.getByRole('dialog', { name: 'Edit research area' });
    await uiExpect(editor.getByLabel('Photo URL')).toHaveValue('/assets/research/mathematics.webp');
    await editor.getByRole('button', { name: 'Upload photo' }).click();
    await uiExpect(editor.getByLabel('Choose a photo')).toBeVisible();
    await editor.getByRole('button', { name: 'Paste URL' }).click();
    await uiExpect(editor.getByLabel('Photo URL')).toHaveValue('/assets/research/mathematics.webp');
    await editor.getByLabel('Title *').fill('Unsaved research title');
    await editor.getByRole('button', { name: 'Close research editor' }).click();
    await page
      .getByRole('dialog', { name: 'Discard unsaved changes?' })
      .getByRole('button', { name: 'Discard changes' })
      .click();
    await uiExpect(page.getByText('Unsaved research title')).toHaveCount(0);
    row = page.getByRole('listitem').filter({ hasText: 'Browser test research area' });
    await row.getByRole('button', { name: 'Hide' }).click();
    await page
      .getByRole('dialog', { name: 'Hide research area?' })
      .getByRole('button', { name: 'Hide area' })
      .click();
    await uiExpect(row).toContainText('Hidden');
    await row.getByRole('button', { name: 'Show' }).click();
    await page
      .getByRole('dialog', { name: 'Show research area?' })
      .getByRole('button', { name: 'Show area' })
      .click();
    await uiExpect(row).toContainText('Visible');
    await row.getByRole('button', { name: 'Delete' }).click();
    await page
      .getByRole('dialog', { name: 'Delete research area?' })
      .getByRole('button', { name: 'Delete area' })
      .click();
    await uiExpect(row).toHaveCount(0);
    assert.deepEqual(
      controlledWarnings,
      [],
      'Research form must not change inputs between controlled and uncontrolled',
    );
    ui.assertNoPageErrors();
    console.log(
      'PASS Playwright Research modal, teacher choices, image modes, unsaved close, visibility, and delete',
    );
  } finally {
    await browser.close();
  }
}

export async function checkProfessorEditorUi(session: Session, origin: string) {
  const ui = await openAuthenticatedPage(session, origin);
  const { page, browser } = ui;
  try {
    await page.goto(`${origin}/faculty`, { waitUntil: 'networkidle' });
    const about = page.getByLabel('About you');
    await uiExpect(about).toBeVisible();
    // Keep autosave from winning the manual-save race on a busy test machine.
    await page.clock.install();
    // The browser clock can advance past the Node clock while the command travels.
    // Pause in the future so Playwright never needs to move time backwards.
    await page.clock.pauseAt(new Date(Date.now() + 60_000));
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
    const automaticRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/api/faculty/profile') && request.method() === 'PUT')
        automaticRequests.push(request.postData() ?? '');
    });
    await about.fill('An edit that will be replaced before autosave.');
    await page.clock.runFor(1000);
    const automaticBiography = 'Latest biography saved after the 1.5 second pause.';
    await about.fill(automaticBiography);
    await page.clock.runFor(1499);
    assert.equal(automaticRequests.length, 0, 'typing resets the autosave debounce');
    const automaticResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/faculty/profile') && response.request().method() === 'PUT',
    );
    await page.clock.runFor(1);
    const automaticSave = await automaticResponse;
    assert.equal(automaticSave.status(), 200);
    assert.equal((await automaticSave.json()).faculty.content.biography, automaticBiography);
    await uiExpect(page.getByRole('status')).toContainText('Draft saved automatically.');
    await page.reload();
    await uiExpect(about).toHaveValue(automaticBiography);

    const publicationSection = page.locator('#editor-publications');
    const publicationCsv = [
      'Title,Type,Authors,Where was it published?,Year,DOI,Publication link (HTTPS),Full citation',
      '"CSV, quoted publication",Book chapter,Author,Book,2026,,https://example.com/paper,"First line\nSecond line"',
    ].join('\r\n');
    const publicationFile = {
      name: 'publications.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(publicationCsv),
    };
    const publicationInput = page.getByLabel('Import publications from CSV', { exact: true });
    await publicationInput.setInputFiles(publicationFile);
    let importDialog = page.getByRole('dialog', { name: 'Import publications from CSV' });
    await uiExpect(importDialog).toContainText('CSV, quoted publication');
    await importDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await uiExpect(publicationSection.locator('summary')).toHaveCount(0);
    await publicationInput.setInputFiles(publicationFile);
    await importDialog.getByRole('button', { name: 'Add 1 publications', exact: true }).click();
    await uiExpect(publicationSection.locator('summary')).toContainText('CSV, quoted publication');
    await publicationInput.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Wrong header\nBad row'),
    });
    importDialog = page.getByRole('dialog', { name: 'Import publications from CSV' });
    await uiExpect(importDialog.getByRole('alert')).toContainText('columns must match');
    await importDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await uiExpect(publicationSection.locator('summary')).toHaveCount(1);

    await page.getByLabel('Import patents from CSV', { exact: true }).setInputFiles({
      name: 'patents.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Title,Inventors,Patent number,Status,Year,Patent link (HTTPS),Description\r\nCSV patent,Inventor,123,Granted,2026,https://example.com/patent,Description',
      ),
    });
    await page
      .getByRole('dialog', { name: 'Import patents from CSV' })
      .getByRole('button', { name: 'Add 1 patents', exact: true })
      .click();
    await uiExpect(page.locator('#editor-patents summary')).toContainText('CSV patent');
    const area = page.getByLabel('Add a research area');
    await area.fill('Playwright research area');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await uiExpect(page.getByLabel('Selected research areas')).toContainText('Playwright research area');
    await page.getByRole('button', { name: 'Remove research area Playwright research area' }).click();
    await uiExpect(page.getByLabel('Selected research areas')).toHaveCount(0);

    const publishResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/faculty/profile') && response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Submit & publish' }).click();
    const published = await (await publishResponse).json();
    assert.equal(published.faculty.content.publications[0].type, 'BOOK_CHAPTER');
    assert.equal(published.faculty.content.publications[0].citation, 'First line\nSecond line');
    assert.equal(published.faculty.content.patents[0].identifier, '123');
    await uiExpect(page.getByRole('status')).toContainText(
      'Content updated. This profile remains hidden until the administrator makes it visible.',
    );
    ui.assertNoPageErrors();
    console.log(
      'PASS Playwright professor UI: manual save, autosave debounce/reload, CSV preview/cancel/import/errors, research areas, and publish',
    );
  } finally {
    await browser.close();
  }
}
