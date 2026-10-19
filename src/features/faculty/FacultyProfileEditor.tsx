'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AcademicEntries from './AcademicEntries';
import { collections } from './entry-fields';
import { academicContentSchema, type AcademicContent, type FacultyEditorState } from './profile-schema';

export default function FacultyProfileEditor({ initialState }: { initialState: FacultyEditorState }) {
  const [state, setState] = useState(initialState);
  const [content, setContent] = useState(initialState.content);
  const [tagText, setTagText] = useState(initialState.content.researchTags.join('\n'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const dirty =
    JSON.stringify(content) !== JSON.stringify(state.content) ||
    tagText !== state.content.researchTags.join('\n');
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function setField<K extends keyof AcademicContent>(key: K, value: AcademicContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
    setMessage('');
  }
  async function save(action: 'save' | 'publish' | 'discard') {
    if (busy) return;
    if (
      action === 'discard' &&
      !window.confirm(
        'Discard the saved draft and any unsaved edits? Your published profile will stay as it is.',
      )
    )
      return;
    setError('');
    setMessage('');
    const parsed = academicContentSchema.safeParse({
      ...content,
      researchTags: tagText
        .split('\n')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    if (action !== 'discard' && !parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue.path
        .map((part) => (typeof part === 'number' ? `entry ${part + 1}` : part))
        .join(' → ');
      setError(`${path}: ${issue.message}`);
      document
        .getElementById(`editor-${String(issue.path[0])}`)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    setBusy(true);
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!csrfResponse.ok) throw new Error('Your session could not be verified. Sign in again.');
      const csrf = await csrfResponse.json();
      const response = await fetch('/api/faculty/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.token },
        body: JSON.stringify({
          action,
          profileVersion: state.profileVersion,
          draftVersion: state.draftVersion,
          content: action === 'discard' ? state.content : parsed.data,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The profile could not be saved. Please try again.');
      const next = result.faculty as FacultyEditorState;
      setState(next);
      setContent(next.content);
      setTagText(next.content.researchTags.join('\n'));
      setMessage(
        action === 'save'
          ? 'Draft saved. Your public profile has not changed.'
          : action === 'discard'
            ? 'Draft discarded. The current profile is loaded.'
            : next.identity.visible
              ? 'Published. Your changes are live on the website.'
              : 'Content updated. This profile remains hidden until the administrator makes it visible.',
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The profile could not be saved. Your edits are still here.',
      );
    } finally {
      setBusy(false);
    }
  }
  function textField(
    key:
      | 'biography'
      | 'imageUrl'
      | 'websiteUrl'
      | 'publicEmail'
      | 'interests'
      | 'researchOverview'
      | 'officeAddress'
      | 'publicPhone',
    label: string,
    max: number,
    rows?: number,
    type = 'text',
  ) {
    return (
      <label className={`admin-label ${rows ? 'sm:col-span-2' : ''}`}>
        {label}
        {rows ? (
          <textarea
            className="admin-input !text-base"
            value={content[key]}
            maxLength={max}
            rows={rows}
            onChange={(event) => setField(key, event.target.value)}
          />
        ) : (
          <input
            className="admin-input !text-base"
            type={type}
            value={content[key]}
            maxLength={max}
            onChange={(event) => setField(key, event.target.value)}
          />
        )}
      </label>
    );
  }
  return (
    <>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">My faculty profile</h1>
          <p className="mt-2 text-base leading-7 text-stone-600">
            Save unfinished edits as a draft. Submit to publish your changes immediately.
          </p>
        </div>
        {state.identity.visible && (
          <Link href={`/people/${state.identity.slug}`} target="_blank" className="admin-secondary">
            View public profile ↗
          </Link>
        )}
      </div>
      <section className="admin-panel mb-6">
        <h2 className="text-xl font-semibold text-ctiks-maroon">{state.identity.name}</h2>
        <p className="mt-1 text-base leading-7 text-stone-700">
          {state.identity.designation}
          <br />
          {state.identity.department}
        </p>
        <p className="mt-3 text-sm text-stone-600">
          {state.identity.visible ? 'Visible on website' : 'Hidden from website'} · Identity and directory
          settings are managed by the administrator.
        </p>
      </section>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save('publish');
        }}
      >
        <div className="sticky top-3 z-10 mb-6 rounded-xl border border-stone-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <p className="mb-3 text-sm text-stone-600">
            {dirty
              ? 'You have unsaved changes.'
              : state.hasDraft
                ? 'You are editing a saved draft.'
                : 'You are editing your current profile.'}
          </p>
          <div aria-live="polite">
            {error && (
              <p role="alert" className="mb-3 whitespace-pre-wrap text-base text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="mb-3 text-base text-emerald-800">
                {message}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="admin-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Submit & publish'}
            </button>
            <button
              type="button"
              className="admin-secondary"
              disabled={busy}
              onClick={() => void save('save')}
            >
              Save draft
            </button>
            {state.hasDraft && (
              <button
                type="button"
                className="px-2 py-2 text-sm text-stone-600 underline"
                disabled={busy}
                onClick={() => void save('discard')}
              >
                Discard draft
              </button>
            )}
            {error && (
              <button
                type="button"
                className="px-2 py-2 text-sm text-stone-600 underline"
                disabled={busy}
                onClick={() => {
                  if (!dirty || window.confirm('Reload and lose unsaved edits?')) window.location.reload();
                }}
              >
                Reload saved profile
              </button>
            )}
          </div>
        </div>
        <fieldset disabled={busy} className="min-w-0 space-y-6">
          <section className="admin-panel" id="editor-biography">
            <h2 className="mb-5 font-display text-2xl text-ctiks-maroon">Profile details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('biography', 'Biography', 8000, 6)}
              {textField('imageUrl', 'Photograph URL (HTTPS or /assets/)', 2048)}
              {textField('websiteUrl', 'Personal website (HTTPS)', 2048, undefined, 'url')}
              {textField('publicEmail', 'Public email', 254, undefined, 'email')}
              {textField('interests', 'Directory research summary', 1500, 2)}
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Keep the directory summary brief. Leave optional fields empty to remove them.
            </p>
          </section>
          <section className="admin-panel" id="editor-researchTags">
            <h2 className="mb-5 font-display text-2xl text-ctiks-maroon">Research areas</h2>
            <div className="grid gap-5">
              <label className="admin-label">
                Research areas — one per line
                <textarea
                  className="admin-input !text-base"
                  rows={4}
                  value={tagText}
                  onChange={(event) => {
                    setTagText(event.target.value);
                    setMessage('');
                  }}
                />
                <span className="text-sm font-normal text-stone-600">
                  Up to 30 areas, 100 characters each.
                </span>
              </label>
              {textField('researchOverview', 'Research overview', 8000, 5)}
            </div>
          </section>
          <AcademicEntries
            name="education"
            rows={content.education}
            {...collections.education}
            onChange={(rows) => setField('education', rows)}
          />
          <AcademicEntries
            name="courses"
            rows={content.courses}
            {...collections.courses}
            onChange={(rows) => setField('courses', rows)}
          />
          <AcademicEntries
            name="experience"
            rows={content.experience}
            {...collections.experience}
            onChange={(rows) => setField('experience', rows)}
          />
          <AcademicEntries
            name="publications"
            rows={content.publications}
            {...collections.publications}
            onChange={(rows) => setField('publications', rows)}
          />
          <AcademicEntries
            name="patents"
            rows={content.patents}
            {...collections.patents}
            onChange={(rows) => setField('patents', rows)}
          />
          <AcademicEntries
            name="students"
            rows={content.students}
            {...collections.students}
            onChange={(rows) =>
              setField(
                'students',
                rows.map((row) => (row.status === 'CURRENT' ? { ...row, graduationYear: null } : row)),
              )
            }
          />
          <section className="admin-panel" id="editor-officeAddress">
            <h2 className="mb-5 font-display text-2xl text-ctiks-maroon">Office & contact</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('officeAddress', 'Office address', 2000, 3)}
              {textField('publicPhone', 'Public phone', 100, undefined, 'tel')}
            </div>
          </section>
        </fieldset>
      </form>
    </>
  );
}
