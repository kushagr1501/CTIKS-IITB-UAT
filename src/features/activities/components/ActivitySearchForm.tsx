'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useTransition } from 'react';
import { activitySearchUrl, createActivitySearchDebouncer, normalizeActivityQuery } from '../search';
import styles from './Activities.module.css';

export default function ActivitySearchForm({
  path,
  title,
  query,
}: {
  path: string;
  title: string;
  query: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const committedQueryRef = useRef(query);
  const requestedUrlRef = useRef<string | null>(null);
  const composingRef = useRef(false);

  const navigate = useCallback(
    (value: string) => {
      const nextUrl = activitySearchUrl(path, value);
      if (requestedUrlRef.current === nextUrl) return;
      // A return to the current URL must still supersede a different pending search.
      if (
        requestedUrlRef.current === null &&
        `${window.location.pathname}${window.location.search}` === nextUrl
      )
        return;
      requestedUrlRef.current = nextUrl;
      startTransition(() => router.replace(nextUrl, { scroll: false }));
    },
    [path, router],
  );
  const debouncerRef = useRef<ReturnType<typeof createActivitySearchDebouncer> | null>(null);
  useEffect(() => {
    const debouncer = createActivitySearchDebouncer(navigate);
    debouncerRef.current = debouncer;
    return () => {
      debouncer.cancel();
      debouncerRef.current = null;
    };
  }, [navigate]);

  useEffect(() => {
    // Link navigation can change the query; don't replace newer, unsent keystrokes.
    if (inputRef.current && normalizeActivityQuery(inputRef.current.value) === committedQueryRef.current) {
      inputRef.current.value = query;
    }
    committedQueryRef.current = query;
    if (requestedUrlRef.current === activitySearchUrl(path, query)) requestedUrlRef.current = null;
  }, [path, query]);

  useEffect(() => {
    function cancelForNavigation(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (
        link &&
        link.target !== '_blank' &&
        !link.hasAttribute('download') &&
        link.origin === window.location.origin
      ) {
        debouncerRef.current?.cancel();
        requestedUrlRef.current = null;
      }
    }
    function syncFromHistory() {
      debouncerRef.current?.cancel();
      requestedUrlRef.current = null;
      const historyQuery = normalizeActivityQuery(new URLSearchParams(window.location.search).get('q') ?? '');
      committedQueryRef.current = historyQuery;
      if (inputRef.current) inputRef.current.value = historyQuery;
    }
    window.addEventListener('popstate', syncFromHistory);
    document.addEventListener('click', cancelForNavigation, true);
    return () => {
      debouncerRef.current?.cancel();
      window.removeEventListener('popstate', syncFromHistory);
      document.removeEventListener('click', cancelForNavigation, true);
    };
  }, []);

  return (
    <div className={styles.search} role="search" aria-busy={pending}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </svg>
      <label htmlFor="activity-search" className="sr-only">
        Search {title.toLowerCase()}
      </label>
      <input
        ref={inputRef}
        id="activity-search"
        name="q"
        type="search"
        maxLength={200}
        defaultValue={query}
        placeholder="Search by keyword..."
        aria-describedby="activity-search-help"
        onChange={(event) => {
          if (!composingRef.current) debouncerRef.current?.schedule(event.currentTarget.value);
        }}
        onCompositionStart={() => {
          composingRef.current = true;
          debouncerRef.current?.cancel();
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          debouncerRef.current?.schedule(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !composingRef.current && !event.nativeEvent.isComposing) {
            event.preventDefault();
            debouncerRef.current?.flush(event.currentTarget.value);
          }
        }}
      />
      <span id="activity-search-help" className="sr-only">
        Results update after you stop typing. Press Enter to search immediately.
      </span>
      <span className={styles.searchStatus} role="status" aria-live="polite">
        {pending ? 'Searching…' : ''}
      </span>
    </div>
  );
}
