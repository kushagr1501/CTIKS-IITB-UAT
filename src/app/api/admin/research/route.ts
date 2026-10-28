import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { createResearchArea, listResearchAreas } from '@/server/research/service';

export function GET(request: Request) {
  return authorizedRequest(request, 'research.read', async (actor) =>
    Response.json({ areas: await listResearchAreas(actor) }),
  );
}

export function POST(request: Request) {
  return authorizedRequest(request, 'research.create', async (actor) =>
    Response.json({ area: await createResearchArea(actor, await readJson(request)) }, { status: 201 }),
  );
}
