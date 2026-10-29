import type { AcademicContent } from './profile-schema';
import styles from './FacultyProfileEditor.module.css';

type SetTextField = <K extends keyof AcademicContent>(key: K, value: AcademicContent[K]) => void;

export function createFacultyTextField(content: AcademicContent, setField: SetTextField) {
  return function textField(
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
    appearance:
      | 'default'
      | 'profileName'
      | 'profileDesignation'
      | 'profileDepartment'
      | 'profileBio'
      | 'contact' = 'default',
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
      <label
        className={`${styles.field} ${profileText ? styles.profileField : ''} ${rows && !profileText ? 'sm:col-span-2' : ''}`}
      >
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
  };
}
