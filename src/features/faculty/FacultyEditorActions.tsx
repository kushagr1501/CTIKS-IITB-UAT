import Link from 'next/link';
import type { FacultyEditorState } from './profile-schema';
import profileStyles from '@/features/people/components/FacultyProfile.module.css';
import styles from './FacultyProfileEditor.module.css';

type Props = {
  identity: FacultyEditorState['identity'];
  hasDraft: boolean;
  autosaving: boolean;
  dirty: boolean;
  areaInput: string;
  busy: boolean;
  error: string;
  message: string;
  onSave: (action: 'save' | 'discard') => Promise<void>;
};

export default function FacultyEditorActions({
  identity,
  hasDraft,
  autosaving,
  dirty,
  areaInput,
  busy,
  error,
  message,
  onSave,
}: Props) {
  return (
    <div className={styles.actionRail}>
      <div className={`${profileStyles.shell} ${styles.editorShell} ${styles.actionInner}`}>
        <div className={styles.actionMeta}>
          {!identity.visible && (
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
                  : hasDraft
                    ? 'You are editing a saved draft.'
                    : 'You are editing your current profile.'}
          </div>
          {error && (
            <p role="alert" className="text-sm text-white">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-white">
              {message}
            </p>
          )}
          <div className={styles.actionButtons}>
            <button type="submit" className={styles.publishButton} disabled={busy}>
              {busy && !autosaving ? 'Saving…' : 'Submit & publish'}
            </button>
            <button
              type="button"
              className={styles.saveButton}
              disabled={busy}
              onClick={() => void onSave('save')}
            >
              {autosaving ? 'Autosaving…' : 'Save draft'}
            </button>
            {hasDraft && (
              <button
                type="button"
                className={styles.minorAction}
                disabled={busy}
                onClick={() => void onSave('discard')}
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
        {identity.visible && (
          <Link href={`/people/${identity.slug}`} target="_blank" className={styles.viewButton}>
            View public profile ↗
          </Link>
        )}
      </div>
    </div>
  );
}
