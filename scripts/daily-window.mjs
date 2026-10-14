const zone='America/Los_Angeles';
export const localDate=now=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const localHour=now=>Number(new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',hourCycle:'h23'}).format(now));
export const isPublishingWindow=now=>localHour(now)>=6 && localHour(now)<17;
export function refreshMode(saved,now=new Date()) {
  if(!isPublishingWindow(now)) return 'hold';
  return saved?.editionDate===localDate(now) && saved?.images?.capturedAt
    && localDate(new Date(saved.images.capturedAt))===localDate(now) ? 'news' : 'full';
}
// Recheck after collection/build: a delayed daytime job cannot cross the cutoff.
export function canPublishEdition(edition,now=new Date()) {
  return isPublishingWindow(now) && edition?.editionDate===localDate(now)
    && !!edition.generatedAt && isPublishingWindow(new Date(edition.generatedAt))
    && Date.parse(edition.generatedAt)<=+now;
}
