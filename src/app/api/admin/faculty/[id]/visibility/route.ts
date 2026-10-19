import { revalidatePath } from 'next/cache';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { setVisibility } from '@/server/faculty/service';

export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return authorizedRequest(request, 'faculty.update', async (actor) => {
    const { id } = await params;
    const faculty = await setVisibility(actor, id, await readJson(request));
    revalidatePath('/people');
    return Response.json({ faculty });
  });
}
