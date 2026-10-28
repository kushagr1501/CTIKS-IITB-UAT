import type { ResearchAreaRecord } from '../research-types';

type Props = {
  areas: ResearchAreaRecord[];
  disabled: boolean;
  onEdit: (area: ResearchAreaRecord) => void;
  onToggle: (area: ResearchAreaRecord) => void;
  onDelete: (area: ResearchAreaRecord) => void;
};

export default function ResearchAreaList({ areas, disabled, onEdit, onToggle, onDelete }: Props) {
  return (
    <section className="admin-panel">
      <p className="mb-3 text-sm text-stone-500">{areas.length} research areas</p>
      <ul className="divide-y divide-stone-200">
        {areas.map((area) => (
          <li
            key={area.id}
            className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex min-w-0 items-start gap-4">
              <img
                src={area.imageUrl}
                alt=""
                className="h-20 w-24 shrink-0 rounded-md border border-[#e7d4b8] object-cover"
              />
              <div className="min-w-0">
                <div className="mb-1 text-xs text-stone-500">{area.visible ? 'Visible' : 'Hidden'}</div>
                <h2 className="font-semibold text-[#820d0d]">{area.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                  {area.description || 'Details coming soon'}
                </p>
                <p className="mt-1 text-xs text-stone-500">{area.professorNames.length} related professors</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="admin-secondary"
                data-admin-action="edit"
                disabled={disabled}
                onClick={() => onEdit(area)}
              >
                Edit
              </button>
              <button
                type="button"
                className="admin-secondary"
                data-admin-action={area.visible ? 'hide' : 'show'}
                disabled={disabled}
                onClick={() => onToggle(area)}
              >
                {area.visible ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="admin-secondary"
                data-admin-action="delete"
                disabled={disabled}
                onClick={() => onDelete(area)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!areas.length && (
        <p className="py-10 text-center text-sm text-stone-500">
          No research areas yet. Add one to get started.
        </p>
      )}
    </section>
  );
}
