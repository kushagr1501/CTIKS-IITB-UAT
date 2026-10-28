'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '../api-client';
import ActivityEditor from './ActivityEditor';
import DeleteActivityDialog from './DeleteActivityDialog';
import AdminNotice from './AdminNotice';
import { useActionConfirmation } from './ActionConfirmation';
import { ACTIVITY_SECTIONS, type ActivityRecord, type ActivityValues } from '@/features/activities/types';
import { eventSchedule, formatActivityDate } from '@/features/activities/dates';

export default function ActivityManager({ initialActivities }: { initialActivities: ActivityRecord[] }) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [editor, setEditor] = useState<ActivityRecord | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ActivityRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('');
  const [page, setPage] = useState(1);
  const selected = editor && editor !== 'new' ? editor : null;
  const { confirm, confirmation } = useActionConfirmation();

  function replace(activity: ActivityRecord) {
    setActivities((current) =>
      [activity, ...current.filter((item) => item.id !== activity.id)].sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      ),
    );
    router.refresh();
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save this change.');
    } finally {
      setBusy(false);
    }
  }
  async function save(values: ActivityValues, files: { poster: File | null; document: File | null }) {
    if (
      !(await confirm({
        title: selected ? 'Save activity changes?' : 'Add this activity?',
        description: `“${values.title}” will be ${selected ? 'updated' : 'added'}. Visible activities also appear on the public website.`,
        label: selected ? 'Save changes' : 'Add activity',
      }))
    )
      return;
    await run(async () => {
      async function upload(file: File, kind: 'poster' | 'document') {
        const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
        const csrf = await csrfResponse.json();
        if (!csrfResponse.ok || !csrf.token) throw new Error('Please sign in again.');
        const form = new FormData();
        form.set('file', file); form.set('kind', kind); form.set('title', values.title);
        const response = await fetch('/api/admin/activities/media', { method: 'POST', headers: { 'x-csrf-token': csrf.token }, body: form });
        const result = await response.json();
        if (!response.ok || !result.url) throw new Error(result.error || 'Upload failed.');
        return result.url as string;
      }
      if (files.poster) values.imageUrl = await upload(files.poster, 'poster');
      if (files.document) values.supportingDocumentUrl = await upload(files.document, 'document');
      const result = await apiJson<{ activity: ActivityRecord }>(
        selected ? `/api/admin/activities/${selected.id}` : '/api/admin/activities',
        {
          method: selected ? 'PATCH' : 'POST',
          body: JSON.stringify(selected ? { ...values, version: selected.version } : values),
        },
      );
      replace(result.activity);
      setEditor(null);
      setMessage('Activity saved. The website is up to date.');
    });
  }
  async function toggle(activity: ActivityRecord) {
    if (
      !(await confirm({
        title: `${activity.visible ? 'Hide' : 'Show'} this activity?`,
        description: `“${activity.title}” will ${activity.visible ? 'be hidden from' : 'appear on'} the public website. You can change this again later.`,
        label: activity.visible ? 'Hide activity' : 'Show activity',
      }))
    )
      return;
    await run(async () => {
      const result = await apiJson<{ activity: ActivityRecord }>(
        `/api/admin/activities/${activity.id}/visibility`,
        {
          method: 'PATCH',
          body: JSON.stringify({ version: activity.version, visible: !activity.visible }),
        },
      );
      replace(result.activity);
      setMessage(`Activity ${result.activity.visible ? 'shown on' : 'hidden from'} the website.`);
    });
  }
  async function remove() {
    if (!pendingDelete) return;
    await run(async () => {
      await apiJson(`/api/admin/activities/${pendingDelete.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ version: pendingDelete.version }),
      });
      setActivities((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setMessage('Activity deleted.');
      router.refresh();
    });
  }
  async function reload() {
    await run(async () => {
      const result = await apiJson<{ activities: ActivityRecord[] }>('/api/admin/activities');
      setActivities(result.activities);
      setEditor(null);
      setPendingDelete(null);
      setMessage('List refreshed.');
    });
  }
  const filtered = activities.filter(
    (activity) =>
      (!section || activity.sections.some((item) => item === section)) &&
      `${activity.title} ${activity.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);

  return (
    <>
      {confirmation}
      <div className="mb-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">Activities</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Manage news, announcements and events. The latest visible entries also appear on the homepage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/activities"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View activities page (opens in a new tab)"
            className="mr-1 text-sm font-medium text-ctiks-maroon underline underline-offset-4"
          >
            View activities page ↗
          </Link>
          <button className="admin-secondary" disabled={busy} onClick={reload}>
            Refresh list
          </button>
          <button
            className="admin-primary"
            disabled={busy}
            onClick={() => {
              setEditor('new');
              setPendingDelete(null);
              setError('');
            }}
          >
            Add activity
          </button>
        </div>
      </div>
      <AdminNotice
        message={error || message}
        error={Boolean(error)}
        onDismiss={() => {
          setMessage('');
          setError('');
        }}
      />
      {editor && (
        <ActivityEditor
          key={selected?.id ?? 'new'}
          activity={selected}
          busy={busy}
          error={error}
          onSave={save}
          onCancel={() => {
            setEditor(null);
            setError('');
          }}
        />
      )}
      {pendingDelete && (
        <DeleteActivityDialog
          activity={pendingDelete}
          busy={busy}
          error={error}
          onDelete={remove}
          onClose={() => {
            setPendingDelete(null);
            setError('');
          }}
        />
      )}
      <section className="admin-panel">
        <div className="mb-6 flex flex-wrap gap-4">
          <label className="admin-label flex-1">
            Search activities
            <input
              className="admin-input"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="admin-label">
            Section
            <select
              className="admin-input"
              value={section}
              onChange={(event) => {
                setSection(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All sections</option>
              {Object.entries(ACTIVITY_SECTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mb-4 text-sm text-stone-500">{filtered.length} entries · Newest added first</p>
        <ul className="divide-y divide-stone-200">
          {filtered.slice((currentPage - 1) * 20, currentPage * 20).map((activity) => {
            const schedule = eventSchedule(activity.eventStartAt, activity.eventEndAt, activity.eventHasTime);
            return (
              <li
                key={activity.id}
                className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {activity.imageUrl && (
                    <img
                      src={activity.imageUrl}
                      alt={`Image for ${activity.title}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-auto max-h-20 w-auto max-w-20 shrink-0 rounded-md border border-[#e7d4b8] object-contain sm:max-h-24 sm:max-w-24"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded px-2 py-1 ${activity.visible ? 'bg-[#faecd9] text-[#714b33]' : 'bg-stone-100 text-stone-600'}`}
                    >
                      {activity.visible ? 'Visible' : 'Hidden'}
                    </span>
                    {activity.sections.map((key) => (
                      <span key={key} className="rounded bg-amber-50 px-2 py-1 text-amber-900">
                        {ACTIVITY_SECTIONS[key]}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-semibold [overflow-wrap:anywhere]">{activity.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600 [overflow-wrap:anywhere]">
                    {activity.description}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    Added {formatActivityDate(activity.createdAt)}
                    {schedule ? ` · ${schedule.date}${schedule.time ? ` · ${schedule.time}` : ''}` : ''}
                  </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="admin-secondary"
                    disabled={busy || !!editor || !!pendingDelete}
                    onClick={() => {
                      setEditor(activity);
                      setError('');
                    }}
                    aria-label={`Edit ${activity.title}`}
                    data-admin-action="edit"
                  >
                    Edit
                  </button>
                  <button
                    className="admin-secondary"
                    disabled={busy || !!editor || !!pendingDelete}
                    onClick={() => toggle(activity)}
                    aria-label={`${activity.visible ? 'Hide' : 'Show'} ${activity.title}`}
                    data-admin-action={activity.visible ? 'hide' : 'show'}
                  >
                    {activity.visible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    className="admin-secondary text-red-700"
                    disabled={busy || !!editor || !!pendingDelete}
                    onClick={() => {
                      setPendingDelete(activity);
                      setError('');
                    }}
                    aria-label={`Delete ${activity.title}`}
                    data-admin-action="delete"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {!filtered.length && (
          <p className="py-10 text-center text-sm text-stone-500">
            {activities.length
              ? 'No activities match your search.'
              : 'No activities yet. Add your first entry to get started.'}
          </p>
        )}
        {pages > 1 && (
          <nav aria-label="Activity list pages" className="mt-5 flex items-center justify-between gap-3">
            <button
              className="admin-secondary"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {currentPage} of {pages}
            </span>
            <button
              className="admin-secondary"
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
