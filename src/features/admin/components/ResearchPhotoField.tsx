type Props = {
  imageUrl: string;
  imageMode: 'url' | 'upload';
  filePreview: string;
  onModeChange: (mode: 'url' | 'upload') => void;
  onFileChange: (file: File | null) => void;
  onUrlChange: (url: string) => void;
};

export default function ResearchPhotoField({
  imageUrl,
  imageMode,
  filePreview,
  onModeChange,
  onFileChange,
  onUrlChange,
}: Props) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="admin-label mb-2">Research card photo *</legend>
      <div
        className="inline-flex rounded-lg border border-[#dec7a7] bg-[#f7ead8] p-1"
        aria-label="Choose photo source"
      >
        <button
          type="button"
          aria-pressed={imageMode === 'url'}
          onClick={() => onModeChange('url')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${imageMode === 'url' ? 'bg-[#820d0d] text-white shadow-sm' : 'text-[#714b33] hover:bg-white/70'}`}
        >
          Paste URL
        </button>
        {process.env.NODE_ENV === 'development' && (
          <button
            type="button"
            aria-pressed={imageMode === 'upload'}
            onClick={() => onModeChange('upload')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${imageMode === 'upload' ? 'bg-[#820d0d] text-white shadow-sm' : 'text-[#714b33] hover:bg-white/70'}`}
          >
            Upload photo
          </button>
        )}
      </div>
      {imageMode === 'url' ? (
        <label key="photo-url" className="admin-label mt-3 block">
          Photo URL
          <input
            className="admin-input"
            type="text"
            placeholder="https://… or /assets/…"
            maxLength={2048}
            required
            value={imageUrl ?? ''}
            onChange={(event) => onUrlChange(event.target.value)}
          />
          <span className="mt-1 block text-xs text-stone-500">
            Paste an HTTPS image URL or an existing site image path.
          </span>
        </label>
      ) : (
        <label key="photo-upload" className="admin-label mt-3 block">
          Choose a photo
          <input
            className="admin-input mt-1 block w-full cursor-pointer p-2 file:mr-3 file:rounded-md file:border-0 file:bg-[#820d0d] file:px-3 file:py-2 file:text-white"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          <span className="mt-1 block text-xs text-stone-500">
            JPEG, PNG, or WebP up to 8 MB. Local development only.
          </span>
        </label>
      )}
      {(filePreview || imageUrl) && (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#ead7bd] bg-[#fffaf2] p-3">
          <img
            className="h-28 w-36 rounded-md object-cover"
            src={filePreview || imageUrl}
            alt={filePreview ? 'Selected photo preview' : 'Current research area photo'}
          />
          <span className="text-sm text-[#65533e]">{filePreview ? 'Selected photo' : 'Current photo'}</span>
        </div>
      )}
    </fieldset>
  );
}
