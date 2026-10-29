// CRC matrix: exclude organizational/foundation publicity, even when reporter-written.
export function isOrganizationNews(item:{title:string;summary?:string}):boolean {
  const title=item.title.normalize('NFKC');
  if(/광복회|해외\s*독립\s*유공자\s*미주총회|단체\s*소식|재단\s*소식/.test(title))return true;
  const organization=/단체|재단|협회|협의회|지회|지부|동문회|향우회|한인회|상공회의소|\b(?:foundation|association|society|chapter)\b/i;
  const publicity=/명칭\s*변경|이름\s*변경|출범|발족|창립|기념식|기념행사|정기총회|월례회|이사회|이취임|취임|회장|임원|이사장|모금|기금|후원|기부|기탁|성금|장학금\s*전달|시상|수상|갈라|만찬|친목|교류|협약|행사|소식|\b(?:renam\w*|fundrais\w*|gala|banquet|anniversary|ceremony|appoint\w*|board|donat\w*)\b/i;
  return organization.test(title)&&publicity.test(title);
}
