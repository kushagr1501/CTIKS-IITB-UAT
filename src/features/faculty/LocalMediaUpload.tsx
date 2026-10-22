'use client';

import { useState } from 'react';

async function readResponseJson(response: Response) {
  const body = await response.text();
  if (!body.trim()) throw new Error(`The server returned an empty response (HTTP ${response.status}).`);
  try {
    return JSON.parse(body) as { token?: string; url?: string; error?: string; deleted?: number };
  } catch {
    throw new Error(`The server returned an invalid response (HTTP ${response.status}).`);
  }
}

export default function LocalMediaUpload({
  accept,
  storageName,
  value = '',
  onRemove,
  onUploaded,
  variant = 'inline',
}: {
  accept: 'image/jpeg,image/png,image/webp' | 'application/pdf';
  storageName: string;
  value?: string;
  onRemove?: () => void;
  onUploaded: (url: string) => void;
  variant?: 'inline' | 'profile-picture' | 'photo-choice';
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const isPdf = accept === 'application/pdf';
  const savedLocalFilename = value.match(/^\/api\/local-media\/([^/?#]+\.pdf)$/i)?.[1];
  const attachedFilename = savedLocalFilename
    ? selectedFile?.name ?? savedLocalFilename.replace(/-\d+(?=\.pdf$)/i, '')
    : '';

  function formatFileSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function removePdf() {
    const removedUrl = value;
    onRemove?.();
    setSelectedFile(null);
    setMessage('PDF removed from this edit.');
    setError('');
    if (!/^\/api\/local-media\/[a-z0-9][a-z0-9-]{0,79}\.pdf$/i.test(removedUrl)) return;

    try {
      const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!csrfResponse.ok) throw new Error('Session verification failed.');
      const csrf = await readResponseJson(csrfResponse);
      if (!csrf.token) throw new Error('Session verification failed.');
      const response = await fetch('/api/faculty/profile/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.token },
        body: JSON.stringify({ urls: [removedUrl] }),
      });
      const result = await readResponseJson(response);
      if (!response.ok) throw new Error(result.error || 'File cleanup failed.');
      setMessage(
        result.deleted
          ? 'PDF removed from this edit and deleted from local storage.'
          : 'PDF removed from this edit. A saved profile still uses the file, so it will be cleaned up after you save this change.',
      );
    } catch {
      setError('PDF removed from this edit, but local cleanup could not finish. Save the change to retry cleanup.');
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    if (isPdf && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Choose a PDF file to upload.');
      setMessage('');
      return;
    }
    setSelectedFile({ name: file.name, size: file.size });
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!csrfResponse.ok) throw new Error('Your session could not be verified. Sign in again.');
      const csrf = await readResponseJson(csrfResponse);
      if (!csrf.token) throw new Error('Your session could not be verified. Sign in again.');
      const form = new FormData();
      form.set('file', file);
      form.set('storageName', storageName);
      if (variant === 'profile-picture') form.set('kind', 'profile-picture');
      const response = await fetch('/api/faculty/profile/media', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf.token },
        body: form,
      });
      const result = await readResponseJson(response);
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      if (!result.url) throw new Error('The upload finished without returning a file link.');
      onUploaded(result.url);
      setMessage(
        isPdf
          ? 'Uploaded. Save or publish your profile to keep this file link.'
          : variant === 'photo-choice'
            ? 'Photo uploaded.'
            : 'Uploaded. Save or publish your profile to keep this file link.',
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  if (isPdf && variant === 'inline') {
    return (
      <div
        className={`mt-3 rounded-xl border border-dashed p-4 transition-colors ${
          dragging ? 'border-[#a31b17] bg-[#fff3df]' : 'border-[#d9bea0] bg-[#fffaf3]'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files[0]);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#e4cbb1] bg-white text-[#881716]">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.75v4h4M8.5 14h7m-7 3h5" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#54221d]">
                {attachedFilename || 'Add a publication PDF'}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-stone-600">
                {busy
                  ? 'Uploading…'
                  : attachedFilename
                    ? selectedFile
                      ? `Selected file · ${formatFileSize(selectedFile.size)}`
                      : 'PDF attached · saved with your profile'
                    : 'Drop a PDF here or browse your files · up to 25 MB'}
              </span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {attachedFilename && onRemove && (
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e3c2b9] bg-white px-3 py-2 text-sm font-semibold text-[#881716] transition-colors hover:bg-[#fff1ed] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                onClick={() => void removePdf()}
              >
                Remove PDF
              </button>
            )}
            <label className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#881716] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a3201b] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#c28b28]">
              {busy ? 'Uploading…' : attachedFilename ? 'Replace PDF' : 'Choose PDF'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label={attachedFilename ? 'Replace attached PDF' : 'Choose a PDF to upload'}
                disabled={busy}
                onChange={(event) => {
                  void upload(event.currentTarget.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>
        {message && <p role="status" className="mt-3 text-sm text-[#5d542d]">{message}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
        <p className="mt-3 border-t border-[#eadac7] pt-3 text-xs leading-5 text-stone-500">
          The PDF uploads now; save or publish the profile to keep the change. You can also paste an external link above.
        </p>
      </div>
    );
  }

  if (variant === 'profile-picture') {
    return (
      <span className="profile-picture-upload">
        <label className="profile-picture-upload__button" title={value ? 'Change profile picture' : 'Add profile picture'}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="m14.5 5.5 4 4M4 20l4.2-.8L19.2 8.2a2.12 2.12 0 0 0-3-3L5.2 16.2 4 20Z" />
          </svg>
          <span className="sr-only">{busy ? 'Uploading profile picture' : value ? 'Change profile picture' : 'Add profile picture'}</span>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            aria-label={value ? 'Change profile picture' : 'Add profile picture'}
            disabled={busy}
            onChange={(event) => {
              void upload(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
        {message && <span className="profile-picture-upload__status" role="status">{message}</span>}
        {error && <span className="profile-picture-upload__status" role="alert">{error}</span>}
      </span>
    );
  }

  if (variant === 'photo-choice') {
    return (
      <span className="flex flex-wrap items-center justify-center gap-2 text-sm font-normal leading-6 text-stone-600">
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-[#881716] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a3201b] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#c28b28]">
          {busy ? 'Uploading…' : 'Upload photo'}
          <input
            type="file"
            accept={accept}
            className="sr-only"
            aria-label="Upload student photo"
            disabled={busy}
            onChange={(event) => {
              void upload(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
        {message && <span role="status">{message}</span>}
        {error && <span role="alert" className="text-red-800">{error}</span>}
      </span>
    );
  }

  return (
    <span className="mt-2 flex flex-wrap items-center gap-3 text-sm font-normal leading-6 text-stone-600">
      <label className="cursor-pointer font-medium text-ctiks-maroon underline underline-offset-2">
        {busy ? 'Uploading…' : accept === 'application/pdf' ? 'Upload PDF' : 'Upload photo'}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void upload(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {message && <span role="status">{message}</span>}
    </span>
  );
}
