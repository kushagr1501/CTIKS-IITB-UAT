import { requirePageActor } from '@/server/auth/page-access';
import { getOwnFacultyProfile } from '@/server/faculty/service';

export default async function FacultyProfilePage() {
  const actor = await requirePageActor('faculty.self.read');
  const profile = await getOwnFacultyProfile(actor);
  const details = [
    ['Designation', profile.designation],
    ['Department / affiliation', profile.department],
    ['Research interests', profile.interests],
    ['Biography', profile.biography],
    ['Public email', profile.publicEmail],
    ['Website', profile.websiteUrl],
  ];
  return (
    <>
      <h1 className="font-display text-3xl text-ctiks-maroon">My faculty profile</h1>
      <p className="mb-7 mt-2 text-base leading-7 text-stone-600">
        Profile details are managed by the CTIKS administrator. You can update your login password on the
        Change password page.
      </p>
      <section className="admin-panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <h2 className="text-2xl font-semibold [overflow-wrap:anywhere]">{profile.name}</h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${profile.visible ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}
          >
            {profile.visible ? 'Visible on website' : 'Hidden from website'}
          </span>
        </div>
        <dl className="divide-y divide-stone-200">
          {details.map(([label, value]) => (
            <div key={label} className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
              <dt className="font-medium text-stone-600">{label}</dt>
              <dd className="whitespace-pre-wrap text-base leading-7 [overflow-wrap:anywhere]">
                {value || 'Not set'}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
