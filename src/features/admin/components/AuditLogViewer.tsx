'use client';

import { useState } from 'react';
import { apiFetch, apiJson } from '../api-client';
import type { AuditRecord, AuditResult } from '../types';
import AuditEventDialog from './AuditEventDialog';
import AuditLogRow from './AuditLogRow';

export default function AuditLogViewer({ initialResult }: { initialResult: AuditResult }) {
  const [result, setResult] = useState(initialResult);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditRecord | null>(null);

  async function changePage(page: number) {
    setBusy(true);
    setError('');
    try {
      setResult(await apiJson<AuditResult>(`/api/admin/audit-logs?page=${page}`));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to load activity.');
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch('/api/admin/audit-logs/export', { method: 'POST' });
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ctiks-audit-log.csv';
      link.click();
      URL.revokeObjectURL(url);
      setResult(await apiJson<AuditResult>(`/api/admin/audit-logs?page=${result.page}`));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to export activity.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ctiks-maroon">Audit logs</h1>
          <p className="mt-2 text-sm text-stone-600">
            See account, faculty and website activity changes. Times are shown in India time.
          </p>
        </div>
        <button className="admin-primary" onClick={download} disabled={busy}>
          Export CSV
        </button>
      </div>
      {error && (
        <p role="alert" className="admin-error mb-5">
          {error}
        </p>
      )}
      <section className="admin-panel">
        <p className="mb-4 text-sm text-stone-500">{result.total} entries · Read-only history</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[200px]" />
              <col className="w-[220px]" />
              <col className="w-[180px]" />
              <col />
              <col className="w-[180px]" />
            </colgroup>
            <thead>
              <tr className="border-y border-stone-200 bg-stone-50 text-stone-500">
                <th className="p-3 font-medium">Time (IST)</th>
                <th className="p-3 font-medium">Person</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Affected entry</th>
                <th className="p-3 font-medium">What changed</th>
              </tr>
            </thead>
            <tbody>
              {result.events.map((event) => (
                <AuditLogRow key={event.id} event={event} onView={setSelectedEvent} />
              ))}
            </tbody>
          </table>
        </div>
        {!result.events.length && (
          <p className="py-12 text-center text-stone-500">No activity recorded yet.</p>
        )}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            className="admin-secondary"
            disabled={busy || result.page <= 1}
            onClick={() => changePage(result.page - 1)}
          >
            Previous
          </button>
          <p className="text-sm text-stone-500">
            Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}
          </p>
          <button
            className="admin-secondary"
            disabled={busy || result.page * result.pageSize >= result.total}
            onClick={() => changePage(result.page + 1)}
          >
            Next
          </button>
        </div>
      </section>
      {selectedEvent && (
        <AuditEventDialog
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      <p className="mt-4 text-xs leading-5 text-stone-500">
        Failed login entries record a submitted identifier, not a verified identity. Session expiry records
        when access expired; it does not indicate exactly when someone stopped using the website.
      </p>
    </>
  );
}
