'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AcademicEntries from './AcademicEntries';
import { collections } from './entry-fields';
import { academicContentSchema, type AcademicContent, type FacultyEditorState } from './profile-schema';

export default function FacultyProfileEditor({ initialState }: { initialState: FacultyEditorState }) {
  const [state, setState] = useState(initialState);
  const [content, setContent] = useState(initialState.content);
  const [areaInput, setAreaInput] = useState('');
  const [areaError, setAreaError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const dirty = JSON.stringify(content) !== JSON.stringify(state.content) || areaInput.trim().length > 0;
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
  function addResearchArea() {
    const area = areaInput.trim();
    if (!area) return;
    const result = academicContentSchema.shape.researchTags.safeParse([...content.researchTags, area]);
    if (!result.success) {
      setAreaError(result.error.issues[0].message);
      return;
    }
    setField('researchTags', result.data);
    setAreaInput('');
    setAreaError('');
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
      researchTags: areaInput.trim() ? [...content.researchTags, areaInput.trim()] : content.researchTags,
    });
    if (action !== 'discard' && !parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue.path
        .map((part) => (typeof part === 'number' ? `entry ${part + 1}` : part))
        .join(' → ');
      setError(`${path}: ${issue.message}`);
      if (issue.path[0] === 'researchTags') setAreaError(issue.message);
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
      setAreaInput('');
      setAreaError('');
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
      | 'name'
      | 'designation'
      | 'department'
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
          <section className="admin-panel" id="editor-identity">
            <h2 className="mb-5 font-display text-2xl text-ctiks-maroon">Name and affiliation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {textField('name', 'Name', 160)}
              {textField('designation', 'Role / designation', 160)}
              {textField('department', 'Department / affiliation', 300)}
            </div>
            <p className="mt-3 text-sm text-stone-600">
              {state.identity.visible ? 'Visible on website' : 'Hidden from website'} · These details appear on
              your faculty profile and directory card. The profile link and website visibility are managed by the
              administrator.
            </p>
          </section>
          <section className="admin-panel" id="editor-biography">
            <h2 className="mb-5 font-display text-2xl text-ctiks-maroon">Profile details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('biography', 'Biography', 8000, 6)}
              {textField('imageUrl', 'Photograph URL (HTTPS or /assets/)', 2048)}
              {textField('websiteUrl', 'Personal website (HTTPS)', 2048, undefined, 'url')}
              {textField('publicEmail', 'Public email', 254, undefined, 'email')}
              {textField('interests', 'Short description on faculty card', 1500, 2)}
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              This text appears under your role and department on your Core Faculty card. Keep it to a short
              phrase or sentence; leave it empty to hide it. Your research areas are managed separately below.
            </p>
          </section>
          <section className="admin-panel" id="editor-researchTags">
            <h2 className="mb-5 font-display text-2xl text-ctiks-maroon">Research areas</h2>
            <div className="grid gap-5">
              <div>
                <label htmlFor="research-area-input" className="admin-label mb-2">
                  Add a research area
                </label>
                <div className="flex items-start gap-2 sm:gap-3">
                  <input
                    id="research-area-input"
                    className="admin-input min-w-0 flex-1 !text-base"
                    placeholder="e.g. Indian astronomy"
                    value={areaInput}
                    maxLength={100}
                    disabled={content.researchTags.length >= 30}
                    aria-invalid={Boolean(areaError)}
                    aria-describedby={`research-area-help${areaError ? ' research-area-error' : ''}`}
                    onChange={(event) => {
                      setAreaInput(event.target.value);
                      setAreaError('');
                      setMessage('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        addResearchArea();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="admin-primary shrink-0 !py-2.5"
                    disabled={!areaInput.trim() || content.researchTags.length >= 30}
                    onClick={addResearchArea}
                  >
                    Add
                  </button>
                </div>
                <p id="research-area-help" className="mt-2 text-sm text-stone-600">
                  {content.researchTags.length}/30 areas · Up to 100 characters each. Press Enter or Add.
                </p>
                {areaError && (
                  <p id="research-area-error" role="alert" className="mt-2 text-sm text-red-700">
                    {areaError}
                  </p>
                )}
                {content.researchTags.length > 0 && (
                  <ul aria-label="Selected research areas" className="mt-4 flex flex-wrap gap-2">
                    {content.researchTags.map((area, index) => (
                      <li
                        key={`${area}-${index}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-200 bg-amber-50 py-1 pl-3 pr-1 text-sm text-ctiks-maroon sm:text-base"
                      >
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{area}</span>
                        <button
                          type="button"
                          aria-label={`Remove research area ${area}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-ctiks-maroon/70 hover:bg-amber-100 hover:text-ctiks-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctiks-red"
                          onClick={() => {
                            setField(
                              'researchTags',
                              content.researchTags.filter((_, position) => position !== index),
                            );
                            setAreaError('');
                          }}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
