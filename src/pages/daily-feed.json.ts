import { fetchDailyNews } from '../data/dailyNews';
export async function GET() {
  return new Response(JSON.stringify({generatedAt:new Date().toISOString(),...await fetchDailyNews()}), {headers:{'Content-Type':'application/json; charset=utf-8'}});
}
