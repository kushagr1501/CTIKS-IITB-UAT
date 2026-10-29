'use client';

import { useState } from 'react';
import { apiJson } from '../api-client';
import { replaceFacultyProfile } from '../faculty-order';
import {
  FACULTY_CATEGORIES,
  type FacultyCategory,
  type FacultyLogin,
  type FacultyRecord,
  type FacultySubmission,
} from '../types';
import FacultyEditor from './FacultyEditor';
import FacultyCredentialsDialog from './FacultyCredentialsDialog';
import DeleteFacultyDialog from './DeleteFacultyDialog';
import AdminNotice from './AdminNotice';
import { useActionConfirmation } from './ActionConfirmation';
import filterStyles from './FacultyFilters.module.css';
import { useHydrated } from './use-hydrated';

export default function FacultyManager({ initialFaculty }: { initialFaculty: FacultyRecord[] }) {
  const hydrated = useHydrated();
  const [faculty, setFaculty] = useState(initialFaculty);
  const [editor, setEditor] = useState<FacultyRecord | 'new' | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FacultyCategory | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<(FacultyLogin & { name: string }) | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FacultyRecord | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const selected = editor && editor !== 'new' ? editor : null;
  const { confirm, confirmation } = useActionConfirmation();

  function replaceProfile(profile: FacultyRecord) {
    setFaculty((current) => replaceFacultyProfile(current, profile));
  }

  async function save(values: FacultySubmission) {
    if (
      !(await confirm({
        title: selected ? 'Save profile changes?' : 'Add this person?',
        description: `The profile for ${values.name} will be ${selected ? 'updated' : 'added'} in the People directory.`,
        label: selected ? 'Save changes' : 'Add person',
      }))
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { faculty: profile } = await apiJson<{ faculty: FacultyRecord }>(
        selected ? `/api/admin/faculty/${selected.id}` : '/api/admin/faculty',
        {
          method: selected ? 'PATCH' : 'POST',
          body: JSON.stringify(selected ? { ...values, version: selected.version } : values),
        },
      );
      replaceProfile(profile);
      setEditor(null);
      if (values.login) {
        setCredentials({ name: profile.name, email: profile.loginEmail!, password: values.login.password });
      } else setMessage(`${profile.name} was saved.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }

  async function changeVisibility(profile: FacultyRecord) {
    if (
      !(await confirm({
        title: `${profile.visible ? 'Hide' : 'Show'} this profile?`,
        description: `${profile.name} will ${profile.visible ? 'be hidden from' : 'appear on'} the public People page. You can change this again later.`,
        label: profile.visible ? 'Hide profile' : 'Show profile',
      }))
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await apiJson<{ faculty: FacultyRecord }>(
        `/api/admin/faculty/${profile.id}/visibility`,
        {
          method: 'PATCH',
          body: JSON.stringify({ visible: !profile.visible, version: profile.version }),
        },
      );
      replaceProfile(result.faculty);
      setMessage(
        `${result.faculty.name} is now ${result.faculty.visible ? 'visible on' : 'hidden from'} the website.`,
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to update this profile.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setDeleteError('');
    setMessage('');
    try {
      const { deleted } = await apiJson<{ deleted: { id: string; name: string } }>(
        `/api/admin/faculty/${pendingDelete.id}`,
        { method: 'DELETE', body: JSON.stringify({ version: pendingDelete.version }) },
      );
      setFaculty((current) => current.filter((profile) => profile.id !== deleted.id));
      setPendingDelete(null);
      setMessage(`${deleted.name} was deleted.`);
    } catch (failure) {
      setDeleteError(failure instanceof Error ? failure.message : 'Unable to delete this profile.');
    } finally {
      setBusy(false);
    }
  }

  const searchQuery = query.trim().toLowerCase();
  const matchingSearch = faculty.filter((person) =>
    `${person.name} ${person.department}`.toLowerCase().includes(searchQuery),
  );
  const filtered = matchingSearch.filter((person) => !category || person.category === category);
  const categoryFilters = [
    { value: '' as const, label: 'All people', count: matchingSearch.length },
    ...Object.entries(FACULTY_CATEGORIES).map(([value, label]) => ({
      value: value as FacultyCategory,
      label,
      count: matchingSearch.filter((person) => person.category === value).length,
    })),
  ];
  const hasFilters = Boolean(query || category);

  function clearFilters() {
    setQuery('');
    setCategory('');
  }

  return (
    <>
      {confirmation}
      {pendingDelete && (
        <DeleteFacultyDialog
          profile={pendingDelete}
          busy={busy}
          error={deleteError}
          onClose={() => {
            setPendingDelete(null);
            setDeleteError('');
          }}
          onDelete={confirmDelete}
        />
      )}
      {credentials && (
        <FacultyCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
      )}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">People directory</h1>
          <p className="mt-2 max-w-xl text-base leading-7 text-stone-600">
            Manage profiles, categories, and what appears on the People page.
          </p>
        </div>
        <button
          type="button"
          className="admin-primary min-h-11 gap-2"
          disabled={busy || Boolean(editor) || !hydrated}
          onClick={() => {
            setEditor('new');
            setError('');
            setMessage('');
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add person
        </button>
      </div>
      <AdminNotice
        message={error || deleteError || message}
        error={Boolean(error || deleteError)}
        onDismiss={() => {
          setMessage('');
          setError('');
          setDeleteError('');
        }}
      />
      {editor && (
        <FacultyEditor
          key={selected?.id ?? 'new'}
          profile={selected}
          busy={busy}
          error={error}
          onCancel={() => {
            setEditor(null);
            setError('');
          }}
          onSave={save}
        />
      )}
      <section
        aria-labelledby="faculty-list-heading"
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        <div className={filterStyles.filters}>
          <div className={filterStyles.heading}>
            <div>
              <h2 id="faculty-list-heading" className="text-lg font-semibold text-stone-900">
                Browse people
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Find a profile or choose a category.
              </p>
            </div>
            <label className={filterStyles.search}>
              <span className="sr-only">Search people by name or department</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                className={filterStyles.input}
                placeholder="Search name or department…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <div role="group" aria-label="Filter people by category" className={filterStyles.tabs}>
            {categoryFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={category === filter.value}
                onClick={() => setCategory(filter.value)}
                className={filterStyles.tab}
              >
                {filter.label}
                <span className={filterStyles.count}>{filter.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-stone-100 px-5 py-3 sm:px-6">
          <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{filtered.length}</span>
            {hasFilters ? ` of ${faculty.length}` : ''}{' '}
            {filtered.length === 1 ? 'profile' : 'profiles'}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md px-2 py-1 text-sm font-semibold text-ctiks-red hover:bg-red-50"
            >
              Clear filters
            </button>
          ) : (
            <p className="text-xs text-stone-500">Sorted by category, then display order</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table data-faculty-table className="w-full min-w-[920px] text-left text-sm text-stone-700">
            <caption className="sr-only">
              People profiles and controls to edit, show, hide, or delete each profile.
            </caption>
            <thead>
              <tr className="border-y border-stone-200 bg-stone-50 text-stone-600">
                <th scope="col" className="px-5 py-3.5 font-semibold sm:pl-6">
                  Name
                </th>
                <th scope="col" className="w-44 px-4 py-3.5 font-semibold">
                  Category
                </th>
                <th scope="col" className="w-28 px-4 py-3.5 font-semibold">
                  Visibility
                </th>
                <th scope="col" className="w-20 px-4 py-3.5 text-center font-semibold">
                  Order
                </th>
                <th scope="col" className="w-60 px-5 py-3.5 text-right font-semibold sm:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((person) => (
                <tr
                  key={person.id}
                  className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/70"
                >
                  <th scope="row" className="px-5 py-5 font-normal sm:pl-6">
                    <div className="flex items-start gap-4">
                      {person.imageUrl && (
                        <img
                          src={person.imageUrl}
                          alt=""
                          width={48}
                          height={56}
                          className="h-14 w-12 shrink-0 rounded-md border border-[#ead7bd] bg-[#faecd9] object-cover object-top"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-base font-semibold leading-6 text-stone-900">{person.name}</p>
                        <p className="mt-1 max-w-md text-sm leading-6 text-stone-600">{person.department}</p>
                        {person.loginEmail && (
                          <p className="mt-1 break-all text-xs leading-5 text-stone-500">
                            Login: {person.loginEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </th>
                  <td data-label="Category" className="px-4 py-5 leading-6">
                    {FACULTY_CATEGORIES[person.category]}
                  </td>
                  <td data-label="Visibility" className="px-4 py-5">
                    <span className={`text-sm ${person.visible ? 'text-stone-800' : 'text-stone-500'}`}>
                      {person.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td
                    data-label="Order"
                    className="px-4 py-5 text-center font-medium tabular-nums text-stone-600"
                  >
                    {person.displayOrder + 1}
                  </td>
                  <td data-actions className="px-5 py-5 sm:pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-50"
                        disabled={busy || Boolean(editor) || !hydrated}
                        aria-label={`Edit ${person.name}`}
                        data-admin-action="edit"
                        aria-haspopup="dialog"
                        onClick={() => {
                          setEditor(person);
                          setError('');
                          setMessage('');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 min-w-[68px] items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-50"
                        disabled={busy || Boolean(editor) || !hydrated}
                        onClick={() => changeVisibility(person)}
                        data-admin-action={person.visible ? 'hide' : 'show'}
                        aria-label={`${person.visible ? 'Hide' : 'Show'} ${person.name} on the website`}
                      >
                        {person.visible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                        disabled={busy || Boolean(editor) || !hydrated}
                        aria-label={`Delete ${person.name}`}
                        data-admin-action="delete"
                        aria-haspopup="dialog"
                        onClick={() => {
                          setPendingDelete(person);
                          setDeleteError('');
                          setError('');
                          setMessage('');
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="border-t border-stone-100 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-stone-900">
              {faculty.length ? 'No matching profiles' : 'No profiles added yet'}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {faculty.length
                ? 'Try a different name, department, or category.'
                : 'Add your first person to start the directory.'}
            </p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="admin-secondary mt-5">
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
