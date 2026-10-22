import { getPublicPeopleMenu } from '@/server/faculty/public';

export async function GET() {
  const people = await getPublicPeopleMenu();
  return Response.json({ people }, { headers: { 'Cache-Control': 'private, no-store' } });
}
