import { requirePageActor } from '@/server/auth/page-access';
import { getOwnFacultyEditor } from '@/server/faculty/editor';
import FacultyProfileEditor from '@/features/faculty/FacultyProfileEditor';
import { redirect } from 'next/navigation';

export default async function FacultyProfilePage() {
  const actor = await requirePageActor('faculty.self.read');
  if (actor.role === 'ADMIN') redirect('/admin/people');
  return <FacultyProfileEditor initialState={await getOwnFacultyEditor(actor)} />;
}
