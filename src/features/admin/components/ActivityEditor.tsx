'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ACTIVITY_SECTIONS,
  type ActivityRecord,
  type ActivitySection,
  type ActivityValues,
} from '@/features/activities/types';
import { fromIndiaInputs, toIndiaInputs } from '@/features/activities/dates';

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
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const start = toIndiaInputs(activity?.eventStartAt ?? null);
  const end = toIndiaInputs(activity?.eventEndAt ?? null);

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
    <section className="admin-panel mb-7" aria-labelledby="activity-editor-title">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2
          ref={heading}
          tabIndex={-1}
          id="activity-editor-title"
          className="text-xl font-semibold outline-none"
        >
          {activity ? 'Edit activity' : 'Add activity'}
        </h2>
        <button className="admin-secondary" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="grid min-w-0 gap-5 sm:grid-cols-2">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="admin-label">
                Start date
                <input
                  className="admin-input min-w-0"
                  name="startDate"
                  type="date"
                  defaultValue={start.date}
                />
              </label>
              <label className="admin-label">
                Start time
                <input
                  className="admin-input min-w-0"
                  name="startTime"
                  type="time"
                  defaultValue={start.time}
                />
              </label>
              <label className="admin-label">
                End date
                <input className="admin-input min-w-0" name="endDate" type="date" defaultValue={end.date} />
              </label>
              <label className="admin-label">
                End time
                <input className="admin-input min-w-0" name="endTime" type="time" defaultValue={end.time} />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Enter a date with its time. Events need a start date and time to appear in Upcoming events on
              the homepage. With no end time, they leave that section when they start.
            </p>
          </fieldset>
          <label className="admin-label">
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
          <label className="admin-label sm:col-span-2">
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
              Choose a suggestion or enter your own text. Leave blank to show “More info”. Only shown when a
              link URL is provided.
            </span>
          </label>
          <label className="admin-label">
            Visibility
            <select className="admin-input" name="visible" defaultValue={String(activity?.visible ?? true)}>
              <option value="true">Visible on website</option>
              <option value="false">Hidden</option>
            </select>
          </label>
          <p className="self-center text-xs leading-5 text-stone-500">
            The added date is recorded automatically. Visible entries appear on the selected pages
            immediately.
          </p>
          {(error || formError) && (
            <p role="alert" className="admin-error sm:col-span-2">
              {formError || error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button className="admin-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save activity'}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
