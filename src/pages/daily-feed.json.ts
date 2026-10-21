import savedEdition from '../data/dailyEdition.json';
import { fetchDailyNews } from '../data/dailyNews';
export async function GET() {
  const {items,fortune,stocks,sportsEntertainment,generatedAt,editionDate}=await fetchDailyNews();
  return new Response(JSON.stringify({generatedAt,editionDate,imagesCapturedAt:savedEdition.images?.capturedAt,items,fortune,stocks,sportsEntertainment}), {headers:{'Content-Type':'application/json; charset=utf-8'}});
}
