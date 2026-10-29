type Props = {
  teacherNames: string[];
  names: string[];
  newProfessor: string;
  onNewProfessorChange: (name: string) => void;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
};

export default function ResearchProfessorField({
  teacherNames,
  names,
  newProfessor,
  onNewProfessorChange,
  onAdd,
  onRemove,
}: Props) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="admin-label mb-2">Related professors</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="admin-label">
          Choose an existing teacher
          <select
            className="admin-input"
            value=""
            onChange={(event) => {
              const name = event.target.value;
              if (name) onAdd(name);
            }}
          >
            <option value="">Select a teacher…</option>
            {teacherNames
              .filter((name) => !names.includes(name))
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <div className="admin-label">
          Or add a new name
          <div className="mt-1 flex gap-2">
            <input
              className="admin-input min-w-0 flex-1"
              value={newProfessor}
              maxLength={160}
              placeholder="Professor's name"
              onChange={(event) => onNewProfessorChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onAdd(newProfessor);
                }
              }}
            />
            <button
              type="button"
              className="admin-secondary shrink-0"
              disabled={!newProfessor.trim()}
              onClick={() => onAdd(newProfessor)}
            >
              Add
            </button>
          </div>
        </div>
      </div>
      {names.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Selected professors">
          {names.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 rounded-full border border-[#e7d4b8] bg-[#faecd9] py-1 pl-3 pr-1 text-sm text-[#714b33]"
            >
              {name}
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#e7d4b8]"
                aria-label={`Remove ${name}`}
                onClick={() => {
                  onRemove(name);
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-stone-500">No professors selected yet.</p>
      )}
      <p className="mt-2 text-xs text-stone-500">
        Existing teachers link to their People page or website. A new name appears as text until a matching
        People entry exists.
      </p>
    </fieldset>
  );
}
