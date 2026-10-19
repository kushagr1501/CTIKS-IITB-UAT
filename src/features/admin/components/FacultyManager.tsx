'use client';

import { useEffect, useState } from 'react';
import { ASSETS } from '@/config/assets';
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

export default function FacultyManager({ initialFaculty }: { initialFaculty: FacultyRecord[] }) {
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

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function replaceProfile(profile: FacultyRecord) {
    setFaculty((current) => replaceFacultyProfile(current, profile));
  }

  async function save(values: FacultySubmission) {
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
    { value: '' as const, label: 'All faculty', count: matchingSearch.length },
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
      {pendingDelete && (
        <DeleteFacultyDialog
          profile={pendingDelete}
          busy={busy}
          error={deleteError}
          onClose={() => setPendingDelete(null)}
          onDelete={confirmDelete}
        />
      )}
      {credentials && (
        <FacultyCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
      )}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">Faculty directory</h1>
          <p className="mt-2 max-w-xl text-base leading-7 text-stone-600">
            Manage profiles, faculty categories, and what appears on the People page.
          </p>
        </div>
        <button
          type="button"
          className="admin-primary min-h-11 gap-2"
          disabled={busy || Boolean(editor)}
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
          Add faculty member
        </button>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-full sm:max-w-md"
      >
        {message && (
          <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-5 text-stone-900 shadow-xl">
            <img
              src={ASSETS.ctiksLogo}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Changes saved</p>
              <p className="mt-1 text-base leading-6 text-stone-700 [overflow-wrap:anywhere]">{message}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="-m-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              onClick={() => setMessage('')}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {!editor && error && (
        <p role="alert" className="admin-error mb-6">
          {error}
        </p>
      )}
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
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 id="faculty-list-heading" className="text-lg font-semibold text-stone-900">
                Browse faculty
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Find a profile or choose a faculty group.
              </p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Search faculty by name or department</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                className="w-full rounded-xl border border-stone-300 bg-stone-50 py-3 pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-500 focus:border-ctiks-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-ctiks-red/10"
                placeholder="Search name or department…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <div role="group" aria-label="Filter faculty by category" className="flex flex-wrap gap-2">
            {categoryFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={category === filter.value}
                onClick={() => setCategory(filter.value)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${category === filter.value ? 'border-ctiks-red bg-ctiks-red text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'}`}
              >
                {filter.label}
                <span
                  className={`flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${category === filter.value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-stone-100 px-5 py-3 sm:px-6">
          <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{filtered.length}</span>
            {hasFilters ? ` of ${faculty.length}` : ''} faculty{' '}
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
          <table className="w-full min-w-[920px] text-left text-sm text-stone-700">
            <caption className="sr-only">
              Faculty profiles and controls to edit, show, hide, or delete each profile.
            </caption>
            <thead>
              <tr className="border-y border-stone-200 bg-stone-50 text-stone-600">
                <th scope="col" className="px-5 py-3.5 font-semibold sm:pl-6">
                  Faculty member
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
                    <p className="text-base font-semibold leading-6 text-stone-900">{person.name}</p>
                    <p className="mt-1 max-w-md text-sm leading-6 text-stone-600">{person.department}</p>
                    {person.loginEmail && (
                      <p className="mt-1 break-all text-xs leading-5 text-stone-500">
                        Login: {person.loginEmail}
                      </p>
                    )}
                  </th>
                  <td className="px-4 py-5 leading-6">{FACULTY_CATEGORIES[person.category]}</td>
                  <td className="px-4 py-5">
                    <span className={`text-sm ${person.visible ? 'text-stone-800' : 'text-stone-500'}`}>
                      {person.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center font-medium tabular-nums text-stone-600">
                    {person.displayOrder + 1}
                  </td>
                  <td className="px-5 py-5 sm:pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-800 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-50"
                        disabled={busy || Boolean(editor)}
                        aria-label={`Edit ${person.name}`}
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
                        disabled={busy || Boolean(editor)}
                        onClick={() => changeVisibility(person)}
                        aria-label={`${person.visible ? 'Hide' : 'Show'} ${person.name} on the website`}
                      >
                        {person.visible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                        disabled={busy || Boolean(editor)}
                        aria-label={`Delete ${person.name}`}
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
              {faculty.length ? 'No matching faculty' : 'No faculty added yet'}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {faculty.length
                ? 'Try a different name, department, or category.'
                : 'Add your first faculty member to start the directory.'}
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
