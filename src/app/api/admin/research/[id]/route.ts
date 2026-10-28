import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { deleteResearchArea, updateResearchArea } from '@/server/research/service';

type Context = { params: Promise<{ id: string }> };
export function PATCH(request: Request, { params }: Context) {
  return authorizedRequest(request, 'research.update', async (actor) =>
    Response.json({ area: await updateResearchArea(actor, (await params).id, await readJson(request)) }),
  );
}
export function DELETE(request: Request, { params }: Context) {
  return authorizedRequest(request, 'research.delete', async (actor) =>
    Response.json({ deleted: await deleteResearchArea(actor, (await params).id, await readJson(request)) }),
  );
}
