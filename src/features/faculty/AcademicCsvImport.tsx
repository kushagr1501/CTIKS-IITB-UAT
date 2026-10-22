'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { academicContentSchema, type AcademicContent } from './profile-schema';

type ImportableCollection = 'publications' | 'patents';
type Publication = AcademicContent['publications'][number];
type Patent = AcademicContent['patents'][number];
type ImportedEntry = Publication | Patent;
type CsvColumn = { header: string; key: string };

const columns: Record<ImportableCollection, CsvColumn[]> = {
  publications: [
    { header: 'Title', key: 'title' },
    { header: 'Type [Journal article / Conference paper / Book / Book chapter / Research monograph]', key: 'type' },
    { header: 'Authors', key: 'authors' },
    { header: 'Where was it published?', key: 'venue' },
    { header: 'Year', key: 'year' },
    { header: 'DOI', key: 'doi' },
    { header: 'Publication link (HTTPS)', key: 'url' },
    { header: 'Full citation', key: 'citation' },
  ],
  patents: [
    { header: 'Title', key: 'title' },
    { header: 'Inventors', key: 'inventors' },
    { header: 'Patent number', key: 'identifier' },
    { header: 'Status', key: 'status' },
    { header: 'Year', key: 'year' },
    { header: 'Patent link (HTTPS)', key: 'url' },
    { header: 'Description', key: 'description' },
  ],
};

const publicationTypes: Record<string, Publication['type']> = {
  JOURNAL_ARTICLE: 'JOURNAL_ARTICLE',
  'JOURNAL ARTICLE': 'JOURNAL_ARTICLE',
  CONFERENCE_PAPER: 'CONFERENCE_PAPER',
  'CONFERENCE PAPER': 'CONFERENCE_PAPER',
  BOOK: 'BOOK',
  BOOK_CHAPTER: 'BOOK_CHAPTER',
  'BOOK CHAPTER': 'BOOK_CHAPTER',
  RESEARCH_MONOGRAPH: 'RESEARCH_MONOGRAPH',
  'RESEARCH MONOGRAPH': 'RESEARCH_MONOGRAPH',
};

function parseCsv(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += character;
      }
      continue;
    }

    if (closedQuote) {
      if (character === ',') {
        row.push(field);
        field = '';
        closedQuote = false;
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && text[index + 1] === '\n') index += 1;
        row.push(field);
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        field = '';
        closedQuote = false;
      } else if (character !== ' ' && character !== '\t') {
        throw new Error(`Unexpected character after a quoted value near row ${rows.length + 1}.`);
      }
      continue;
    }

    if (character === '"') {
      if (field.length) throw new Error(`Unexpected quote near row ${rows.length + 1}.`);
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error(`A quoted value is not closed near row ${rows.length + 1}.`);
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase();
}

function makeTemplate(collection: ImportableCollection) {
  const header = columns[collection].map(({ header: title }) => `"${title.replaceAll('"', '""')}"`).join(',');
  return `${header}\r\n`;
}

