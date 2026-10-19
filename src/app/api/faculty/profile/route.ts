import { authorizedRequest } from '@/server/http/authorized-handler';
import { getOwnFacultyProfile } from '@/server/faculty/service';

export function GET(request: Request) {
  return authorizedRequest(request, 'faculty.self.read', async (actor) =>
    Response.json({ faculty: await getOwnFacultyProfile(actor) }),
  );
}
