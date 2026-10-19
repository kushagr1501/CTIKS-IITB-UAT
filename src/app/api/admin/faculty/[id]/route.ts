import { revalidatePath } from 'next/cache';
import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { deleteFaculty, updateFaculty } from '@/server/faculty/service';

export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return authorizedRequest(request, 'faculty.update', async (actor) => {
    const { id } = await params;
    const faculty = await updateFaculty(actor, id, await readJson(request));
    revalidatePath('/people');
    return Response.json({ faculty });
  });
}

export function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return authorizedRequest(request, 'faculty.delete', async (actor) => {
    const { id } = await params;
    const deleted = await deleteFaculty(actor, id, await readJson(request));
    revalidatePath('/people');
    return Response.json({ deleted });
  });
}
