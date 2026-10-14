import sharp from 'sharp';

const timezone='America/Los_Angeles';
export const weatherLink='https://forecast.weather.gov/MapClick.php?lat=34.0522&lon=-118.2437';
const dateKey=date=>new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));

export function forecastDays(document, now=new Date()) {
  const data=document.properties;
  if(!data || !Number.isFinite(Date.parse(data.updateTime)) || +now-Date.parse(data.updateTime)>86400000 || Date.parse(data.updateTime)>+now+300000) throw Error('NWS forecast is outdated');
  const periods=data.periods;
  const today=dateKey(now);
  const days=periods.filter(p=>p.isDaytime && dateKey(p.startTime)>=today).slice(0,4).map(day=>{
    const night=periods.find(p=>!p.isDaytime && p.startTime===day.endTime);
    if(!night || day.temperatureUnit!=='F' || night.temperatureUnit!=='F' || !Number.isFinite(day.temperature) || !Number.isFinite(night.temperature)) throw Error('NWS forecast has missing temperatures');
    return {date:dateKey(day.startTime),high:day.temperature,low:night.temperature,condition:day.shortForecast};
  });
  if(days.length!==4 || days[0].date!==today) throw Error('NWS four-day forecast does not start today');
  for(let i=1;i<4;i++) if(Date.parse(days[i].date)-Date.parse(days[i-1].date)!==86400000) throw Error('NWS forecast skips a date');
  return days;
}

function icon(condition) {
  const sun='<circle cx="38" cy="38" r="29" fill="url(#sun)"/>';
  const cloud='<path d="M21 67C-1 65 2 37 23 38C28 14 62 15 69 39C94 35 102 68 77 70H24Z" fill="#c4d5e5" stroke="#acc2d5" stroke-width="2"/>';
  const rain='<path d="M25 81l-6 13M48 81l-6 13M71 81l-6 13" stroke="#4c98ce" stroke-width="5" stroke-linecap="round"/>';
  if(/thunder/i.test(condition)) return cloud+'<path d="M49 59L33 86H48L39 105L68 76H53L64 59Z" fill="#f7bd29"/>';
  if(/snow|sleet|ice/i.test(condition)) return cloud+'<text x="18" y="99" font-size="32" fill="#68a5c9">❄ ❄</text>';
  if(/rain|shower|drizzle/i.test(condition)) return cloud+rain;
  if(/fog|haze|smoke/i.test(condition)) return cloud+'<path d="M10 82H84M18 92H77" stroke="#b5bec7" stroke-width="5" stroke-linecap="round"/>';
  if(/partly|mostly sunny/i.test(condition)) return sun+'<g transform="translate(15 19) scale(.8)">'+cloud+'</g>';
  if(/cloud|overcast/i.test(condition)) return cloud;
  if(/wind|breezy/i.test(condition)) return sun+'<path d="M35 75H83Q99 75 97 62M22 87H72" fill="none" stroke="#94aec2" stroke-width="5" stroke-linecap="round"/>';
  return sun;
}

export async function renderForecast(days) {
  const cells=days.map((d,i)=>{
    const date=new Date(d.date+'T12:00:00-08:00');
    const label=i===0?'Today':new Intl.DateTimeFormat('en-US',{timeZone:timezone,weekday:'short'}).format(date)+' '+Number(d.date.slice(-2));
    return `<g transform="translate(${i*180} 0)"><rect width="178" height="226" rx="12" fill="${i===0?'#ffffff':'#f3f8fe'}"/><text x="89" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="${i===0?'700':'400'}" fill="#38414a">${label}</text><g transform="translate(48 65)">${icon(d.condition)}</g><text x="83" y="199" text-anchor="end" font-family="Arial, sans-serif" font-size="26" fill="#36414b">${d.high}°</text><text x="91" y="199" font-family="Arial, sans-serif" font-size="26" fill="#73808b">${d.low}°</text></g>`;
  }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="226"><defs><radialGradient id="sun" cx="35%" cy="30%"><stop stop-color="#ffe65e"/><stop offset=".75" stop-color="#ffc52c"/><stop offset="1" stop-color="#ff9d19"/></radialGradient></defs>${cells}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function weather(_page,now) {
  async function get(url) {
    const response=await fetch(url,{headers:{'User-Agent':'CRC daily bulletin (https://crcnow.org)','Accept':'application/geo+json'},signal:AbortSignal.timeout(20000)});
    if(!response.ok) throw Error(`NWS HTTP ${response.status}`);
    return response.json();
  }
  const point=await get('https://api.weather.gov/points/34.0522,-118.2437');
  const url=point.properties.forecast;
  if(new URL(url).hostname!=='api.weather.gov') throw Error('Unexpected NWS forecast host');
  const data=await get(url);
  const days=forecastDays(data,now);
  return {bytes:await renderForecast(days),details:{days,updatedAt:data.properties.updateTime,api:url,renderedFrom:'National Weather Service'}};
}
