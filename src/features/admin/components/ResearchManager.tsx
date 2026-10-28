'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '../api-client';
import AdminNotice from './AdminNotice';
import { useActionConfirmation } from './ActionConfirmation';

type Area = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  professorNames: string[];
  displayOrder: number;
  visible: boolean;
  version: number;
  createdAt: string;
};
type Values = Pick<Area, 'title' | 'description' | 'imageUrl' | 'displayOrder' | 'visible'>;
const blank: Values = {
  title: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  visible: true,
};
const orderAreas = (areas: Area[]) =>
  [...areas].sort(
    (a, b) =>
      a.displayOrder - b.displayOrder || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

export default function ResearchManager({
  initialAreas,
  teacherNames,
}: {
  initialAreas: Area[];
  teacherNames: string[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dirty = useRef(false);
  const [areas, setAreas] = useState(orderAreas(initialAreas));
  const [editing, setEditing] = useState<Area | 'new' | null>(null);
  const [values, setValues] = useState<Values>(blank);
  const [names, setNames] = useState<string[]>([]);
  const [newProfessor, setNewProfessor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [filePreview, setFilePreview] = useState('');
  const previewRef = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { confirm, confirmation } = useActionConfirmation();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!editing || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    headingRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [editing]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function chooseFile(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const preview = next ? URL.createObjectURL(next) : '';
    previewRef.current = preview;
    setFile(next);
    setFilePreview(preview);
  }

  function chooseImageMode(next: 'url' | 'upload') {
    setImageMode(next);
    if (next === 'url') chooseFile(null);
  }

  function open(area: Area | 'new') {
    setEditing(area);
    setValues(
      area === 'new'
        ? { ...blank, displayOrder: areas.length }
        : {
            title: area.title,
            description: area.description,
            imageUrl: area.imageUrl ?? '',
            displayOrder: area.displayOrder,
            visible: area.visible,
          },
    );
    setNames(area === 'new' ? [] : area.professorNames);
    setNewProfessor('');
    dirty.current = false;
    chooseFile(null);
    setImageMode(area !== 'new' && area.imageUrl?.startsWith('/api/local-media/') ? 'upload' : 'url');
    setError('');
  }
  async function closeEditor() {
    if (busy) return;
    if (
      dirty.current &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        description: 'Your research area has not been saved. Close the editor and discard these edits?',
        label: 'Discard changes',
      }))
    )
      return;
    setEditing(null);
    chooseFile(null);
  }
  function addProfessor(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (names.some((existing) => existing.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
      setError('This professor is already selected.');
      return;
    }
    if (names.length >= 30) {
      setError('Choose at most 30 professors.');
      return;
    }
    setNames((current) => [...current, trimmed]);
    setNewProfessor('');
    setError('');
    dirty.current = true;
  }
  function replace(area: Area) {
    setAreas((current) => orderAreas([...current.filter((item) => item.id !== area.id), area]));
    router.refresh();
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The change could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  async function uploadImage(image: File, title: string) {
    const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
    const csrf = await csrfResponse.json();
    if (!csrfResponse.ok || !csrf.token) throw new Error('Please sign in again.');
    const form = new FormData();
    form.set('file', image);
    form.set('title', title);
    const response = await fetch('/api/admin/research/media', {
      method: 'POST',
      headers: { 'x-csrf-token': csrf.token },
      body: form,
    });
    const result = await response.json();
    if (!response.ok || !result.url) throw new Error(result.error || 'Image upload failed.');
    return result.url as string;
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const current = editing === 'new' ? null : editing;
    const professorNames = names;
    if (new Set(professorNames).size !== professorNames.length) {
      setError('List each professor only once.');
      return;
    }
    if (
      (imageMode === 'url' && !values.imageUrl?.trim()) ||
      (imageMode === 'upload' && !file && !values.imageUrl)
    ) {
      setError('Add an image URL or upload an image.');
      return;
    }
    if (
      !(await confirm({
        title: current ? 'Save research area?' : 'Add research area?',
        description: `“${values.title}” will ${current ? 'be updated' : 'be added'} on the Research page when visible.`,
        label: current ? 'Save changes' : 'Add area',
      }))
    )
      return;
    await run(async () => {
      const imageUrl =
        imageMode === 'upload' && file ? await uploadImage(file, values.title) : values.imageUrl;
      const result = await apiJson<{ area: Area }>(
        current ? `/api/admin/research/${current.id}` : '/api/admin/research',
        {
          method: current ? 'PATCH' : 'POST',
          body: JSON.stringify(
            current
              ? { ...values, professorNames, imageUrl, version: current.version }
              : { ...values, professorNames, imageUrl },
          ),
        },
      );
      replace(result.area);
      setEditing(null);
      chooseFile(null);
      setMessage('Research area saved.');
    });
  }
  async function toggle(area: Area) {
    if (
      !(await confirm({
        title: `${area.visible ? 'Hide' : 'Show'} research area?`,
        description: `“${area.title}” will ${area.visible ? 'disappear from' : 'appear on'} the public Research page.`,
        label: area.visible ? 'Hide area' : 'Show area',
      }))
    )
      return;
    await run(async () => {
      const result = await apiJson<{ area: Area }>(`/api/admin/research/${area.id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ version: area.version, visible: !area.visible }),
      });
      replace(result.area);
      setMessage(result.area.visible ? 'Research area shown.' : 'Research area hidden.');
    });
  }
  async function remove(area: Area) {
    if (
      !(await confirm({
        title: 'Delete research area?',
        description: `“${area.title}” will be permanently removed.`,
        label: 'Delete area',
      }))
    )
      return;
    await run(async () => {
      await apiJson(`/api/admin/research/${area.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ version: area.version }),
      });
      setAreas((current) => current.filter((item) => item.id !== area.id));
      router.refresh();
      setMessage('Research area deleted.');
    });
  }

  return (
    <>
      {confirmation}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">Research areas</h1>
          <p className="mt-2 text-sm text-stone-600">
            Manage the cards and their detailed content on the Research page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm font-medium text-ctiks-maroon underline" href="/research" target="_blank">
            View Research page ↗
          </Link>
          <button className="admin-primary" type="button" disabled={busy} onClick={() => open('new')}>
            Add area
          </button>
        </div>
      </div>
      <AdminNotice
        message={error || message}
        error={Boolean(error)}
        onDismiss={() => {
          setError('');
          setMessage('');
        }}
      />
      {editing && (
        <dialog
          ref={dialogRef}
          aria-labelledby="research-editor-title"
          onCancel={(event) => {
            event.preventDefault();
            void closeEditor();
          }}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-900/60"
        >
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-stone-50 px-5 py-4 sm:px-8">
              <h2
                ref={headingRef}
                tabIndex={-1}
                id="research-editor-title"
                className="min-w-0 text-xl font-semibold outline-none [overflow-wrap:anywhere]"
              >
                {editing === 'new' ? 'Add research area' : 'Edit research area'}
              </h2>
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctiks-red disabled:opacity-50"
                type="button"
                disabled={busy}
                aria-label="Close research editor"
                onClick={() => void closeEditor()}
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
              onSubmit={save}
              onChange={() => {
                dirty.current = true;
              }}
              data-lenis-prevent
              className="grid min-h-0 flex-1 gap-5 overflow-y-auto overscroll-contain p-5 sm:grid-cols-2 sm:p-8"
            >
              <label className="admin-label sm:col-span-2">
                Title *
                <input
                  className="admin-input"
                  maxLength={200}
                  required
                  value={values.title}
                  onChange={(event) => setValues({ ...values, title: event.target.value })}
                />
              </label>
              <label className="admin-label sm:col-span-2">
                Description shown when the card flips
                <textarea
                  className="admin-input min-h-32"
                  maxLength={8000}
                  value={values.description}
                  onChange={(event) => setValues({ ...values, description: event.target.value })}
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="admin-label mb-2">Research card photo *</legend>
                <div
                  className="inline-flex rounded-lg border border-[#dec7a7] bg-[#f7ead8] p-1"
                  aria-label="Choose photo source"
                >
                  <button
                    type="button"
                    aria-pressed={imageMode === 'url'}
                    onClick={() => chooseImageMode('url')}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${imageMode === 'url' ? 'bg-[#820d0d] text-white shadow-sm' : 'text-[#714b33] hover:bg-white/70'}`}
                  >
                    Paste URL
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      aria-pressed={imageMode === 'upload'}
                      onClick={() => chooseImageMode('upload')}
                      className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${imageMode === 'upload' ? 'bg-[#820d0d] text-white shadow-sm' : 'text-[#714b33] hover:bg-white/70'}`}
                    >
                      Upload photo
                    </button>
                  )}
                </div>
                {imageMode === 'url' ? (
                  <label key="photo-url" className="admin-label mt-3 block">
                    Photo URL
                    <input
                      className="admin-input"
                      type="text"
                      placeholder="https://… or /assets/…"
                      maxLength={2048}
                      required
                      value={values.imageUrl ?? ''}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, imageUrl: event.target.value }))
                      }
                    />
                    <span className="mt-1 block text-xs text-stone-500">
                      Paste an HTTPS image URL or an existing site image path.
                    </span>
                  </label>
                ) : (
                  <label key="photo-upload" className="admin-label mt-3 block">
                    Choose a photo
                    <input
                      className="admin-input mt-1 block w-full cursor-pointer p-2 file:mr-3 file:rounded-md file:border-0 file:bg-[#820d0d] file:px-3 file:py-2 file:text-white"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                    />
                    <span className="mt-1 block text-xs text-stone-500">
                      JPEG, PNG, or WebP up to 8 MB. Local development only.
                    </span>
                  </label>
                )}
                {(filePreview || values.imageUrl) && (
                  <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#ead7bd] bg-[#fffaf2] p-3">
                    <img
                      className="h-28 w-36 rounded-md object-cover"
                      src={filePreview || values.imageUrl}
                      alt={filePreview ? 'Selected photo preview' : 'Current research area photo'}
                    />
                    <span className="text-sm text-[#65533e]">
                      {filePreview ? 'Selected photo' : 'Current photo'}
                    </span>
                  </div>
                )}
              </fieldset>
              <fieldset className="sm:col-span-2">
                <legend className="admin-label mb-2">Related professors</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="admin-label">
                    Choose an existing teacher
                    <select
                      className="admin-input"
                      value=""
                      onChange={(event) => {
                        const name = event.target.value;
                        if (name) addProfessor(name);
                      }}
                    >
                      <option value="">Select a teacher…</option>
                      {teacherNames
                        .filter((name) => !names.includes(name))
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="admin-label">
                    Or add a new name
                    <div className="mt-1 flex gap-2">
                      <input
                        className="admin-input min-w-0 flex-1"
                        value={newProfessor}
                        maxLength={160}
                        placeholder="Professor's name"
                        onChange={(event) => setNewProfessor(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addProfessor(newProfessor);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="admin-secondary shrink-0"
                        disabled={!newProfessor.trim()}
                        onClick={() => addProfessor(newProfessor)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                {names.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Selected professors">
                    {names.map((name) => (
                      <li
                        key={name}
                        className="flex items-center gap-2 rounded-full border border-[#e7d4b8] bg-[#faecd9] py-1 pl-3 pr-1 text-sm text-[#714b33]"
                      >
                        {name}
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#e7d4b8]"
                          aria-label={`Remove ${name}`}
                          onClick={() => {
                            setNames((current) => current.filter((item) => item !== name));
                            dirty.current = true;
                          }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-stone-500">No professors selected yet.</p>
                )}
                <p className="mt-2 text-xs text-stone-500">
                  Existing teachers link to their People page or website. A new name appears as text until a
                  matching People entry exists.
                </p>
              </fieldset>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[#ead7bd] bg-[#fffaf2] px-4 py-3 sm:col-span-2">
                <span>
                  <span className="block text-sm font-semibold text-[#714b33]">Visible on website</span>
                  <span className="block text-xs text-stone-500">Hidden areas stay in the admin list.</span>
                </span>
                <input
                  className="peer sr-only"
                  type="checkbox"
                  checked={values.visible}
                  onChange={(event) => setValues({ ...values, visible: event.target.checked })}
                />
                <span
                  aria-hidden="true"
                  className="relative h-7 w-12 shrink-0 rounded-full bg-stone-300 transition-colors before:absolute before:left-1 before:top-1 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform peer-checked:bg-[#820d0d] peer-checked:before:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#820d0d]"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5 sm:col-span-2">
                <button
                  className="admin-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void closeEditor()}
                >
                  Cancel
                </button>
                <button className="admin-primary" disabled={busy} type="submit">
                  {busy ? 'Saving…' : 'Save area'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
      <section className="admin-panel">
        <p className="mb-3 text-sm text-stone-500">{areas.length} research areas</p>
        <ul className="divide-y divide-stone-200">
          {areas.map((area) => (
            <li
              key={area.id}
              className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <img
                  src={area.imageUrl}
                  alt=""
                  className="h-20 w-24 shrink-0 rounded-md border border-[#e7d4b8] object-cover"
                />
                <div className="min-w-0">
                  <div className="mb-1 text-xs text-stone-500">{area.visible ? 'Visible' : 'Hidden'}</div>
                  <h2 className="font-semibold text-[#820d0d]">{area.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                    {area.description || 'Details coming soon'}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {area.professorNames.length} related professors
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="admin-secondary"
                  data-admin-action="edit"
                  disabled={busy || !!editing}
                  onClick={() => open(area)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  data-admin-action={area.visible ? 'hide' : 'show'}
                  disabled={busy || !!editing}
                  onClick={() => toggle(area)}
                >
                  {area.visible ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  data-admin-action="delete"
                  disabled={busy || !!editing}
                  onClick={() => remove(area)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {!areas.length && (
          <p className="py-10 text-center text-sm text-stone-500">
            No research areas yet. Add one to get started.
          </p>
        )}
      </section>
    </>
  );
}
