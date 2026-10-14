import { fetchDailyNews } from '../data/dailyNews';
export async function GET() {
  const {items,fortune,stocks,generatedAt,editionDate}=await fetchDailyNews();
  return new Response(JSON.stringify({generatedAt,editionDate,items,fortune,stocks}), {headers:{'Content-Type':'application/json; charset=utf-8'}});
}
