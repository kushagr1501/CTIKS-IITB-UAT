import { revalidatePath } from 'next/cache';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { createFaculty, listFaculty } from '@/server/faculty/service';

export function GET(request: Request) {
  return authorizedRequest(request, 'faculty.read', async (actor) =>
    Response.json({ faculty: await listFaculty(actor) }),
  );
}

export function POST(request: Request) {
  return authorizedRequest(request, 'faculty.create', async (actor) => {
    const faculty = await createFaculty(actor, await readJson(request));
    revalidatePath('/people');
    return Response.json({ faculty }, { status: 201 });
  });
}