function downloadTemplate(collection: ImportableCollection) {
  const blob = new Blob([makeTemplate(collection)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ctiks-${collection}-template.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvRowsToEntries(collection: ImportableCollection, rows: string[][]): ImportedEntry[] {
  const expected = columns[collection];
  const maximumRows = collection === 'publications' ? 500 : 100;
  if (rows.length - 1 > maximumRows) {
    throw new Error(`This CSV has more than ${maximumRows} data rows. Split it into smaller files.`);
  }
  const headers = rows[0].map(normalizeHeader);
  const wanted = expected.map(({ header }) => normalizeHeader(header));
  if (
    headers.length !== wanted.length ||
    headers.some((header, index) =>
      header !== wanted[index] && !(collection === 'publications' && expected[index].key === 'type' && header === 'type'),
    )
  ) {
    throw new Error(`The columns must match the ${collection} template and stay in this order: ${expected.map(({ header }) => header).join(' · ')}.`);
  }
  if (rows.length === 1) throw new Error('The CSV has the template headers but no data rows.');

  const dataRows = rows.slice(1);
  const rawEntries = dataRows.map((cells, index) => {
    const recordNumber = index + 2;
    if (cells.length !== expected.length) {
      throw new Error(`Row ${recordNumber} has ${cells.length} columns; the template requires ${expected.length}.`);
    }
    const entry: Record<string, string | number | null> = {};
    for (const [columnIndex, column] of expected.entries()) {
      const value = cells[columnIndex].trim();
      if (column.key === 'year') {
        if (value && !/^\d{4}$/.test(value)) throw new Error(`Row ${recordNumber}: Year must be blank or a four-digit year.`);
        entry.year = value ? Number(value) : null;
      } else if (column.key === 'type' && collection === 'publications') {
        const normalized = value.toLocaleUpperCase().replaceAll('_', ' ').replaceAll('-', ' ').replaceAll(/\s+/g, ' ').trim();
        const type = publicationTypes[normalized] ?? publicationTypes[normalized.replaceAll(' ', '_')];
        if (value && !type) {
          throw new Error(`Row ${recordNumber}: Type must be Journal article, Conference paper, Book, Book chapter, or Research monograph.`);
        }
        entry.type = type ?? 'JOURNAL_ARTICLE';
      } else {
        entry[column.key] = value;
      }
    }
    return entry;
  });

  const result =
    collection === 'publications'
      ? academicContentSchema.shape.publications.safeParse(rawEntries)
      : academicContentSchema.shape.patents.safeParse(rawEntries);
  if (!result.success) {
    const issue = result.error.issues[0];
    const recordNumber = typeof issue.path[0] === 'number' ? issue.path[0] + 2 : 2;
    const key = typeof issue.path[1] === 'string' ? issue.path[1] : '';
    const column = expected.find(({ key: columnKey }) => columnKey === key);
    throw new Error(`Row ${recordNumber}${column ? `, ${column.header}` : ''}: ${issue.message}`);
  }

  return result.data as ImportedEntry[];
}

export default function AcademicCsvImport({
  collection,
  currentCount,
  limit,
  onImport,
}: {
  collection: ImportableCollection;
  currentCount: number;
  limit: number;
  onImport: (entries: ImportedEntry[]) => void;
}) {
  const [preview, setPreview] = useState<{ fileName: string; entries: ImportedEntry[] } | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const label = collection === 'publications' ? 'publications' : 'patents';

  useEffect(() => {
    if (dialogOpen) dialogRef.current?.showModal();
    else if (dialogRef.current?.open) dialogRef.current.close();
  }, [dialogOpen]);

  async function selectFile(file?: File) {
    setError('');
    setPreview(null);
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Choose a .csv file.');
      setDialogOpen(true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('This CSV is larger than 5 MB. Split it into smaller files and import them one at a time.');
      setDialogOpen(true);
      return;
    }

    setReading(true);
    try {
      const csvRows = parseCsv(await file.text());
      if (!csvRows.length) throw new Error('The CSV is empty. Download the template and add your entries below its header row.');
      const entries = csvRowsToEntries(collection, csvRows);
      if (currentCount + entries.length > limit) {
        throw new Error(`This import would exceed the ${limit}-entry limit. There is space for ${Math.max(0, limit - currentCount)} more.`);
      }
      setPreview({ fileName: file.name, entries });
      setDialogOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This CSV could not be read. Check the file and try again.');
      setDialogOpen(true);
    } finally {
      setReading(false);
    }
  }

  function addEntries() {
    if (!preview) return;
    if (currentCount + preview.entries.length > limit) {
      setPreview(null);
      setError(`There is no longer enough space for this import. The ${label} limit is ${limit}.`);
      return;
    }
    onImport(preview.entries);
    dialogRef.current?.close();
  }

  return (
    <>
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="admin-secondary min-h-9 !px-3 !py-2 text-sm"
        onClick={() => downloadTemplate(collection)}
      >
        Download CSV template
      </button>
      <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#c28b28]">
        {reading ? 'Reading CSV…' : 'Import CSV'}
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label={`Import ${label} from CSV`}
          disabled={reading || dialogOpen}
          onChange={(event) => {
            void selectFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
        />
      </label>
    </div>
    {dialogOpen && (
    <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        onClose={() => {
          setDialogOpen(false);
          setPreview(null);
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-[#e4cbb1] bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-900/50"
      >
        <div className="p-5 sm:p-7">
          <h3 id={dialogTitleId} className="font-display text-2xl text-ctiks-maroon">
            Import {label} from CSV
          </h3>
          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
              {error}
            </p>
          ) : preview ? (
            <>
              <p className="mt-4 text-sm leading-6">
                {preview.entries.length} {label} checked in <span className="break-all font-medium">{preview.fileName}</span>.
                {' '}Existing entries will stay in place; these will be added after them.
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                {preview.entries.slice(0, 3).map((entry, index) => (
                  <li key={`${entry.title}-${index}`} className="truncate">{entry.title}</li>
                ))}
                {preview.entries.length > 3 && <li>And {preview.entries.length - 3} more</li>}
              </ul>
            </>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" className="admin-secondary" onClick={() => dialogRef.current?.close()}>
              {error ? 'Close' : 'Cancel'}
            </button>
            {preview && !error && (
              <button type="button" className="admin-primary" onClick={addEntries}>
                Add {preview.entries.length} {label}
              </button>
            )}
          </div>
        </div>
      </dialog>
    )}
    </>
  );
}
