import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { updateResearchArea } from '@/server/research/service';

export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return authorizedRequest(request, 'research.update', async (actor) =>
    Response.json({
      area: await updateResearchArea(actor, (await params).id, await readJson(request), true),
    }),
  );
}
