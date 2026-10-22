'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FacultyPortrait from '@/features/people/components/FacultyPortrait';
import profileStyles from '@/features/people/components/FacultyProfile.module.css';
import AcademicEntries from './AcademicEntries';
import { collections } from './entry-fields';
import styles from './FacultyProfileEditor.module.css';
import { academicContentSchema, type AcademicContent, type FacultyEditorState } from './profile-schema';

function localMediaUrls(value: unknown): string[] {
  if (typeof value === 'string') return /^\/api\/local-media\/[a-z0-9][a-z0-9-]{0,79}\.(?:jpg|png|webp|pdf)$/i.test(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(localMediaUrls);
  if (value && typeof value === 'object') return Object.values(value).flatMap(localMediaUrls);
  return [];
}

export default function FacultyProfileEditor({ initialState }: { initialState: FacultyEditorState }) {
  const [state, setState] = useState(initialState);
  const allowLocalUploads = initialState.identity.slug === 'vijayaraghavan-m-chariar';
  const [content, setContent] = useState(initialState.content);
  const [areaInput, setAreaInput] = useState('');
  const [areaError, setAreaError] = useState('');
  const [busy, setBusy] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [publishNotice, setPublishNotice] = useState('');
  const uploadedMedia = useRef(new Set<string>());
  const saving = useRef(false);
  const lastAutosaveAttempt = useRef('');
  const saveRef = useRef<(action: 'save' | 'publish' | 'discard', automatic?: boolean) => Promise<void>>(
    async () => {},
  );
  const contentKey = JSON.stringify(content);
  const dirty = contentKey !== JSON.stringify(state.content) || areaInput.trim().length > 0;
  useEffect(() => {
    if (!publishNotice) return;
    const timer = window.setTimeout(() => setPublishNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [publishNotice]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function setField<K extends keyof AcademicContent>(key: K, value: AcademicContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
    setMessage('');
    setPublishNotice('');
  }
  function rememberUploadedMedia(url: string) {
    uploadedMedia.current.add(url);
  }
  function addResearchArea() {
    const area = areaInput.trim();
    if (!area) return;
    const result = academicContentSchema.shape.researchTags.safeParse([...content.researchTags, area]);
    if (!result.success) {
      setAreaError(result.error.issues[0].message);
      return;
    }
    setField('researchTags', result.data);
    setAreaInput('');
    setAreaError('');
  }
  async function save(action: 'save' | 'publish' | 'discard', automatic = false) {
    if (saving.current) return;
    if (
      action === 'discard' &&
      !window.confirm(
        'Discard the saved draft and any unsaved edits? Your published profile will stay as it is.',
      )
    )
      return;
    setError('');
    setMessage('');
    setPublishNotice('');
    const parsed = academicContentSchema.safeParse({
      ...content,
      researchTags: areaInput.trim() ? [...content.researchTags, areaInput.trim()] : content.researchTags,
    });
    if (action !== 'discard' && !parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue.path
        .map((part) => (typeof part === 'number' ? `entry ${part + 1}` : part))
        .join(' → ');
      setError(`${path}: ${issue.message}`);
      if (issue.path[0] === 'researchTags') setAreaError(issue.message);
      if (!automatic) {
        document
          .getElementById(`editor-${String(issue.path[0])}`)
          ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      return;
    }
    saving.current = true;
    setBusy(true);
    setAutosaving(automatic);
    let cleanupFailed = false;
    try {
      const csrfResponse = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!csrfResponse.ok) throw new Error('Your session could not be verified. Sign in again.');
      const csrf = await csrfResponse.json();
      const response = await fetch('/api/faculty/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.token },
        body: JSON.stringify({
          action,
          profileVersion: state.profileVersion,
          draftVersion: state.draftVersion,
          content: action === 'discard' ? state.content : parsed.data,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const diagnostic =
          process.env.NODE_ENV === 'development' && typeof result.diagnostic === 'string'
            ? ` (${result.diagnostic})`
            : '';
        throw new Error(`${result.error || 'The profile could not be saved. Please try again.'}${diagnostic}`);
      }
      const next = result.faculty as FacultyEditorState;
      const retainedMedia = new Set(localMediaUrls(next.content));
      const obsoleteMedia = [...new Set([...localMediaUrls(state.content), ...uploadedMedia.current])]
        .filter((url) => !retainedMedia.has(url));
      for (let index = 0; index < obsoleteMedia.length; index += 100) {
        try {
          const cleanupResponse = await fetch('/api/faculty/profile/media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.token },
            body: JSON.stringify({ urls: obsoleteMedia.slice(index, index + 100) }),
          });
          if (!cleanupResponse.ok) cleanupFailed = true;
        } catch {
          cleanupFailed = true;
        }
      }
      for (const url of retainedMedia) uploadedMedia.current.delete(url);
      if (!cleanupFailed) for (const url of obsoleteMedia) uploadedMedia.current.delete(url);
      setState(next);
      setContent(next.content);
      setAreaInput('');
      setAreaError('');
      const successMessage =
        action === 'save'
          ? automatic
            ? 'Draft saved automatically. Your public profile has not changed.'
            : 'Draft saved. Your public profile has not changed.'
          : action === 'discard'
            ? 'Draft discarded. The current profile is loaded.'
            : next.identity.visible
              ? 'Published. Your changes are live on the website.'
              : 'Content updated. This profile remains hidden until the administrator makes it visible.';
      setMessage(action === 'publish' ? '' : successMessage);
      if (action === 'publish') setPublishNotice(successMessage);
      if (cleanupFailed) setMessage('Some unused local files could not be cleaned up.');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The profile could not be saved. Your edits are still here.',
      );
    } finally {
      saving.current = false;
      setBusy(false);
      setAutosaving(false);
    }
  }
  saveRef.current = save;
  useEffect(() => {
    if (
      !dirty ||
      busy ||
      areaInput.trim() ||
      lastAutosaveAttempt.current === contentKey
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      lastAutosaveAttempt.current = contentKey;
      void saveRef.current('save', true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [areaInput, busy, contentKey, dirty]);
  function textField(
    key:
      | 'name'
      | 'designation'
      | 'department'
      | 'biography'
      | 'imageUrl'
      | 'websiteUrl'
      | 'publicEmail'
      | 'interests'
      | 'researchOverview'
      | 'officeAddress'
      | 'publicPhone',
    label: string,
    max: number,
    rows?: number,
    type = 'text',
    appearance: 'default' | 'profileName' | 'profileDesignation' | 'profileDepartment' | 'profileBio' | 'contact' = 'default',
  ) {
    const profileText = appearance.startsWith('profile');
    const inputClass = [
      styles.control,
      rows ? styles.textarea : '',
      appearance === 'profileName' ? styles.profileName : '',
      appearance === 'profileDesignation' ? styles.profileDesignation : '',
      appearance === 'profileDepartment' ? styles.profileDepartment : '',
      appearance === 'profileBio' ? styles.profileBio : '',
      appearance === 'contact' ? styles.contactControl : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <label className={`${styles.field} ${profileText ? styles.profileField : ''} ${rows && !profileText ? 'sm:col-span-2' : ''}`}>
        <span>{label}</span>
        {rows ? (
          <textarea
            className={inputClass}
            value={content[key]}
            maxLength={max}
            rows={rows}
            onChange={(event) => setField(key, event.target.value)}
          />
        ) : (
          <input
            className={inputClass}
            type={type}
            value={content[key]}
            maxLength={max}
            onChange={(event) => setField(key, event.target.value)}
          />
        )}
      </label>
    );
  }
  return (
    <div className={styles.canvas}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save('publish');
        }}
      >
        <div className={styles.actionRail}>
          <div className={`${profileStyles.shell} ${styles.editorShell} ${styles.actionInner}`}>
            <div className={styles.actionMeta}>
              {!state.identity.visible && (
                <p className={styles.visibilityNotice}>
                  Your profile is hidden from the website. Ask an administrator to make it visible.
                </p>
              )}
              <div aria-live="polite" className={styles.status}>
                {autosaving
                  ? 'Saving draft automatically…'
                  : dirty && areaInput.trim()
                    ? 'Add your research area to include it in the saved draft.'
                    : dirty
                      ? 'Unsaved changes · draft will save automatically.'
                  : state.hasDraft
                    ? 'You are editing a saved draft.'
                    : 'You are editing your current profile.'}
              </div>
              {error && <p role="alert" className="text-sm text-white">{error}</p>}
              {message && <p role="status" className="text-sm text-white">{message}</p>}
              <div className={styles.actionButtons}>
                <button type="submit" className={styles.publishButton} disabled={busy}>
                  {busy && !autosaving ? 'Saving…' : 'Submit & publish'}
                </button>
                <button
                  type="button"
                  className={styles.saveButton}
                  disabled={busy}
                  onClick={() => void save('save')}
                >
                  {autosaving ? 'Autosaving…' : 'Save draft'}
                </button>
                {state.hasDraft && (
                  <button
                    type="button"
                    className={styles.minorAction}
                    disabled={busy}
                    onClick={() => void save('discard')}
                  >
                    Discard draft
                  </button>
                )}
                {error && (
                  <button
                    type="button"
                    className={styles.minorAction}
                    disabled={busy}
                    onClick={() => {
                      if (!dirty || window.confirm('Reload and lose unsaved edits?')) window.location.reload();
                    }}
                  >
                    Reload saved profile
                  </button>
                )}
              </div>
            </div>
            {state.identity.visible && (
              <Link href={`/people/${state.identity.slug}`} target="_blank" className={styles.viewButton}>
                View public profile ↗
              </Link>
            )}
          </div>
        </div>
        {publishNotice && (
          <div className={styles.publishNotice} role="status" aria-live="polite">
            <span className={styles.publishNoticeIcon} aria-hidden="true">✓</span>
            <p>{publishNotice}</p>
            <button
              type="button"
              className={styles.publishNoticeDismiss}
              aria-label="Dismiss confirmation"
              onClick={() => setPublishNotice('')}
            >
              ×
            </button>
          </div>
        )}
        <fieldset disabled={busy} className={`${profileStyles.page} ${styles.page} min-w-0 border-0 p-0`}>
          <div className={profileStyles.content}>
            <div className={`${profileStyles.shell} ${styles.editorShell}`}>
              <section className={styles.profileHeader} aria-label="Edit your profile introduction">
                <div className={styles.profileAside}>
                  <div className={styles.portrait}>
                    <FacultyPortrait name={content.name} image={content.imageUrl || undefined} />
                  </div>
                  <div className={styles.photoField}>
                    {textField('imageUrl', 'Photograph URL (HTTPS or /assets/)', 2048, undefined, 'url')}
                  </div>
                  <div id="editor-office-contact" className={styles.contactPanel}>
                    <p className={styles.contactHeading}>Office & contact</p>
                    {textField('publicEmail', 'Public email', 254, undefined, 'email', 'contact')}
                    {textField('publicPhone', 'Public phone', 100, undefined, 'tel', 'contact')}
                    {textField('officeAddress', 'Office address', 2000, 3, 'text', 'contact')}
                    {textField('websiteUrl', 'Personal website (HTTPS)', 2048, undefined, 'url', 'contact')}
                  </div>
                </div>
                <div className={styles.profileIntro}>
                  <div className={styles.profileIdentity}>
                    {textField('name', 'Name shown on your page', 160, undefined, 'text', 'profileName')}
                    {textField('designation', 'Role / designation', 160, undefined, 'text', 'profileDesignation')}
                    {textField('department', 'Department / affiliation', 300, undefined, 'text', 'profileDepartment')}
                  </div>
                  <div className={styles.profileBiography}>
                    {textField('biography', 'About you', 8000, 6, 'text', 'profileBio')}
                  </div>
                </div>
              </section>
              <nav
                aria-label="Profile sections"
                className={`${profileStyles.navigation} ${styles.sectionNav}`}
              >
                <ul>
                  <li><a href="#editor-education">Education</a></li>
                  <li><a href="#editor-courses">Teaching</a></li>
                  <li><a href="#editor-researchTags">Research areas</a></li>
                  <li><a href="#editor-experience">Work experience</a></li>
                  <li><a href="#editor-publications">Publications</a></li>
                  <li><a href="#editor-patents">Patents</a></li>
                  <li><a href="#editor-graduated-students">Graduated students</a></li>
                  <li><a href="#editor-current-students">Current students</a></li>
                  <li><a href="#editor-office-contact">Office & contact</a></li>
                </ul>
              </nav>
              <div className={styles.sectionList}>
                <div className={styles.collectionWrap}>
                  <AcademicEntries
                    name="education"
                    rows={content.education}
                    {...collections.education}
                    onChange={(rows) => setField('education', rows)}
                  />
                </div>
                <div className={styles.collectionWrap}>
                  <AcademicEntries
                    name="courses"
                    rows={content.courses}
                    {...collections.courses}
                    onChange={(rows) => setField('courses', rows)}
                  />
                </div>
                <section className={profileStyles.section} id="editor-researchTags">
                  <div className={profileStyles.sectionHeading}><h2>Research areas</h2></div>
                  <div className={`${profileStyles.sectionContent} grid gap-5`}>
                    {textField('interests', 'Short description on faculty card', 1500, 2)}
                    <div>
                      <label htmlFor="research-area-input" className={`${styles.field} mb-2`}>
                        Add a research area
                      </label>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <input
                          id="research-area-input"
                          className={`${styles.control} min-w-0 flex-1`}
                          placeholder="e.g. Indian astronomy"
                          value={areaInput}
                          maxLength={100}
                          disabled={content.researchTags.length >= 30}
                          aria-invalid={Boolean(areaError)}
                          aria-describedby={`research-area-help${areaError ? ' research-area-error' : ''}`}
                          onChange={(event) => {
                            setAreaInput(event.target.value);
                            setAreaError('');
                            setMessage('');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                              event.preventDefault();
                              addResearchArea();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="admin-primary shrink-0 !py-2.5"
                          disabled={!areaInput.trim() || content.researchTags.length >= 30}
                          onClick={addResearchArea}
                        >
                          Add
                        </button>
                      </div>
                      <p id="research-area-help" className="mt-2 text-sm text-stone-600">
                        {content.researchTags.length}/30 areas · Up to 100 characters each. Press Enter or Add.
                      </p>
                      {areaError && (
                        <p id="research-area-error" role="alert" className="mt-2 text-sm text-red-700">
                          {areaError}
                        </p>
                      )}
                      {content.researchTags.length > 0 && (
                        <ul className={`${profileStyles.tags} mt-4`} aria-label="Selected research areas">
                          {content.researchTags.map((area, index) => (
                            <li key={`${area}-${index}`}>
                              <span>{area}</span>
                              <button
                                type="button"
                                aria-label={`Remove research area ${area}`}
                                className="ml-2 text-lg text-ctiks-maroon hover:text-ctiks-red"
                                onClick={() => {
                                  setField(
                                    'researchTags',
                                    content.researchTags.filter((_, position) => position !== index),
                                  );
                                  setAreaError('');
                                }}
                              >
                                <span aria-hidden="true">×</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {textField('researchOverview', 'Research overview', 8000, 5)}
                  </div>
                </section>
                <div className={styles.collectionWrap}>
                  <AcademicEntries
                    name="experience"
                    rows={content.experience}
                    {...collections.experience}
                    onChange={(rows) => setField('experience', rows)}
                  />
                </div>
                <div className={styles.collectionWrap}>
                  <AcademicEntries
                    name="publications"
                    rows={content.publications}
                    {...collections.publications}
                    allowLocalUploads={allowLocalUploads}
                    onLocalMediaUploaded={rememberUploadedMedia}
                    onChange={(rows) => setField('publications', rows)}
                  />
                </div>
                <div className={styles.collectionWrap}>
                  <AcademicEntries
                    name="patents"
                    rows={content.patents}
                    {...collections.patents}
                    allowLocalUploads={allowLocalUploads}
                    onLocalMediaUploaded={rememberUploadedMedia}
                    onChange={(rows) => setField('patents', rows)}
                  />
                </div>
                {(['GRADUATED', 'CURRENT'] as const).map((status) => {
                  const rows = content.students.filter((student) => student.status === status);
                  const label = status === 'GRADUATED' ? 'Graduated students' : 'Current students';
                  return (
                    <div key={status} className={styles.collectionWrap}>
                      <AcademicEntries
                        name="students"
                        {...collections.students}
                        allowLocalUploads={allowLocalUploads}
                        onLocalMediaUploaded={rememberUploadedMedia}
                        sectionId={`editor-${status === 'GRADUATED' ? 'graduated' : 'current'}-students`}
                        label={label}
                        rows={rows}
                        create={() => ({ ...collections.students.create(), status })}
                        onChange={(updatedRows) =>
                          setField('students', [
                            ...content.students.filter((student) => student.status !== status),
                            ...updatedRows.map((row) =>
                              row.status === 'CURRENT' ? { ...row, graduationYear: null } : row,
                            ),
                          ])
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
