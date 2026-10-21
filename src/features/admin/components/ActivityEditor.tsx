'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ACTIVITY_SECTIONS,
  type ActivityRecord,
  type ActivitySection,
  type ActivityValues,
} from '@/features/activities/types';
import { fromIndiaInputs, toIndiaInputs } from '@/features/activities/dates';
import { useActionConfirmation } from './ActionConfirmation';
import ActivityTimeField from './ActivityTimeField';

export default function ActivityEditor({
  activity,
  busy,
  error,
  onSave,
  onCancel,
}: {
  activity: ActivityRecord | null;
  busy: boolean;
  error: string;
  onSave: (values: ActivityValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [sections, setSections] = useState<ActivitySection[]>(activity?.sections ?? ['NEWS']);
  const [formError, setFormError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dirty = useRef(false);
  const { confirm, confirmation } = useActionConfirmation();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    heading.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  const start = toIndiaInputs(activity?.eventStartAt ?? null);
  const end = toIndiaInputs(activity?.eventEndAt ?? null);

  async function closeEditor() {
    if (busy) return;
    if (
      dirty.current &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        description: 'Your activity has not been saved. Close the editor and discard these edits?',
        label: 'Discard changes',
      }))
    )
      return;
    dialogRef.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    try {
      if (!sections.length) throw new Error('Choose at least one section.');
      const eventStartAt = fromIndiaInputs(value('startDate'), value('startTime'));
      const eventEndAt = fromIndiaInputs(value('endDate'), value('endTime'));
      if (eventEndAt && (!eventStartAt || Date.parse(eventEndAt) <= Date.parse(eventStartAt))) {
        throw new Error('End date and time must be after the start.');
      }
      await onSave({
        title: value('title'),
        description: value('description'),
        sections,
        imageUrl: value('imageUrl'),
        registrationUrl: value('registrationUrl'),
        linkLabel: value('linkLabel'),
        venue: value('venue'),
        eventStartAt,
        eventEndAt,
        visible: data.get('visible') === 'true',
      });
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : 'Check the dates and try again.');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="activity-editor-title"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        closeEditor();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onCancel();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-[#e4cfaf] bg-[#fffaf2] p-0 text-[#4a4235] shadow-2xl backdrop:bg-[#30251c]/50"
    >
      {confirmation}
      <div className="flex h-[min(880px,calc(100dvh-2rem))] flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e7d4b8] px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <h2
              ref={heading}
              tabIndex={-1}
              id="activity-editor-title"
              className="text-xl font-semibold outline-none"
            >
              {activity ? 'Edit activity' : 'Add activity'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#7c6a56]">
              News, announcements and events for the website.
            </p>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#714b33] hover:bg-[#f2dfc2] disabled:opacity-50"
            aria-label="Close activity editor"
            type="button"
            disabled={busy}
            onClick={closeEditor}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <form
          onSubmit={submit}
          onChange={() => {
            dirty.current = true;
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            data-activity-scroll
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <fieldset
              disabled={busy}
              className="grid min-w-0 items-start gap-x-5 gap-y-6 p-5 sm:grid-cols-2 sm:p-7"
            >
              <label className="admin-label sm:col-span-2">
                Title
                <input
                  className="admin-input"
                  name="title"
                  required
                  minLength={2}
                  maxLength={200}
                  defaultValue={activity?.title ?? ''}
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm font-medium">Show in</legend>
                <div className="flex flex-wrap gap-5">
                  {Object.entries(ACTIVITY_SECTIONS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-ctiks-red"
                        checked={sections.includes(key as ActivitySection)}
                        onChange={(event) =>
                          setSections((current) =>
                            event.target.checked
                              ? [...current, key as ActivitySection]
                              : current.filter((section) => section !== key),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Choose one or more sections. Each entry is saved once.
                </p>
              </fieldset>
              <label className="admin-label sm:col-span-2">
                Description
                <textarea
                  className="admin-input"
                  name="description"
                  required
                  rows={5}
                  maxLength={8000}
                  defaultValue={activity?.description ?? ''}
                />
              </label>
              <label className="admin-label sm:col-span-2">
                Image URL (optional)
                <input
                  className="admin-input"
                  name="imageUrl"
                  maxLength={2048}
                  defaultValue={activity?.imageUrl ?? ''}
                />
                <span className="text-xs font-normal text-stone-500">
                  An HTTPS image URL or an existing /assets/ image.
                </span>
              </label>
              <fieldset className="min-w-0 rounded-xl border border-stone-200 p-4 sm:col-span-2">
                <legend className="px-2 text-sm font-semibold">Date and time (IST · optional)</legend>
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <label className="admin-label">
                    Start date
                    <input
                      className="admin-input min-w-0"
                      name="startDate"
                      type="date"
                      defaultValue={start.date}
                    />
                  </label>
                  <ActivityTimeField
                    label="Start time"
                    name="startTime"
                    defaultValue={start.time}
                    onChange={() => {
                      dirty.current = true;
                    }}
                  />
                  <label className="admin-label">
                    End date
                    <input
                      className="admin-input min-w-0"
                      name="endDate"
                      type="date"
                      defaultValue={end.date}
                    />
                  </label>
                  <ActivityTimeField
                    label="End time"
                    name="endTime"
                    defaultValue={end.time}
                    onChange={() => {
                      dirty.current = true;
                    }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-500">
                  Enter a date with its time. Events need a start date and time to appear in Upcoming events
                  on the homepage. With no end time, they leave that section when they start.
                </p>
              </fieldset>
              <label className="admin-label sm:col-span-2">
                Venue (optional)
                <input
                  className="admin-input"
                  name="venue"
                  maxLength={300}
                  defaultValue={activity?.venue ?? ''}
                />
              </label>
              <label className="admin-label">
                Link URL (optional)
                <input
                  className="admin-input"
                  name="registrationUrl"
                  type="url"
                  placeholder="https://"
                  maxLength={2048}
                  defaultValue={activity?.registrationUrl ?? ''}
                />
              </label>
              <label className="admin-label">
                Link label (optional)
                <input
                  className="admin-input"
                  name="linkLabel"
                  maxLength={60}
                  list="activity-link-labels"
                  placeholder="More info"
                  defaultValue={activity?.linkLabel ?? ''}
                />
                <datalist id="activity-link-labels">
                  <option value="More info" />
                  <option value="Register" />
                  <option value="View notification" />
                  <option value="Apply now" />
                </datalist>
                <span className="text-xs font-normal text-stone-500">
                  Choose a suggestion or enter your own text. Leave blank to show “More info”. Only shown when
                  a link URL is provided.
                </span>
              </label>
              <label className="admin-label sm:col-span-2">
                Visibility
                <select
                  className="admin-input"
                  name="visible"
                  defaultValue={String(activity?.visible ?? true)}
                >
                  <option value="true">Visible on website</option>
                  <option value="false">Hidden</option>
                </select>
              </label>
              {(error || formError) && (
                <p role="alert" className="admin-error sm:col-span-2">
                  {formError || error}
                </p>
              )}
            </fieldset>
          </div>
          <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[#e7d4b8] bg-[#fffaf2] px-5 py-4 sm:px-7">
            <button className="admin-secondary" type="button" disabled={busy} onClick={closeEditor}>
              Cancel
            </button>
            <button className="admin-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save activity'}
            </button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
