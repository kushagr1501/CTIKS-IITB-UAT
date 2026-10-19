const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});
const timeFormat = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

export function formatActivityDate(value: string) {
  return dateFormat.format(new Date(value));
}

export function eventSchedule(start: string | null, end: string | null) {
  if (!start) return null;
  const date = formatActivityDate(start);
  const endDate = end ? formatActivityDate(end) : null;
  return {
    date: endDate && endDate !== date ? `${date} – ${endDate}` : date,
    time: `${timeFormat.format(new Date(start))}${end ? ` – ${timeFormat.format(new Date(end))}` : ''} IST`.toUpperCase(),
  };
}

// Form values always represent India time, regardless of the administrator's browser timezone.
export function toIndiaInputs(value: string | null) {
  if (!value) return { date: '', time: '' };
  const local = new Date(new Date(value).getTime() + 330 * 60_000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export function fromIndiaInputs(date: string, time: string): string | null {
  if (!date && !time) return null;
  if (!date || !time) throw new Error('Enter both a date and a time, or clear both.');
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}
