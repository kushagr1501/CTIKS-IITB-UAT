'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  FACULTY_CATEGORIES,
  type FacultyCategory,
  type FacultyLogin,
  type FacultyRecord,
  type FacultySubmission,
  type FacultyValues,
} from '../types';
import FacultyLoginFields from './FacultyLoginFields';
import { useActionConfirmation } from './ActionConfirmation';

type EditorProps = {
  profile: FacultyRecord | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSave: (values: FacultySubmission) => Promise<void>;
};

const emptyValues: FacultyValues = {
  name: '',
  slug: '',
  category: 'CORE',
  designation: '',
  department: '',
  interests: '',
  biography: '',
  imageUrl: '',
  websiteUrl: '',
  publicEmail: '',
  displayOrder: 0,
  visible: false,
};

export default function FacultyEditor({ profile, busy, error, onCancel, onSave }: EditorProps) {
  const { confirm, confirmation } = useActionConfirmation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);
  const values = profile ?? emptyValues;
  const [slug, setSlug] = useState(values.slug);
  const [category, setCategory] = useState<FacultyCategory>(values.category);
  const [createLogin, setCreateLogin] = useState(!profile);
  const [login, setLogin] = useState<FacultyLogin>({ email: '', password: '' });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    nameInputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  async function closeEditor() {
    if (busy) return;
    if (
      dirty.current &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        description: 'Your edits have not been saved. Close the editor and discard them?',
        label: 'Discard changes',
      }))
    )
      return;
    dialogRef.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    await onSave({
      ...data,
      // Stored order is zero-based; admins enter positions starting at 1.
      displayOrder: Number(data.displayOrder) - 1,
      visible: data.visible === 'true',
      ...(category === 'CORE' && createLogin && !profile?.loginEmail ? { login } : {}),
    } as FacultySubmission);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="faculty-editor-title"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        closeEditor();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onCancel();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-900/60"
    >
      {confirmation}
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-stone-50 px-5 py-4 sm:px-8">
          <h2 id="faculty-editor-title" className="min-w-0 text-xl font-semibold [overflow-wrap:anywhere]">
            {profile ? `Edit ${profile.name}` : 'Add person'}
          </h2>
          <button
            type="button"
            aria-label="Close faculty editor"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctiks-red disabled:opacity-50"
            onClick={closeEditor}
            disabled={busy}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <form
          onSubmit={submit}
          onChange={() => {
            dirty.current = true;
          }}
          className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:grid-cols-2 sm:p-8"
        >
          <label className="admin-label">
            Full name
            <input
              ref={nameInputRef}
              name="name"
              className="admin-input"
              defaultValue={values.name}
              required
              maxLength={160}
              onChange={(event) => {
                if (!profile)
                  setSlug(
                    event.target.value
                      .replace(/^(Prof\.|Dr\.)\s*/i, '')
                      .normalize('NFKD')
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, ''),
                  );
              }}
            />
          </label>
          <label className="admin-label">
            Profile identifier
            <input
              name="slug"
              className="admin-input"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={180}
            />
            <span className="text-xs font-normal text-stone-500">
              A unique name using lowercase words and hyphens.
            </span>
          </label>
          <label className="admin-label">
            Profile category
            <select
              name="category"
              className="admin-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as FacultyCategory)}
            >
              {Object.entries(FACULTY_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-label">
            Designation
            <input
              name="designation"
              className="admin-input"
              defaultValue={values.designation}
              maxLength={160}
            />
          </label>
          <label className="admin-label sm:col-span-2">
            Department / affiliation
            <input
              name="department"
              className="admin-input"
              defaultValue={values.department}
              required
              maxLength={300}
            />
          </label>
          <label className="admin-label sm:col-span-2">
            Research interests
            <textarea
              name="interests"
              className="admin-input"
              defaultValue={values.interests}
              rows={3}
              maxLength={1500}
            />
          </label>
          <label className="admin-label sm:col-span-2">
            Biography
            <textarea
              name="biography"
              className="admin-input"
              defaultValue={values.biography}
              rows={5}
              maxLength={8000}
            />
          </label>
          <label className="admin-label sm:col-span-2">
            Photo URL
            <input name="imageUrl" className="admin-input" defaultValue={values.imageUrl} maxLength={2048} />
            <span className="text-xs font-normal leading-5 text-stone-500">
              Paste an HTTPS image URL from any website, or use an existing /assets/ image.
            </span>
          </label>
          <label className="admin-label">
            Website URL
            <input
              name="websiteUrl"
              type="url"
              className="admin-input"
              defaultValue={values.websiteUrl}
              placeholder="https://"
              maxLength={2048}
            />
          </label>
          <label className="admin-label">
            Public email
            <input
              name="publicEmail"
              type="email"
              className="admin-input"
              defaultValue={values.publicEmail}
              maxLength={254}
            />
          </label>
          <label className="admin-label">
            Display order
            <input
              name="displayOrder"
              type="number"
              min={1}
              max={10001}
              className="admin-input"
              defaultValue={values.displayOrder + 1}
              required
            />
            <span className="text-xs font-normal text-stone-500">
              Start at 1. Lower numbers appear first within this category.
            </span>
          </label>
          <label className="admin-label">
            Visibility
            <select name="visible" className="admin-input" defaultValue={String(values.visible)}>
              <option value="false">Hidden</option>
              <option value="true">Visible</option>
            </select>
          </label>
          {profile?.loginEmail ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:col-span-2">
              <h3 className="text-base font-semibold">Faculty login</h3>
              <p className="mt-2 text-base [overflow-wrap:anywhere]">{profile.loginEmail}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                This faculty member already has a login. They can update their password on the Change password
                page. Login access is available only while their category is Core Faculty.
              </p>
            </div>
          ) : category === 'CORE' ? (
            <FacultyLoginFields
              enabled={createLogin}
              onToggle={setCreateLogin}
              login={login}
              onChange={setLogin}
              busy={busy}
            />
          ) : null}
          {error && (
            <p role="alert" className="admin-error sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5 sm:col-span-2">
            <button type="button" className="admin-secondary" onClick={closeEditor} disabled={busy}>
              Cancel
            </button>
            <button className="admin-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
