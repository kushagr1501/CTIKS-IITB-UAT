import { authorizedRequest } from '@/server/http/authorized-handler';
import { getOwnFacultyEditor, saveOwnFacultyContent } from '@/server/faculty/editor';
import { readJson } from '@/server/http/body';

export function GET(request: Request) {
  return authorizedRequest(request, 'faculty.self.read', async (actor) =>
    Response.json({ faculty: await getOwnFacultyEditor(actor) }),
  );
}

export function PUT(request: Request) {
  return authorizedRequest(request, 'faculty.self.update', async (actor) =>
    Response.json({ faculty: await saveOwnFacultyContent(actor, await readJson(request, 1_048_576)) }),
  );
}
