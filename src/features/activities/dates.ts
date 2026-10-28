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

export function eventSchedule(start: string | null, end: string | null, hasTime = true) {
  if (!start) return null;
  const date = formatActivityDate(start);
  const endDate = end ? formatActivityDate(end) : null;
  return {
    date: endDate && endDate !== date ? `${date} – ${endDate}` : date,
    time: hasTime
      ? `${timeFormat.format(new Date(start))}${end ? ` – ${timeFormat.format(new Date(end))}` : ''} IST`.toUpperCase()
      : '',
  };
}

// Form values always represent India time, regardless of the administrator's browser timezone.
export function toIndiaInputs(value: string | null, hasTime = true) {
  if (!value) return { date: '', time: '' };
  const local = new Date(new Date(value).getTime() + 330 * 60_000).toISOString();
  return { date: local.slice(0, 10), time: hasTime ? local.slice(11, 16) : '' };
}

export function fromIndiaInputs(date: string, time: string, endOfDay = false): string | null {
  if (!date && !time) return null;
  if (!date) throw new Error('Enter a date for the time provided.');
  return new Date(
    `${date}T${time ? `${time}:00` : endOfDay ? '23:59:59.999' : '00:00:00'}+05:30`,
  ).toISOString();
}
