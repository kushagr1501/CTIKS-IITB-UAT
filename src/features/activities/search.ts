export const ACTIVITY_SEARCH_DELAY_MS = 350;

export function normalizeActivityQuery(value: string) {
  return value.trim().slice(0, 200);
}

export function activitySearchUrl(path: string, value: string) {
  const query = normalizeActivityQuery(value);
  return query ? `${path}?${new URLSearchParams({ q: query })}` : path;
}

export function createActivitySearchDebouncer(search: (value: string) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
  }
  return {
    cancel,
    schedule(value: string) {
      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        search(value);
      }, ACTIVITY_SEARCH_DELAY_MS);
    },
    flush(value: string) {
      cancel();
      search(value);
    },
  };
}
