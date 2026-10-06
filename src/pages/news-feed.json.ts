import { fetchAllNews } from '../data/newsFeeds';

export async function GET() {
  const { items } = await fetchAllNews();
  return new Response(JSON.stringify({ items }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
