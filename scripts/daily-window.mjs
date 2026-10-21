const zone='America/Los_Angeles';
export const localDate=now=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const localHour=now=>Number(new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',hourCycle:'h23'}).format(now));
export const localMinute=now=>Number(new Intl.DateTimeFormat('en-US',{timeZone:zone,minute:'2-digit'}).format(now));
// Prepare and publish from 5:15am so the live edition can be verified BEFORE 6am.
export const isPublishingWindow=now=>localHour(now)*60+localMinute(now)>=315 && localHour(now)<17;
export function refreshMode(saved,now=new Date()) {
  if(!isPublishingWindow(now)) return 'hold';
  return saved?.editionDate===localDate(now) && saved?.images?.capturedAt
    && localDate(new Date(saved.images.capturedAt))===localDate(now) ? 'news' : 'full';
}
export function canPublishEdition(edition,now=new Date()) {
  return isPublishingWindow(now) && edition?.editionDate===localDate(now)
    && !!edition.generatedAt && isPublishingWindow(new Date(edition.generatedAt))
    && Date.parse(edition.generatedAt)<=+now;
}
