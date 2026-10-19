import { useState } from 'react';
import { STUDENT_LINK_LABELS, STUDENT_LINK_PLATFORMS, type StudentSocialLink } from './student-schema';

export default function StudentSocialLinksInput({
  id,
  links,
  onChange,
}: {
  id: string;
  links: StudentSocialLink[];
  onChange: (links: StudentSocialLink[]) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const available = STUDENT_LINK_PLATFORMS.filter(
    (platform) => !links.some((link) => link.platform === platform),
  );
  return (
    <div id={id} tabIndex={-1} className="sm:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-700">Social & academic links</p>
        <button
          id={`${id}-add`}
          type="button"
          className="admin-secondary"
          disabled={!available.length}
          aria-expanded={choosing}
          aria-controls={`${id}-platforms`}
          onClick={() => setChoosing((current) => !current)}
        >
          {choosing ? 'Cancel selection' : '+ Add social link'}
        </button>
      </div>
      {choosing && (
        <div id={`${id}-platforms`} className="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="mb-3 text-sm text-stone-600">Choose a platform</p>
          <div className="flex flex-wrap gap-2">
            {available.map((platform) => (
              <button
                key={platform}
                type="button"
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-ctiks-red hover:text-ctiks-red"
                onClick={() => {
                  onChange([...links, { platform, url: '' }]);
                  setChoosing(false);
                  requestAnimationFrame(() => document.getElementById(`${id}-${platform}`)?.focus());
                }}
              >
                {STUDENT_LINK_LABELS[platform]}
              </button>
            ))}
          </div>
        </div>
      )}
      {!links.length && <p className="text-sm text-stone-500">No links added.</p>}
      <ul className="space-y-3" aria-label="Student social links">
        {links.map((link, index) => (
          <li key={link.platform} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor={`${id}-${link.platform}`} className="text-sm font-semibold text-ctiks-maroon">
                {STUDENT_LINK_LABELS[link.platform]}
              </label>
              <button
                type="button"
                aria-label={`Remove ${STUDENT_LINK_LABELS[link.platform]} link`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-xl text-red-700 hover:bg-red-50"
                onClick={() => {
                  onChange(links.filter((_, position) => position !== index));
                  document.getElementById(`${id}-add`)?.focus({ preventScroll: true });
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <input
              id={`${id}-${link.platform}`}
              type="url"
              aria-label={`${STUDENT_LINK_LABELS[link.platform]} URL`}
              aria-required="true"
              className="admin-input !text-base"
              placeholder="https://..."
              maxLength={2048}
              value={link.url}
              onChange={(event) =>
                onChange(
                  links.map((entry, position) =>
                    position === index ? { ...entry, url: event.target.value } : entry,
                  ),
                )
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
