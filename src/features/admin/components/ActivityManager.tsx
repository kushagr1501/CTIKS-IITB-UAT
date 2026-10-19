'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '../api-client';
import ActivityEditor from './ActivityEditor';
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
  async function save(values: ActivityValues) {
    await run(async () => {
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
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">Activities</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Manage news, announcements and events. The latest visible entries also appear on the homepage.
          </p>
          <Link href="/activities" className="mt-2 inline-block text-sm text-ctiks-red underline">
            View public activities ↗
          </Link>
        </div>
        <div className="flex gap-2">
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
      {message && (
        <p role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      )}
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
      {!editor && error && (
        <p role="alert" className="admin-error mb-5">
          {error}
        </p>
      )}
      {pendingDelete && (
        <section className="admin-panel mb-6 border-red-200" aria-label="Confirm deletion">
          <h2 className="font-semibold">Delete “{pendingDelete.title}”?</h2>
          <p className="my-3 text-sm text-stone-600">
            This removes the entry from all public pages and the homepage. You can hide it instead if you want
            to keep it.
          </p>
          <div className="flex gap-3">
            <button className="admin-primary" disabled={busy} onClick={remove}>
              Delete activity
            </button>
            <button
              className="admin-secondary"
              disabled={busy}
              onClick={() => {
                setPendingDelete(null);
                setError('');
              }}
            >
              Cancel
            </button>
          </div>
        </section>
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
            const schedule = eventSchedule(activity.eventStartAt, activity.eventEndAt);
            return (
              <li
                key={activity.id}
                className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded px-2 py-1 ${activity.visible ? 'bg-green-50 text-green-800' : 'bg-stone-100 text-stone-600'}`}
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
                    {schedule ? ` · ${schedule.date} · ${schedule.time}` : ''}
                  </p>
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
                  >
                    Edit
                  </button>
                  <button
                    className="admin-secondary"
                    disabled={busy || !!editor || !!pendingDelete}
                    onClick={() => toggle(activity)}
                    aria-label={`${activity.visible ? 'Hide' : 'Show'} ${activity.title}`}
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
