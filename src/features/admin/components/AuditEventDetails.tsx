import type { presentAuditEvent } from '../audit-presentation';

export default function AuditEventDetails({
  presentation,
}: {
  presentation: ReturnType<typeof presentAuditEvent>;
}) {
  const { changes, info, message, showPrevious, removed } = presentation;

  return (
    <div className="space-y-7 text-base leading-7 text-stone-900">
      <p className="rounded-r-lg border-l-4 border-ctiks-red bg-ctiks-red/5 px-5 py-4 text-lg font-medium leading-8">
        {message}
      </p>
      {changes.length > 0 && (
        <section aria-label="Changed fields">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{removed ? 'Deleted entry' : 'What changed'}</h3>
            <p className="text-sm text-stone-600">
              {changes.length} {changes.length === 1 ? 'field' : 'fields'}
            </p>
          </div>
          <dl className="space-y-4">
            {changes.map((change) => (
              <div key={change.field} className="overflow-hidden rounded-xl border border-stone-200">
                <dt className="border-b border-stone-200 bg-stone-50 px-5 py-3 text-base font-semibold">
                  {change.label}
                </dt>
                <dd
                  className={`grid divide-y divide-stone-200 ${showPrevious && !removed ? 'sm:grid-cols-2 sm:divide-x sm:divide-y-0' : ''}`}
                >
                  {showPrevious && (
                    <div className="min-w-0 p-5">
                      <p className="mb-2 text-base font-medium text-stone-600">
                        {removed ? 'Deleted value' : 'Previous value'}
                      </p>
                      <p className="whitespace-pre-wrap text-lg font-medium leading-8 [overflow-wrap:anywhere]">
                        {change.before}
                      </p>
                    </div>
                  )}
                  {!removed && (
                    <div className="min-w-0 bg-ctiks-cream/50 p-5">
                      <p className="mb-2 text-base font-semibold text-ctiks-maroon">New value</p>
                      <p className="whitespace-pre-wrap text-lg font-semibold leading-8 [overflow-wrap:anywhere]">
                        {change.after}
                      </p>
                    </div>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {info.length > 0 && (
        <section aria-label="Additional details">
          <h3 className="mb-3 text-lg font-semibold">Additional details</h3>
          <dl className="divide-y divide-stone-200 rounded-xl border border-stone-200 px-5">
            {info.map((entry) => (
              <div
                key={entry.field}
                className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-5"
              >
                <dt className="font-medium text-stone-600">{entry.label}</dt>
                <dd className="whitespace-pre-wrap font-medium [overflow-wrap:anywhere]">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
